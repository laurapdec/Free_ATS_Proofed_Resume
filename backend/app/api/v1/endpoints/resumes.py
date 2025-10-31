from fastapi import APIRouter

router = APIRouter()


@router.get("/", summary="Resumes root")
async def resumes_root():
    """Simple health endpoint for Resumes-related routes."""
    return {"status": "ok", "service": "resumes"}
