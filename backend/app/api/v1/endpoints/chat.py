from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.models import ChatSession, ChatMessage, Resume, get_session

router = APIRouter()

class MessageCreate(BaseModel):
    content: str
    role: str = "user"

class MessageResponse(BaseModel):
    id: int
    content: str
    role: str
    created_at: datetime

class ChatSessionResponse(BaseModel):
    id: int
    resume_id: int
    created_at: datetime
    last_message_at: datetime
    is_active: bool
    messages: List[MessageResponse]

@router.post("/sessions/{resume_id}", response_model=ChatSessionResponse)
async def create_chat_session(
    resume_id: int,
    session: Session = Depends(get_session)
):
    """Create a new chat session for a resume."""
    # Check if resume exists
    resume = session.get(Resume, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Create new chat session
    chat_session = ChatSession(resume_id=resume_id)
    session.add(chat_session)
    session.commit()
    session.refresh(chat_session)
    
    return chat_session

@router.get("/sessions/{resume_id}", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    resume_id: int,
    session: Session = Depends(get_session)
):
    """Get all chat sessions for a resume."""
    resume = session.get(Resume, resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    query = select(ChatSession).where(ChatSession.resume_id == resume_id)
    sessions = session.exec(query).all()
    return sessions

@router.post("/sessions/{session_id}/messages", response_model=MessageResponse)
async def create_message(
    session_id: int,
    message: MessageCreate,
    session: Session = Depends(get_session)
):
    """Add a message to a chat session."""
    chat_session = session.get(ChatSession, session_id)
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    if not chat_session.is_active:
        raise HTTPException(status_code=400, detail="Chat session is closed")
    
    # Create new message
    db_message = ChatMessage(
        session_id=session_id,
        content=message.content,
        role=message.role
    )
    session.add(db_message)
    
    # Update last_message_at
    chat_session.last_message_at = datetime.utcnow()
    
    session.commit()
    session.refresh(db_message)
    
    return db_message

@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    session_id: int,
    limit: Optional[int] = 50,
    session: Session = Depends(get_session)
):
    """Get messages from a chat session."""
    chat_session = session.get(ChatSession, session_id)
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    query = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    messages = session.exec(query).all()
    return list(reversed(messages))  # Return in chronological order

@router.post("/sessions/{session_id}/close")
async def close_session(
    session_id: int,
    session: Session = Depends(get_session)
):
    """Close a chat session."""
    chat_session = session.get(ChatSession, session_id)
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    chat_session.is_active = False
    session.commit()
    
    return {"message": "Chat session closed successfully"}