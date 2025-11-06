from sqlmodel import SQLModel, Field, create_engine, Session, select, Relationship
from datetime import datetime
from typing import Optional, List
import os
from app.core.config import settings

def get_database_url():
    """Get database URL based on environment configuration"""
    # Use PostgreSQL database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return create_engine(database_url, echo=True)
    else:
        # Fallback to SQLite for development
        print("DATABASE_URL not set, falling back to SQLite")
        return create_engine("sqlite:///database.db", echo=True, connect_args={"check_same_thread": False})

# Initialize engine based on configuration
engine = get_database_url()

class User(SQLModel, table=True):
    __tablename__ = "user"
    __table_args__ = {'extend_existing': True}

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    first_name: str
    last_name: str
    password_hash: str
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    subscription_plan: str = Field(default="free")
    subscription_status: str = Field(default="active")
    resumes_used: int = Field(default=0)
    resumes_limit: int = Field(default=5)
    email_notifications: bool = Field(default=True)
    job_alerts: bool = Field(default=True)
    weekly_reports: bool = Field(default=False)

    # Relationships
    resumes: List["Resume"] = Relationship(back_populates="user")

class Resume(SQLModel, table=True):
    __tablename__ = "resume"
    __table_args__ = {'extend_existing': True}

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str
    email: str
    role: str
    file_path: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    ats_score: Optional[float] = Field(default=None)
    status: str = Field(default="new")  # new, reviewing, approved, rejected

    # Relationships
    user: Optional[User] = Relationship(back_populates="resumes")
    cover_letter: Optional["CoverLetter"] = Relationship(back_populates="resume")
    chat_sessions: List["ChatSession"] = Relationship(back_populates="resume")

class CoverLetter(SQLModel, table=True):
    __tablename__ = "coverletter"
    __table_args__ = {'extend_existing': True}

    id: Optional[int] = Field(default=None, primary_key=True)
    resume_id: int = Field(foreign_key="resume.id")
    file_path: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    resume: Optional[Resume] = Relationship(back_populates="cover_letter")

class ChatMessage(SQLModel, table=True):
    __tablename__ = "chatmessage"
    __table_args__ = {'extend_existing': True}

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="chatsession.id")
    content: str
    role: str = Field(default="user")  # user, assistant, system
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    session: Optional["ChatSession"] = Relationship(back_populates="messages")

class ChatSession(SQLModel, table=True):
    __tablename__ = "chatsession"
    __table_args__ = {'extend_existing': True}

    id: Optional[int] = Field(default=None, primary_key=True)
    resume_id: int = Field(foreign_key="resume.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_message_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)

    # Relationships
    resume: Optional[Resume] = Relationship(back_populates="chat_sessions")
    messages: List[ChatMessage] = Relationship(back_populates="session")

def init_db():
    """Initialize database and create all tables"""
    try:
        SQLModel.metadata.create_all(engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Failed to create database tables: {e}")
        # Don't raise exception, just log it
        pass

def get_session():
    """Get database session"""
    try:
        with Session(engine) as session:
            yield session
    except Exception as e:
        print(f"Database session error: {e}")
        raise

def migrate_from_sqlite_to_cloudsql():
    """
    Migration helper to move data from SQLite to Google Cloud SQL
    This function should be run once when switching from SQLite to Cloud SQL
    """
    import sqlite3
    import shutil
    from pathlib import Path

    # Backup current SQLite database
    sqlite_path = Path("database.db")
    if sqlite_path.exists():
        backup_path = sqlite_path.with_suffix('.db.backup')
        shutil.copy2(sqlite_path, backup_path)
        print(f"SQLite database backed up to {backup_path}")

        # Connect to SQLite database
        sqlite_conn = sqlite3.connect('database.db')
        sqlite_cursor = sqlite_conn.cursor()

        # Get Cloud SQL session
        cloud_session = next(get_session())

        try:
            # Migrate users (if any exist in old format)
            sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
            if sqlite_cursor.fetchone():
                print("Migrating users...")
                sqlite_cursor.execute("SELECT * FROM user")
                users = sqlite_cursor.fetchall()

                for user_data in users:
                    # Assuming old format: id, email, first_name, last_name, password_hash, etc.
                    user = User(
                        id=user_data[0],
                        email=user_data[1],
                        first_name=user_data[2],
                        last_name=user_data[3],
                        password_hash=user_data[4],
                        avatar_url=user_data[5] if len(user_data) > 5 else None,
                        created_at=datetime.fromisoformat(user_data[6]) if len(user_data) > 6 else datetime.utcnow(),
                        updated_at=datetime.fromisoformat(user_data[7]) if len(user_data) > 7 else datetime.utcnow(),
                        subscription_plan=user_data[8] if len(user_data) > 8 else "free",
                        subscription_status=user_data[9] if len(user_data) > 9 else "active",
                        resumes_used=user_data[10] if len(user_data) > 10 else 0,
                        resumes_limit=user_data[11] if len(user_data) > 11 else 5,
                        email_notifications=user_data[12] if len(user_data) > 12 else True,
                        job_alerts=user_data[13] if len(user_data) > 13 else True,
                        weekly_reports=user_data[14] if len(user_data) > 14 else False,
                    )
                    cloud_session.add(user)

            # Migrate resumes
            sqlite_cursor.execute("SELECT * FROM resume")
            resumes = sqlite_cursor.fetchall()

            for resume_data in resumes:
                resume = Resume(
                    id=resume_data[0],
                    user_id=resume_data[1] if len(resume_data) > 1 else None,  # May be None for old data
                    name=resume_data[2] if len(resume_data) > 2 else resume_data[1],  # Adjust based on schema
                    email=resume_data[3] if len(resume_data) > 3 else "",
                    role=resume_data[4] if len(resume_data) > 4 else "",
                    file_path=resume_data[5] if len(resume_data) > 5 else resume_data[2],
                    uploaded_at=datetime.fromisoformat(resume_data[6]) if len(resume_data) > 6 else datetime.utcnow(),
                    ats_score=resume_data[7] if len(resume_data) > 7 else None,
                    status=resume_data[8] if len(resume_data) > 8 else "new"
                )
                cloud_session.add(resume)

            # Commit all changes
            cloud_session.commit()
            print("Migration completed successfully!")

        except Exception as e:
            cloud_session.rollback()
            print(f"Migration failed: {e}")
            raise
        finally:
            sqlite_conn.close()
            cloud_session.close()