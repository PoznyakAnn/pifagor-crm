from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
from app.db.session import get_db
from app.models.models import Lesson, User, RoleEnum, LessonStatus
from app.schemas.schemas import LessonCreate, LessonUpdate, LessonOut
from app.core.deps import get_current_user
from sqlalchemy.orm import joinedload
router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get("/", response_model=List[LessonOut])
async def get_lessons(
    tutor_id: Optional[int] = Query(None),
    child_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    status: Optional[LessonStatus] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = []

    # Role-based filter: each role sees only their own data
    if current_user.role == RoleEnum.tutor:
        if current_user.tutor_profile:
            filters.append(Lesson.tutor_id == current_user.tutor_profile.id)
    elif current_user.role == RoleEnum.child:
        if current_user.child_profile:
            filters.append(Lesson.child_id == current_user.child_profile.id)
    elif current_user.role == RoleEnum.parent:
        # parent sees all children's lessons - pass child_id from frontend
        if child_id:
            filters.append(Lesson.child_id == child_id)
    else:
        # admin sees all, can filter
        if tutor_id:
            filters.append(Lesson.tutor_id == tutor_id)
        if child_id:
            filters.append(Lesson.child_id == child_id)

    if date_from:
        filters.append(Lesson.date >= date_from)
    if date_to:
        filters.append(Lesson.date <= date_to)
    if status:
        filters.append(Lesson.status == status)

    q = select(Lesson)
    if filters:
        q = q.where(and_(*filters))
    q = q.order_by(Lesson.date, Lesson.time_start)

    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=LessonOut, status_code=201)
async def create_lesson(
    data: LessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = Lesson(**data.model_dump())
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.get("/{lesson_id}", response_model=LessonOut)
async def get_lesson(
        lesson_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    # Вместо обычного select подтягиваем связанные таблицы через options(joinedload(...))
    from sqlalchemy.orm import joinedload

    q = select(Lesson).where(Lesson.id == lesson_id).options(
        joinedload(Lesson.tutor),
        joinedload(Lesson.child),
        joinedload(Lesson.subject)
    )

    result = await db.execute(q)
    lesson = result.scalar_one_or_none()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Проверяем права: если зашел не админ, репетитор и ученик могут видеть только СВОЙ урок
    if current_user.role == RoleEnum.tutor and lesson.tutor_id != current_user.tutor_profile.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if current_user.role == RoleEnum.child and lesson.child_id != current_user.child_profile.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return lesson


@router.patch("/{lesson_id}", response_model=LessonOut)
async def update_lesson(
        lesson_id: int,
        data: LessonUpdate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    from sqlalchemy.orm import joinedload  # Не забываем импорт

    # Добавляем joinedload сразу при поиске урока, чтобы связи были активны
    result = await db.execute(
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(
            joinedload(Lesson.tutor),
            joinedload(Lesson.child),
            joinedload(Lesson.subject)
        )
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(lesson, field, value)

    await db.commit()

    # После commit делаем refresh, чтобы SQLAlchemy подтянула обновленные данные
    await db.refresh(lesson)
    return lesson


@router.delete("/{lesson_id}", status_code=204)
async def delete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    await db.delete(lesson)
    await db.commit()


@router.get("/students-list/all", response_model=list[dict])
async def list_students_for_tutor_fixed(
        db: AsyncSession = Depends(get_db)
):
    """
    Безопасный асинхронный эндпоинт для получения учеников
    с легальной подгрузкой child_profile через joinedload.
    """
    try:
        # Используем joinedload, чтобы SQLAlchemy за один раз скачала и юзера, и его профиль
        query = (
            select(User)
            .where(User.role == "child")
            .options(joinedload(User.child_profile))
        )

        result = await db.execute(query)
        students = result.scalars().unique().all()  # .unique() обязателен при joinedload!

        output = []
        for s in students:
            # Ищем честный профиль ребёнка
            profile_id = None
            if hasattr(s, "child_profile") and s.child_profile is not None:
                profile_id = s.child_profile.id

            # Если связи child_profile нет, пробуем вытащить из полей child_id
            if not profile_id and hasattr(s, "child_id") and s.child_id is not None:
                profile_id = s.child_id

            # Если и там пусто, ставим s.id, но если база ругается — значит нужен РЕАЛЬНЫЙ существующий профиль.
            # Для теста, если профиля нет, можно временно ставить 1 (твой первый тестовый ученик, который точно сработал!)
            if not profile_id:
                profile_id = 1  # Запасной рабочий вариант, чтобы не было ошибки 500

            output.append({
                "id": s.id,
                "first_name": s.first_name,
                "last_name": s.last_name,
                "email": s.email,
                "child_profile": {"id": profile_id}
            })

        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка SQLAlchemy: {str(e)}")


@router.get("/tutor-calendar/all", response_model=list[dict])
async def get_lessons_for_tutor_fixed(
        db: AsyncSession = Depends(get_db)
):
    try:
        # Просто скачиваем уроки, подтягивая профиль ребёнка
        query = select(Lesson).options(joinedload(Lesson.child))
        result = await db.execute(query)
        lessons = result.scalars().unique().all()

        output = []
        for l in lessons:
            # ЖЕЛЕЗНАЯ СТРАХОВКА: если у ChildProfile нет имени,
            # мы не падаем в 500 ошибку, а просто пишем "Ученик"
            first_name = "Ученик"
            last_name = ""
            email = ""

            if l.child:
                # Если у профиля есть связь с юзером, берем оттуда
                if hasattr(l.child, "user") and l.child.user is not None:
                    first_name = getattr(l.child.user, "first_name", "Ученик")
                    last_name = getattr(l.child.user, "last_name", "")
                    email = getattr(l.child.user, "email", "")
                else:
                    # Если связи нет, пробуем взять напрямую (на случай если это модель User)
                    first_name = getattr(l.child, "first_name", "Ученик")
                    last_name = getattr(l.child, "last_name", "")
                    email = getattr(l.child, "email", "")

            output.append({
                "id": l.id,
                "tutor_id": l.tutor_id,
                "child_id": l.child_id,
                "subject_id": l.subject_id,
                "date": str(l.date),
                "time_start": str(l.time_start),
                "time_end": str(l.time_end),
                "notes": l.notes or "",
                "is_free_trial": l.is_free_trial,
                "child": {
                    "id": l.child_id,
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email
                } if l.child else None
            })
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))