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
from datetime import datetime
from sqlmodel import Session

from app.db.models import Resume, CoverLetter, engine, get_session

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
    try:
        # Validate files
        validate_file(cv)
        if cover_letter:
            validate_file(cover_letter)

        # Create folder structure
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        folder_name = f"{role}_{name.replace(' ', '_')}_{timestamp}"
        folder_path = os.path.join(UPLOAD_DIR, folder_name)
        os.makedirs(folder_path, exist_ok=True)

        # Save resume
        cv_filename = f"CV_{os.path.basename(cv.filename)}"
        cv_path = os.path.join(folder_path, cv_filename)
        with open(cv_path, "wb") as f:
            shutil.copyfileobj(cv.file, f)

        # Create resume record
        db_resume = Resume(
            name=name,
            email=email,
            role=role,
            file_path=cv_path
        )
        session.add(db_resume)
        session.flush()  # Get ID before commit

        # Save cover letter if provided
        cl_path = None
        if cover_letter:
            cl_filename = f"CL_{os.path.basename(cover_letter.filename)}"
            cl_path = os.path.join(folder_path, cl_filename)
            with open(cl_path, "wb") as f:
                shutil.copyfileobj(cover_letter.file, f)
            
            # Create cover letter record
            db_cover_letter = CoverLetter(
                resume_id=db_resume.id,
                file_path=cl_path
            )
            session.add(db_cover_letter)

        session.commit()

        return JSONResponse({
            "message": "Files uploaded successfully",
            "cv_path": cv_path,
            "cover_letter_path": cl_path
        })

    except Exception as e:
        # Cleanup on error
        if 'folder_path' in locals():
            shutil.rmtree(folder_path, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-pdf", summary="Generate PDF from resume data")
async def generate_pdf(resume_data: Dict[Any, Any]):
    """Generate a PDF from the provided resume data."""
    pdf_file = None
    try:
        # Create PDF in a temporary directory
        pdf_dir = os.path.join(UPLOAD_DIR, "temp_pdfs")
        os.makedirs(pdf_dir, exist_ok=True)
        
        # Create a unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pdf_file = os.path.join(pdf_dir, f"resume_{timestamp}.pdf")
        
        # Create the PDF document
        doc = SimpleDocTemplate(
            pdf_file,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )

        # Create styles
        styles = {
            'ContactInfo': ParagraphStyle(
                'ContactInfo',
                fontSize=12,
                spaceAfter=20
            ),
            'Experience': ParagraphStyle(
                'Experience',
                fontSize=12,
                spaceAfter=10
            ),
            'Description': ParagraphStyle(
                'Description',
                fontSize=10,
                leftIndent=20,
                spaceAfter=5
            )
        }

        # Build the PDF content
        story = []
        
        # Contact Information
        if 'contactInfo' in resume_data:
            contact = resume_data['contactInfo']
            story.append(Paragraph(
                f"{contact.get('email', '')}<br/>"
                f"{contact.get('phone', '')}<br/>"
                f"{contact.get('location', {}).get('city', '')}, "
                f"{contact.get('location', {}).get('country', '')}",
                styles['ContactInfo']
            ))

        # Experiences
        if 'experiences' in resume_data:
            for exp in resume_data['experiences']:
                story.append(Paragraph(
                    f"<b>{exp.get('title', '')}</b><br/>"
                    f"{exp.get('company', '')}<br/>"
                    f"{exp.get('location', '')}<br/>"
                    f"{exp.get('startDate', '')} - {exp.get('endDate', '')}<br/>",
                    styles['Experience']
                ))
                for desc in exp.get('description', []):
                    story.append(Paragraph(desc, styles['Description']))

        # Build the PDF
        doc.build(story)

        # Return the PDF file
        return FileResponse(
            pdf_file,
            media_type='application/pdf',
            filename='resume.pdf',
            background=None  # Prevent background task from deleting the file
        )

    except Exception as e:
        # Clean up on error
        if pdf_file and os.path.exists(pdf_file):
            try:
                os.unlink(pdf_file)
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))
