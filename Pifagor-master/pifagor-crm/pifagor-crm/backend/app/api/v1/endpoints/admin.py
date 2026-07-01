import secrets
from typing import List, Optional
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, cast, Date
from sqlalchemy.orm import joinedload
from pydantic import BaseModel  # 🌟 Добавили для Pydantic схемы

from app.db.session import get_db
from app.core.deps import require_admin
from app.models.models import (
    InviteCode, RoleEnum, Lesson, LessonStatus,
    ChildProfile, User, EmailReceipt, ParentProfile, ParentChild  # 🌟 Добавили профили
)
from app.schemas.schemas import (
    InviteCodeCreate, InviteCodeResponse,
    EmailReceiptOut, StudentFinanceRow,
)

router = APIRouter()


# Pydantic схема для ручного бинда
class BaseParentChildLink(BaseModel):
    parent_id: int
    child_id: int


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

@router.get("/receipts", response_model=List[EmailReceiptOut], dependencies=[Depends(require_admin)])
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


@router.post("/receipts/parse-emails", dependencies=[Depends(require_admin)])
async def trigger_email_parsing(db: AsyncSession = Depends(get_db)):
    """Manually trigger email inbox parsing for new EasyPay receipts."""
    from app.services.email_parser import run_email_parse
    count = await run_email_parse(db)
    return {"new_receipts": count, "message": f"Обработано новых чеков: {count}"}


# ─── Finance Report ────────────────────────────────────────────────────────────

@router.get("/finance-report", response_model=List[StudentFinanceRow], dependencies=[Depends(require_admin)])
async def finance_report(
        week_start: Optional[date] = Query(None),
        db: AsyncSession = Depends(get_db),
):
    """Weekly finance report per student."""
    if week_start is None:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

    week_end = week_start + timedelta(days=6)

    # Completed lessons in the week
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

    # Paid receipts in the week (cast datetime to date for correct comparison)
    receipts_res = await db.execute(
        select(EmailReceipt.child_id, func.sum(EmailReceipt.amount).label("total"))
        .where(
            EmailReceipt.child_id.isnot(None),
            cast(EmailReceipt.payment_date, Date) >= week_start,
            cast(EmailReceipt.payment_date, Date) <= week_end,
        )
        .group_by(EmailReceipt.child_id)
    )
    amounts_by_child = {row.child_id: row.total for row in receipts_res}

    all_child_ids = set(lessons_by_child) | set(amounts_by_child)

    if not all_child_ids:
        return []

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


# ─── Ручная привязка Родитель ↔ Ребёнок ────────────────────────────────────────

@router.post("/parent-child/bind", dependencies=[Depends(require_admin)])
async def bind_parent_to_child(payload: BaseParentChildLink, db: AsyncSession = Depends(get_db)):
    """Вручную связать существующего родителя и ребёнка по ID их профилей (Admin only)."""

    # 1. Проверяем, существует ли родитель
    parent_res = await db.execute(select(ParentProfile).where(ParentProfile.id == payload.parent_id))
    parent = parent_res.scalar_one_or_none()
    if not parent:
        raise HTTPException(status_code=404, detail=f"Профиль родителя с ID {payload.parent_id} не найден")

    # 2. Проверяем, существует ли ребёнок
    child_res = await db.execute(select(ChildProfile).where(ChildProfile.id == payload.child_id))
    child = child_res.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail=f"Профиль ребёнка с ID {payload.child_id} не найден")

    # 3. Проверяем дубликаты связей
    exist_res = await db.execute(
        select(ParentChild).where(
            ParentChild.parent_id == payload.parent_id,
            ParentChild.child_id == payload.child_id
        )
    )
    if exist_res.scalar_one_or_none():
        return {"message": "Эта связь уже существует в базе данных"}

    # 4. Создаем запись
    new_relation = ParentChild(
        parent_id=payload.parent_id,
        child_id=payload.child_id
    )
    db.add(new_relation)
    await db.commit()

    return {
        "status": "success",
        "message": f"Родитель (ID {payload.parent_id}) успешно связан с ребёнком (ID {payload.child_id})"
    }