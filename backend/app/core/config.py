from pydantic_settings import BaseSettings
from typing import List
import secrets

class Settings(BaseSettings):
    # API
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    
    # Authentication
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: str = "https://atsproofedcv.com,https://www.atsproofedcv.com"
    
    # Frontend URL (default to production, override in env)
    FRONTEND_URL: str = "https://atsproofedcv.com"
    
    # LinkedIn OAuth
    LINKEDIN_CLIENT_ID: str
    LINKEDIN_CLIENT_SECRET: str
    LINKEDIN_REDIRECT_URI: str = "https://atsproofedcv.com/api/auth/linkedin/callback"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/ats_resume"
    
    class Config:
        env_file = ".env"
        
    def get_cors_origins(self) -> List[str]:
        """Get the CORS origins as a list."""
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            return [i.strip() for i in self.BACKEND_CORS_ORIGINS.split(",")]
        return self.BACKEND_CORS_ORIGINS

settings = Settings()