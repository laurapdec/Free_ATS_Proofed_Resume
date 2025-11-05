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
    allow_origins=settings.get_cors_origins(),  # Use settings for CORS origins
    allow_credentials=False,  # Don't require credentials
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type"],
    max_age=86400  # Cache preflight requests for 24 hours
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