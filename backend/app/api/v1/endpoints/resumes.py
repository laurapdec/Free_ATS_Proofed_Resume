from fastapi import APIRouter, HTTPException, Response, Depends, File, UploadFile, Form
from fastapi.responses import FileResponse, JSONResponse
from typing import Dict, Any, Optional
import tempfile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.units import inch
import os
import shutil
import traceback
from datetime import datetime
from sqlmodel import Session

from app.db.models import Resume, CoverLetter, engine, get_session
from app.core.config import settings

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def validate_file(file: UploadFile) -> bool:
    """Validate file type and size."""
    allowed_types = ["application/pdf", "application/msword", 
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    max_size = 5 * 1024 * 1024  # 5MB

    content_type = file.content_type
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Read file into memory to check size
    file_data = file.file.read()
    if len(file_data) > max_size:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    # Reset file pointer
    file.file.seek(0)
    return True

@router.get("/", summary="Resumes root")
async def resumes_root():
    """Simple health endpoint for Resumes-related routes."""
    return {"status": "ok", "service": "resumes"}

@router.post("/upload/", summary="Upload resume and cover letter")
async def upload_files(
    name: str = Form(...),
    email: str = Form(...),
    role: str = Form(...),
    cv: UploadFile = File(...),
    cover_letter: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    """Upload resume and optional cover letter files."""
    folder_path = None
    try:
        print(f"Received upload request - name: {name}, email: {email}, role: {role}")
        print(f"CV file: {cv.filename}, content_type: {cv.content_type}")
        
        # Validate files
        validate_file(cv)
        if cover_letter:
            validate_file(cover_letter)

        # Create folder structure
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        folder_name = f"{role}_{name.replace(' ', '_')}_{timestamp}"
        folder_path = os.path.join(UPLOAD_DIR, folder_name)
        os.makedirs(folder_path, exist_ok=True)
        print(f"Created directory: {folder_path}")

        # Save resume
        cv_filename = f"CV_{os.path.basename(cv.filename)}"
        cv_path = os.path.join(folder_path, cv_filename)
        
        print(f"Saving CV to: {cv_path}")
        contents = await cv.read()
        with open(cv_path, "wb") as f:
            f.write(contents)
        
        # Reset file pointer for potential reuse
        await cv.seek(0)

        # Create resume record
        db_resume = Resume(
            name=name,
            email=email,
            role=role,
            file_path=cv_path
        )
        session.add(db_resume)
        session.flush()  # Get ID before commit
        print(f"Created resume record with ID: {db_resume.id}")

        # Save cover letter if provided
        cl_path = None
        if cover_letter:
            cl_filename = f"CL_{os.path.basename(cover_letter.filename)}"
            cl_path = os.path.join(folder_path, cl_filename)
            print(f"Saving cover letter to: {cl_path}")
            cl_contents = await cover_letter.read()
            with open(cl_path, "wb") as f:
                f.write(cl_contents)
            
            # Create cover letter record
            db_cover_letter = CoverLetter(
                resume_id=db_resume.id,
                file_path=cl_path
            )
            session.add(db_cover_letter)
            print(f"Created cover letter record for resume ID: {db_resume.id}")

        session.commit()
        print("Database transaction committed successfully")

        return JSONResponse({
            "message": "Files uploaded successfully",
            "cv_path": cv_path,
            "cover_letter_path": cl_path,
            "resume_id": db_resume.id
        })

    except Exception as e:
        # Cleanup on error
        if 'folder_path' in locals():
            shutil.rmtree(folder_path, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/resume/{resume_id}", summary="Get resume file by ID")
async def get_resume_file(resume_id: int, session: Session = Depends(get_session)):
    """Get the uploaded resume file by ID."""
    try:
        # Get the resume from the database
        resume = session.get(Resume, resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Check if file exists
        if not os.path.exists(resume.file_path):
            raise HTTPException(status_code=404, detail="Resume file not found")
            
        # Get file name from path
        filename = os.path.basename(resume.file_path)
        
        # Determine content type based on file extension
        content_type = 'application/pdf'  # Default to PDF
        if filename.lower().endswith('.doc'):
            content_type = 'application/msword'
        elif filename.lower().endswith('.docx'):
            content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            
        # Return the file
        headers = {
            'Content-Disposition': f'inline; filename="{filename}"',
            'Access-Control-Expose-Headers': 'Content-Disposition',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
        }
        
        return FileResponse(
            path=resume.file_path,
            media_type=content_type,
            filename=filename,
            headers=headers
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import JSONResponse
from app.core.config import settings

@router.options("/generate-pdf")
async def options_latest_resume():
    """Handle OPTIONS request for CORS."""
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@router.get("/generate-pdf", summary="Get the most recently uploaded resume")
async def get_latest_resume(session: Session = Depends(get_session)):
    """Get the ID of the most recently uploaded resume."""
    try:
        print("Attempting to get latest resume...")
        # Get the most recent resume from the database
        resume = session.query(Resume).order_by(Resume.uploaded_at.desc()).first()
        
        if not resume:
            print("No resumes found in database")
            raise HTTPException(status_code=404, detail="No resumes found")
        
        print(f"Found resume with ID: {resume.id}")
        content = {"resume_id": resume.id}
        response = JSONResponse(content=content)
        
        # Add CORS headers
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        
        print(f"Returning response with resume ID: {resume.id}")
        return response
        
    except Exception as e:
        print(f"Error in get_latest_resume: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error retrieving resume: {str(e)}")
        
        print(f"Found resume with path: {resume.file_path}")
        
        # Check if file exists
        if not os.path.exists(resume.file_path):
            print(f"File not found at path: {resume.file_path}")
            print(f"Current working directory: {os.getcwd()}")
            print(f"UPLOAD_DIR: {UPLOAD_DIR}")
            raise HTTPException(status_code=404, detail=f"Resume file not found at {resume.file_path}")
            
        # Get file name from path
        filename = os.path.basename(resume.file_path)
        print(f"Filename: {filename}")
        
        # Determine content type based on file extension
        content_type = 'application/pdf'  # Default to PDF
        if filename.lower().endswith('.doc'):
            content_type = 'application/msword'
        elif filename.lower().endswith('.docx'):
            content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            
        print(f"Content type: {content_type}")
            
        from app.core.config import settings

        # Return the file
        headers = {
            'Content-Disposition': f'inline; filename="{filename}"',
            'Access-Control-Expose-Headers': 'Content-Disposition',
            'Access-Control-Allow-Origin': settings.frontend_url,
            'Access-Control-Allow-Credentials': 'false',
            'Cache-Control': 'no-cache'  # Prevent caching issues
        }
        
        print(f"Attempting to return file: {resume.file_path}")
        
        response = FileResponse(
            path=resume.file_path,
            media_type='application/pdf',  # Always serve as PDF
            filename=filename,
            headers=headers
        )

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_latest_resume: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(status_code=500, detail=f"Error retrieving resume: {str(e)}")
