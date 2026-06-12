"""
EasyPay email receipt parser.

Reads emails from the manager's IMAP inbox, finds EasyPay payment receipts,
parses payer name + amount + account number, and saves them to the database.

Environment variables:
  EMAIL_IMAP_HOST     IMAP server host (default: imap.gmail.com)
  EMAIL_IMAP_PORT     IMAP port (default: 993)
  EMAIL_USER          Mailbox login (e.g. manager@pifagor.by)
  EMAIL_PASSWORD      Mailbox password / app password
  LESSON_PRICE        Price per lesson in BYN (default: 80)
"""
import imaplib
import email
import os
import re
import logging
from datetime import datetime
from email.utils import parsedate_to_datetime
from typing import List, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)

IMAP_HOST = os.getenv("EMAIL_IMAP_HOST", "imap.gmail.com")
IMAP_PORT = int(os.getenv("EMAIL_IMAP_PORT", "993"))
EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
LESSON_PRICE = float(os.getenv("LESSON_PRICE", "80"))


def _get_email_body(msg) -> str:
    """Extract plain-text body from email.message.Message."""
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type()
            cd = str(part.get("Content-Disposition", ""))
            if ct == "text/plain" and "attachment" not in cd:
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    body += payload.decode(charset, errors="ignore")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            body = payload.decode(charset, errors="ignore")
    return body


def parse_easypay_receipt(text: str) -> Optional[Dict]:
    """
    Parse an EasyPay email body and return extracted fields.

    Expected format fragments:
      Номер счет-заказа       17803434501989892
      Итого оплачено (руб.):  80.00
      ФИО: Бесецкий Павел Николаевич BY, Сумма счета: 80,00 BYN
      Номер лицевого счета: 1
    """
    # Must look like an EasyPay receipt
    if "easypay" not in text.lower() and "лицевого счета" not in text:
        return None

    result: Dict = {}

    # --- Receipt number ---
    m = re.search(r"Номер счет-заказа\s*[:\s]*([\d]+)", text)
    if m:
        result["receipt_number"] = m.group(1).strip()

    # --- Payer full name ---
    # "ФИО: Бесецкий Павел Николаевич BY" → "Бесецкий Павел Николаевич"
    m = re.search(r"ФИО:\s*([А-ЯЁа-яёA-Za-z]+(?:\s+[А-ЯЁа-яёA-Za-z]+){1,2})", text)
    if m:
        result["payer_name"] = m.group(1).strip()
    else:
        return None  # can't parse without a name

    # --- Amount ---
    # "Итого оплачено (руб.):  80.00"  or  "Сумма счета: 80,00 BYN"
    m = re.search(
        r"(?:Итого оплачено[^:]*:|Сумма счета:)\s*([\d]+[,\.][\d]+)",
        text,
        re.IGNORECASE,
    )
    if m:
        try:
            result["amount"] = float(m.group(1).replace(",", "."))
        except ValueError:
            return None
    else:
        return None  # can't parse without an amount

    # --- Account number (= child_profile.id in the system) ---
    m = re.search(r"Номер лицевого счета:\s*(\d+)", text)
    if m:
        result["account_number"] = int(m.group(1))

    return result


def _fetch_raw_receipts() -> List[Dict]:
    """
    Connect to IMAP, find unread EasyPay emails, parse and return receipts.
    Does NOT mark emails as read — that is intentional so admin can re-parse
    after fixing the parser; you can change UNSEEN to ALL for reprocessing.
    """
    if not EMAIL_USER or not EMAIL_PASSWORD:
        logger.warning("Email credentials not configured — skipping inbox check.")
        return []

    parsed: List[Dict] = []
    try:
        mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
        mail.login(EMAIL_USER, EMAIL_PASSWORD)
        mail.select("INBOX")

        # Search for EasyPay reports (unseen only)
        _, message_ids = mail.search(None, '(FROM "reports@easypay.by")')

        for uid in message_ids[0].split():
            try:
                _, data = mail.fetch(uid, "(RFC822)")
                raw = data[0][1]
                msg = email.message_from_bytes(raw)

                body = _get_email_body(msg)
                receipt = parse_easypay_receipt(body)
                if receipt is None:
                    continue

                # Parse email date
                date_header = msg.get("Date", "")
                try:
                    receipt["payment_date"] = parsedate_to_datetime(date_header)
                except Exception:
                    receipt["payment_date"] = datetime.utcnow()

                receipt["raw_text"] = body[:3000]
                parsed.append(receipt)

            except Exception as e:
                logger.error("Failed to parse email uid=%s: %s", uid, e)

        mail.close()
        mail.logout()
    except Exception as e:
        logger.error("IMAP connection error: %s", e)

    return parsed


async def run_email_parse(db: AsyncSession) -> int:
    """
    Main entry point: fetch, parse, deduplicate and persist new receipts.
    Returns number of new receipts saved.
    """
    from app.models.models import EmailReceipt, ChildProfile

    raw_receipts = _fetch_raw_receipts()
    if not raw_receipts:
        return 0

    saved = 0
    for r in raw_receipts:
        # Deduplicate by receipt_number
        receipt_number = r.get("receipt_number")
        if receipt_number:
            exists = await db.execute(
                select(EmailReceipt).where(EmailReceipt.receipt_number == receipt_number)
            )
            if exists.scalar_one_or_none():
                continue  # already saved

        child_id: Optional[int] = None

        # Try to match by account number first (most reliable)
        account_number = r.get("account_number")
        if account_number:
            cp_res = await db.execute(
                select(ChildProfile).where(ChildProfile.id == account_number)
            )
            if cp_res.scalar_one_or_none():
                child_id = account_number

        # Fallback: match by first two words of payer name against user last_name + first_name
        if child_id is None:
            payer = r.get("payer_name", "")
            parts = payer.split()
            if len(parts) >= 2:
                from app.models.models import User, RoleEnum
                from sqlalchemy import func as sqlfunc
                last = parts[0]
                first = parts[1]
                user_res = await db.execute(
                    select(ChildProfile)
                    .join(ChildProfile.user)
                    .where(
                        User.last_name.ilike(last),
                        User.first_name.ilike(first),
                    )
                )
                cp = user_res.scalar_one_or_none()
                if cp:
                    child_id = cp.id

        receipt_obj = EmailReceipt(
            receipt_number=receipt_number,
            payer_name=r["payer_name"],
            amount=r["amount"],
            payment_date=r.get("payment_date"),
            raw_text=r.get("raw_text"),
            child_id=child_id,
        )
        db.add(receipt_obj)
        saved += 1

    if saved:
        await db.commit()

    logger.info("Email parser: saved %d new receipts.", saved)
    return saved
