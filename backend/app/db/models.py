from sqlmodel import SQLModel, Field, create_engine, Session, Relationship
from datetime import datetime
from typing import Optional, List
import os

# Database configuration
from app.core.config import settings

database_url = settings.get_database_url()
if not database_url.startswith('sqlite:'):
    database_url = 'sqlite:///database.db'
engine = create_engine(database_url, echo=True, connect_args={"check_same_thread": False})

class Resume(SQLModel, table=True):
    __tablename__ = "resume"
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    role: str
    file_path: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    ats_score: Optional[float] = Field(default=None)
    status: str = Field(default="new")  # new, reviewing, approved, rejected
    cover_letter: Optional["CoverLetter"] = Relationship(back_populates="resume")
    chat_sessions: List["ChatSession"] = Relationship(back_populates="resume")

class CoverLetter(SQLModel, table=True):
    __tablename__ = "coverletter"
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    resume_id: int = Field(foreign_key="resume.id")
    file_path: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    resume: Optional[Resume] = Relationship(back_populates="cover_letter")

class ChatMessage(SQLModel, table=True):
    __tablename__ = "chatmessage"
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="chatsession.id")
    content: str
    role: str = Field(default="user")  # user, assistant, system
    created_at: datetime = Field(default_factory=datetime.utcnow)
    session: Optional["ChatSession"] = Relationship(back_populates="messages")

class ChatSession(SQLModel, table=True):
    __tablename__ = "chatsession"
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    resume_id: int = Field(foreign_key="resume.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_message_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)
    resume: Optional[Resume] = Relationship(back_populates="chat_sessions")
    messages: List[ChatMessage] = Relationship(back_populates="session")

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session