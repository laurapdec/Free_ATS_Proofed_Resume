"""File validation and security checks."""
from typing import List
import magic
import os
from fastapi import UploadFile, HTTPException

class FileValidator:
    # Maximum file size (10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024
    
    # Allowed file types
    ALLOWED_MIME_TYPES = {
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'text/plain': '.txt'
    }
    
    # Maximum files per request
    MAX_FILES_PER_REQUEST = 5
    
    @classmethod
    async def validate_file(cls, file: UploadFile) -> None:
        """Validate a single file upload."""
        # Check file size
        file.file.seek(0, os.SEEK_END)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > cls.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {cls.MAX_FILE_SIZE/1024/1024}MB"
            )
        
        # Read first 2048 bytes for MIME type detection
        header = await file.read(2048)
        await file.seek(0)
        
        # Detect MIME type
        mime_type = magic.from_buffer(header, mime=True)
        
        if mime_type not in cls.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=415,
                detail=f"File type not allowed. Allowed types: {', '.join(cls.ALLOWED_MIME_TYPES.values())}"
            )
    
    @classmethod
    async def validate_files(cls, files: List[UploadFile]) -> None:
        """Validate multiple file uploads."""
        if len(files) > cls.MAX_FILES_PER_REQUEST:
            raise HTTPException(
                status_code=400,
                detail=f"Too many files. Maximum is {cls.MAX_FILES_PER_REQUEST} files per request"
            )
        
        for file in files:
            await cls.validate_file(file)
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize the filename to prevent path traversal attacks."""
        return os.path.basename(filename)