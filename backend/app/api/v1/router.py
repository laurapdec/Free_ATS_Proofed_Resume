from fastapi import APIRouter

from app.api.v1.endpoints import linkedin, resumes, chat

api_router = APIRouter()

api_router.include_router(linkedin.router, prefix="/linkedin", tags=["linkedin"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])