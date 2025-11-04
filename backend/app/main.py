from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db import init_db

app = FastAPI(
    title="Free ATS Resume API",
    description="API for transforming LinkedIn profiles into ATS-optimized resumes",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Content-Disposition"]
)

# Initialize database
@app.on_event("startup")
async def on_startup():
    init_db()

# Include routers here
from app.api.v1.router import api_router
app.include_router(api_router, prefix="/api/v1")