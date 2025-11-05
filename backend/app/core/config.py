from pydantic_settings import BaseSettings
from typing import List
import secrets
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # API
    api_v1_str: str = "/api/v1"
    secret_key: str = secrets.token_urlsafe(32)
    
    # Authentication
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS - Make sure to include all necessary origins
    backend_cors_origins: str = "*"  # For development only. In production, specify exact origins
    
    # Frontend URL (default to production, override in env)
    frontend_url: str = "http://localhost:3000"
    
    # LinkedIn OAuth
    linkedin_client_id: str = ""
    linkedin_client_secret: str = ""
    linkedin_redirect_uri: str = "http://127.0.0.1:8000/api/v1/linkedin/callback"
    
    # Google Cloud AI
    google_cloud_project: str = ""
    
    # Database
    database_url: str = "sqlite:///database.db"

    def get_database_url(self) -> str:
        """Get the database URL."""
        return self.database_url
    
    # Extra settings from environment
    debug: bool = False
    allowed_hosts: str = "localhost,127.0.0.1"
    
    model_config = {
        'env_file': '.env',
        'case_sensitive': False,
        'extra': 'allow'
    }
        
    def get_cors_origins(self) -> List[str]:
        """Get the CORS origins as a list."""
        if isinstance(self.backend_cors_origins, str):
            return [i.strip() for i in self.backend_cors_origins.split(",")]
        return self.backend_cors_origins

settings = Settings()