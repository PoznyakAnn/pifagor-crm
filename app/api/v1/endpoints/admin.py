import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db  # Проверь этот импорт (откуда берется сессия БД)
from app.models.models import InviteCode, RoleEnum
# Импортируй свои схемы (замени имя_файла_схем на твое реальное название файла)
from app.schemas.schemas import InviteCodeCreate, InviteCodeResponse

router = APIRouter()


def generate_random_code(prefix: str) -> str:
    # Генерирует красивый код, например: PIF-TUT-FA83C2
    return f"PIF-{prefix.upper()}-{secrets.token_hex(3).upper()}"


@router.post("/invite-codes", response_model=List[InviteCodeResponse])
async def create_invite_codes(payload: InviteCodeCreate, db: AsyncSession = Depends(get_db)):
    # 1. Принудительно приводим к строке и проверяем на пару
    role_str = str(payload.role).strip().lower()

    if role_str in ["pair", "student_parent"]:
        # Создаем код для ученика (child)
        child_code = generate_random_code("CHD")
        child_invite = InviteCode(role=RoleEnum.child, code=child_code, description=payload.description)
        db.add(child_invite)
        await db.flush()  # Генерируем ID для child_invite

        # Создаем код для родителя (parent) и связываем
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

    # 2. Если это одиночный код репетитора
    if role_str == "tutor":
        code_str = generate_random_code("TUT")
        invite = InviteCode(role=RoleEnum.tutor, code=code_str, description=payload.description)
        db.add(invite)
        await db.commit()
        return [invite]

    # 3. Если прилетело что-то совсем странное
    raise HTTPException(status_code=400, detail=f"Неверная роль для генерации кода: {payload.role}")


@router.get("/invite-codes", response_model=List[InviteCodeResponse])
async def list_invite_codes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InviteCode).order_by(InviteCode.created_at.desc()))
    return result.scalars().all()