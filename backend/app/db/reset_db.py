import os
import sys
from pathlib import Path

# Add the parent directory to the Python path
current_dir = Path(__file__).resolve().parent
app_dir = current_dir.parent
sys.path.append(str(app_dir))

from sqlmodel import SQLModel
from app.core.config import settings
from sqlmodel import create_engine
from app.db.models import Resume, CoverLetter, ChatSession, ChatMessage

def reset_db():
    print("Starting database reset...")
    database_url = settings.get_database_url()
    if not database_url.startswith('sqlite:'):
        database_url = 'sqlite:///database.db'
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    
    # Drop all tables
    print("Dropping existing tables...")
    SQLModel.metadata.drop_all(engine)
    db_path = Path(current_dir.parent) / "database.db"
    
    # Remove the existing database file if it exists
    if db_path.exists():
        print(f"Removing existing database at {db_path}")
        db_path.unlink()
    
    print("Creating new tables...")
    SQLModel.metadata.create_all(engine)
    print("Database reset complete!")

if __name__ == "__main__":
    reset_db()