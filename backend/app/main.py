from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from google.cloud import language_v1
import json
import os

from app.core.config import settings
from app.core.security.middleware import SecurityMiddleware, RequestValidationMiddleware
from app.db import init_db

app = FastAPI(
    title="Free ATS Resume API",
    description="API for transforming LinkedIn profiles into ATS-optimized resumes",
    version="1.0.0"
)

# CORS middleware configuration - must be first!
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),  # Use settings for CORS origins
    allow_credentials=False,  # Don't require credentials
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type"],
    max_age=86400  # Cache preflight requests for 24 hours
)

# Add security middlewares after CORS
app.add_middleware(SecurityMiddleware)
app.add_middleware(RequestValidationMiddleware)

# Initialize database
@app.on_event("startup")
async def on_startup():
    init_db()

# Include routers here
from app.api.v1.router import api_router
app.include_router(api_router, prefix="/api/v1")

# Chat endpoint models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    resume: Dict[str, Any]
    conversationHistory: List[ChatMessage]

class JobDetails(BaseModel):
    companyName: str
    positionName: str
    location: Optional[str] = None
    workType: Optional[str] = None
    salaryRange: Optional[str] = None
    companyLogo: Optional[str] = None
    visaSponsorship: Optional[bool] = None
    foreignersOk: Optional[bool] = None

class ChatResponse(BaseModel):
    response: str
    isJobDescription: bool = False
    jobDetails: Optional[JobDetails] = None

# Initialize Google Cloud Natural Language client
def init_language_client():
    try:
        return language_v1.LanguageServiceClient()
    except Exception as e:
        print(f"Failed to initialize Google Cloud Language client: {e}")
        return None

# Global variable to track initialization
language_client = None

@app.on_event("startup")
async def on_startup():
    global language_client
    init_db()
    language_client = init_language_client()

def extract_job_details(text: str) -> Optional[JobDetails]:
    """Extract job details from text if it appears to be a job description."""
    # Simple heuristic - check for common job posting keywords
    job_keywords = ["hiring", "job opening", "position available", "we're looking for", "join our team"]
    text_lower = text.lower()
    
    if any(keyword in text_lower for keyword in job_keywords):
        # Try to extract basic job details
        lines = text.split('\n')
        company_name = "Unknown Company"
        position_name = "Unknown Position"
        
        for line in lines[:10]:  # Check first 10 lines
            line = line.strip()
            if line and len(line) < 100:  # Reasonable length for company/position
                if not company_name or company_name == "Unknown Company":
                    company_name = line
                elif not position_name or position_name == "Unknown Position":
                    position_name = line
                    break
        
        return JobDetails(
            companyName=company_name,
            positionName=position_name
        )
    
    return None

@app.post("/api/chat", response_model=ChatResponse)
async def process_chat_message(request: ChatRequest):
    """Process a chat message using Google Cloud Natural Language API."""
    global language_client
    
    if not language_client:
        # Try to initialize again
        language_client = init_language_client()
        if not language_client:
            raise HTTPException(
                status_code=500, 
                detail="AI service is not available. Please check Google Cloud configuration."
            )
    
    try:
        # Prepare the conversation context
        resume_data = json.dumps(request.resume, indent=2)
        
        # Build conversation history
        conversation_text = ""
        for msg in request.conversationHistory[-10:]:  # Last 10 messages for context
            role = "Human" if msg.role == "user" else "Assistant"
            conversation_text += f"{role}: {msg.content}\n\n"
        
        # Create the prompt for the AI
        prompt = f"""You are an AI assistant helping with resume optimization and job search advice.

Resume Data:
{resume_data}

Conversation History:
{conversation_text}

Current User Message: {request.message}

Please provide helpful, specific advice related to resume optimization, job search strategies, or career development. If the user shares a job description, analyze how well their resume matches and provide specific recommendations for improvement.

Keep your response concise but informative. Use markdown formatting for better readability."""

        # Use Google Cloud Natural Language API for text analysis
        document = language_v1.Document(
            content=prompt,
            type_=language_v1.Document.Type.PLAIN_TEXT
        )
        
        # Analyze sentiment and entities to understand the context
        sentiment_response = language_client.analyze_sentiment(document=document)
        entities_response = language_client.analyze_entities(document=document)
        
        # Generate a response based on the analysis
        sentiment = sentiment_response.document_sentiment
        entities = entities_response.entities
        
        # Simple response generation based on analysis
        if sentiment.score > 0.3:
            base_response = "I understand you're looking for positive career advice. "
        elif sentiment.score < -0.3:
            base_response = "I see you're concerned about your job search. "
        else:
            base_response = "Let me help you with your resume and job search. "
        
        # Check for job-related keywords
        job_keywords = ["job", "position", "hiring", "application", "interview", "resume", "cv"]
        has_job_context = any(keyword in request.message.lower() for keyword in job_keywords)
        
        if has_job_context:
            base_response += "Based on your resume and the job market trends, here are some recommendations:\n\n"
            base_response += "• **Tailor your resume** to highlight relevant skills and experience\n"
            base_response += "• **Use strong action verbs** to describe your achievements\n"
            base_response += "• **Quantify your impact** with specific metrics where possible\n"
            base_response += "• **Keep it concise** - aim for 1 page for most roles\n\n"
            base_response += "Would you like me to help you optimize specific sections of your resume?"
        else:
            base_response += "I'm here to help with resume optimization, job search strategies, and career development. What specific aspect would you like assistance with?"
        
        ai_response = base_response
        
        # Check if the user message contains a job description
        job_details = extract_job_details(request.message)
        
        return ChatResponse(
            response=ai_response,
            isJobDescription=job_details is not None,
            jobDetails=job_details
        )
        
    except Exception as e:
        print(f"Error processing chat message: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to process your message. Please try again."
        )