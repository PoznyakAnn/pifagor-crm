import secrets
from typing import List
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.models.models import (
    InviteCode, RoleEnum, Lesson, LessonStatus,
    ChildProfile, User, EmailReceipt
)
from app.schemas.schemas import (
    InviteCodeCreate, InviteCodeResponse,
    EmailReceiptOut, StudentFinanceRow,
)

router = APIRouter()


def generate_random_code(prefix: str) -> str:
    return f"PIF-{prefix.upper()}-{secrets.token_hex(3).upper()}"


@router.post("/invite-codes", response_model=List[InviteCodeResponse])
async def create_invite_codes(payload: InviteCodeCreate, db: AsyncSession = Depends(get_db)):
    role_str = str(payload.role).strip().lower()

    if role_str in ["pair", "student_parent"]:
        child_code = generate_random_code("CHD")
        child_invite = InviteCode(role=RoleEnum.child, code=child_code, description=payload.description)
        db.add(child_invite)
        await db.flush()

        parent_code = generate_random_code("PRN")
        parent_invite = InviteCode(
            role=RoleEnum.parent,
            code=parent_code,
            description=payload.description,
            linked_code_id=child_invite.id
        )
        db.add(parent_invite)
        await db.commit()
        return [child_invite, parent_invite]

    if role_str == "tutor":
        code_str = generate_random_code("TUT")
        invite = InviteCode(role=RoleEnum.tutor, code=code_str, description=payload.description)
        db.add(invite)
        await db.commit()
        return [invite]

    raise HTTPException(status_code=400, detail=f"Неверная роль для генерации кода: {payload.role}")


@router.get("/invite-codes", response_model=List[InviteCodeResponse])
async def list_invite_codes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InviteCode).order_by(InviteCode.created_at.desc()))
    return result.scalars().all()


# ─── Email Receipts ────────────────────────────────────────────────────────────

@router.get("/receipts", response_model=List[EmailReceiptOut])
async def list_receipts(db: AsyncSession = Depends(get_db)):
    """List all parsed email receipts (admin only)."""
    result = await db.execute(
        select(EmailReceipt)
        .options(joinedload(EmailReceipt.child).joinedload(ChildProfile.user))
        .order_by(EmailReceipt.payment_date.desc())
    )
    receipts = result.scalars().unique().all()
    output = []
    for r in receipts:
        student_name = None
        if r.child and r.child.user:
            u = r.child.user
            student_name = f"{u.last_name} {u.first_name}".strip()
        output.append(EmailReceiptOut(
            id=r.id,
            receipt_number=r.receipt_number,
            payer_name=r.payer_name,
            amount=r.amount,
            payment_date=r.payment_date,
            child_id=r.child_id,
            student_name=student_name,
            created_at=r.created_at,
        ))
    return output


@router.post("/receipts/parse-emails")
async def trigger_email_parsing(db: AsyncSession = Depends(get_db)):
    """Manually trigger email inbox parsing for new EasyPay receipts."""
    from app.services.email_parser import run_email_parse
    count = await run_email_parse(db)
    return {"new_receipts": count, "message": f"Обработано новых чеков: {count}"}


# ─── Finance Report ────────────────────────────────────────────────────────────

@router.get("/finance-report", response_model=List[StudentFinanceRow])
async def finance_report(
    week_start: date = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Weekly finance report per student.
    Returns: student name, lessons conducted (completed), lessons paid (from email receipts).
    If week_start is not provided, uses the start of the current week (Monday).
    """
    if week_start is None:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

    week_end = week_start + timedelta(days=6)

    # All completed lessons in the week grouped by child_id
    lessons_res = await db.execute(
        select(Lesson.child_id, func.count(Lesson.id).label("cnt"))
        .where(
            Lesson.status == LessonStatus.completed,
            Lesson.date >= week_start,
            Lesson.date <= week_end,
        )
        .group_by(Lesson.child_id)
    )
    lessons_by_child = {row.child_id: row.cnt for row in lessons_res}

    # All paid receipts grouped by child_id
    receipts_res = await db.execute(
        select(EmailReceipt.child_id, func.sum(EmailReceipt.amount).label("total"))
        .where(
            EmailReceipt.child_id.isnot(None),
            EmailReceipt.payment_date >= week_start,  # type: ignore[arg-type]
            EmailReceipt.payment_date <= week_end,     # type: ignore[arg-type]
        )
        .group_by(EmailReceipt.child_id)
    )
    amounts_by_child = {row.child_id: row.total for row in receipts_res}

    # Gather all child_ids that appear in either set
    all_child_ids = set(lessons_by_child) | set(amounts_by_child)

    if not all_child_ids:
        return []

    # Load child profiles with user names
    cp_res = await db.execute(
        select(ChildProfile)
        .options(joinedload(ChildProfile.user))
        .where(ChildProfile.id.in_(all_child_ids))
    )
    children = {cp.id: cp for cp in cp_res.scalars().unique()}

    from app.services.email_parser import LESSON_PRICE

    rows: List[StudentFinanceRow] = []
    for child_id in sorted(all_child_ids):
        cp = children.get(child_id)
        if not cp or not cp.user:
            continue
        u = cp.user
        conducted = lessons_by_child.get(child_id, 0)
        amount_paid = amounts_by_child.get(child_id, 0.0) or 0.0
        lessons_paid = int(amount_paid // LESSON_PRICE) if LESSON_PRICE else 0

        rows.append(StudentFinanceRow(
            child_id=child_id,
            student_name=f"{u.last_name} {u.first_name}".strip(),
            lessons_conducted=conducted,
            lessons_paid=lessons_paid,
            amount_paid=round(amount_paid, 2),
        ))

    return rows
