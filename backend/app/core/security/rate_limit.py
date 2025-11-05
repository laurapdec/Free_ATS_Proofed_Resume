"""Rate limiting functionality for the API.

This module is currently not in use but can be enabled when needed.
"""
from fastapi import Request
from fastapi.responses import JSONResponse
from typing import Dict, Optional
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self._requests: Dict[str, list] = {}
    
    def _cleanup_old_requests(self, client_id: str):
        """Remove requests older than 1 minute."""
        now = datetime.utcnow()
        self._requests[client_id] = [
            req_time for req_time in self._requests[client_id]
            if now - req_time < timedelta(minutes=1)
        ]
    
    async def check_rate_limit(self, request: Request) -> Optional[JSONResponse]:
        """Check if the request should be rate limited."""
        client_id = request.client.host
        now = datetime.utcnow()
        
        if client_id not in self._requests:
            self._requests[client_id] = []
        
        self._cleanup_old_requests(client_id)
        
        if len(self._requests[client_id]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please try again in a minute."
                }
            )
        
        self._requests[client_id].append(now)
        return None

# Global rate limiter instance - can be used when needed
rate_limiter = RateLimiter()