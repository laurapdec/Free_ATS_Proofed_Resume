from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import Optional
from sqlmodel import Session
from app.db.models import Resume, get_session
import os
from app.core.config import settings

router = APIRouter()

@router.get("/serve-pdf/{resume_id}")
async def serve_pdf(resume_id: int, session: Session = Depends(get_session)):
    """Serve a resume PDF file with proper headers."""
    resume = session.get(Resume, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
        
    filename = os.path.basename(resume.file_path)
    
    headers = {
        "Content-Disposition": f'inline; filename="{filename}"',
        "Content-Type": "application/pdf",
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept, Origin",
        "Access-Control-Max-Age": "86400",
    }
    
    return FileResponse(
        path=resume.file_path,
        headers=headers,
        media_type="application/pdf",
        filename=filename
    )