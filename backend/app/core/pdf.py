from pathlib import Path
import os
import shutil
from fastapi.responses import FileResponse
from fastapi import HTTPException

def serve_pdf(file_path: str, filename: str | None = None) -> FileResponse:
    """
    Serve a PDF file with proper headers and error handling.
    """
    try:
        path = Path(file_path)
        if not path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        if not filename:
            filename = path.name

        from app.core.config import settings

        headers = {
            'Content-Disposition': f'inline; filename="{filename}"',
            'Content-Type': 'application/pdf',
            'Access-Control-Allow-Origin': settings.frontend_url,
            'Access-Control-Allow-Credentials': 'false',
            'Cache-Control': 'no-cache'
        }

        return FileResponse(
            path=str(path),
            media_type='application/pdf',
            filename=filename,
            headers=headers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))