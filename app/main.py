import os  # ← Не забудь добавить импорт os в самый верх
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # ← Импортируем модуль статики

from app.api.v1.router import api_router
from app.db.session import engine, Base
from app.api.v1.endpoints import admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (for dev; in prod use Alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Пифагор API",
    version="1.0.0",
    description="Платформа для репетиторов и учеников",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "pifagor-api"}


# ============================================================
#  РАЗДАЧА ФРОНТЕНДА (Добавляем строго в самый конец файла)
# ============================================================

# 1. Вычисляем путь к папке backend/app/static
current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(current_dir, "static")

# 2. Проверяем, существует ли папка, чтобы сервер не падал при запуске
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

# 3. Монтируем папку на корень "/"
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
