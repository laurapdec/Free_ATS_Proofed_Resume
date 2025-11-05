"""Security middleware for the FastAPI application."""
from typing import Callable
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from datetime import datetime
import time

# Initialize rate limiter
"""Security middleware for the FastAPI application."""
from typing import Callable
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from datetime import datetime
import time

class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: FastAPI):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Set start time for request timing
        request.state.start_time = time.time()
        request.state.request_id = datetime.now().strftime("%Y%m%d%H%M%S%f")

        # Add security headers
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
        
        # Add request ID and timing headers
        response.headers["X-Request-ID"] = str(request.state.request_id)
        response.headers["X-Response-Time"] = str(time.time() - request.state.start_time)
        
        return response

class RequestValidationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Set request start time and ID
        request.state.start_time = time.time()
        request.state.request_id = datetime.now().strftime("%Y%m%d%H%M%S%f")
        
        # Validate content length for file uploads
        if request.method == "POST":
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB limit
                return Response(
                    status_code=413,
                    content={"detail": "File too large. Maximum size is 10MB"},
                    media_type="application/json"
                )
        
        response = await call_next(request)
        return response