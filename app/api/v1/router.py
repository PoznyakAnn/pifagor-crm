from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, lessons, public, cabinet

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(lessons.router)
api_router.include_router(public.router)
api_router.include_router(cabinet.router)
