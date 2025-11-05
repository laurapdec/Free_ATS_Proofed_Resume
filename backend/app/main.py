from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.security.middleware import SecurityMiddleware, RequestValidationMiddleware
from app.db import init_db

app = FastAPI(
    title="Free ATS Resume API",
    description="API for transforming LinkedIn profiles into ATS-optimized resumes",
    version="1.0.0"
)

# CORS middleware configuration - must be first!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only. In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add security middlewares after CORS
app.add_middleware(SecurityMiddleware)
app.add_middleware(RequestValidationMiddleware)

# Initialize database
@app.on_event("startup")
async def on_startup():
    init_db()

# Include routers here
from app.api.v1.router import api_router
app.include_router(api_router, prefix="/api/v1")