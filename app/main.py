import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.db.session import engine, Base, async_session_maker
from app.api.v1.endpoints import admin

logger = logging.getLogger(__name__)


async def _daily_email_task():
    """Background task: parse email inbox once a day."""
    from app.services.email_parser import run_email_parse
    while True:
        try:
            async with async_session_maker() as db:
                count = await run_email_parse(db)
                if count:
                    logger.info("Daily email parse: %d new receipts saved.", count)
        except Exception as e:
            logger.error("Daily email parse failed: %s", e)
        # Sleep 24 hours
        await asyncio.sleep(86400)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Start daily email parsing in background
    task = asyncio.create_task(_daily_email_task())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


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
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "pifagor-api"}


current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(current_dir, "static")

if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
