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
    allow_origins=["*"],  # Allow all origins temporarily for debugging
    allow_credentials=False,  # Set to False since we're not using credentials
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["Content-Type", "Content-Disposition"],
    max_age=86400  # Cache preflight requests for 24 hours
)

# Initialize database
@app.on_event("startup")
async def on_startup():
    init_db()

# Include routers here
from app.api.v1.router import api_router
app.include_router(api_router, prefix="/api/v1")