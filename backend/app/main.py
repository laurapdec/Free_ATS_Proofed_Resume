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

def analyze_resume_content(resume: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze resume content and extract key insights."""
    analysis = {
        'skills': [],
        'experience_years': 0,
        'education_level': 'Unknown',
        'industries': [],
        'key_strengths': [],
        'areas_for_improvement': []
    }
    
    # Extract skills
    if resume.get('skills'):
        analysis['skills'] = [skill.get('name', '') for skill in resume['skills'] if skill.get('name')]
    
    # Calculate experience years
    if resume.get('experiences'):
        total_months = 0
        industries = set()
        for exp in resume['experiences']:
            if exp.get('startDate') and exp.get('endDate'):
                # Simple calculation - could be improved
                start_year = int(exp['startDate'].split('-')[0]) if '-' in exp['startDate'] else 2020
                end_year = int(exp['endDate'].split('-')[0]) if '-' in exp['endDate'] else 2024
                if exp['endDate'].lower() == 'present':
                    end_year = 2024
                total_months += (end_year - start_year) * 12
            if exp.get('company'):
                industries.add(exp['company'])
        
        analysis['experience_years'] = total_months // 12
        analysis['industries'] = list(industries)
    
    # Determine education level
    if resume.get('education'):
        degrees = [edu.get('degree', '').lower() for edu in resume['education']]
        if any('phd' in degree or 'doctorate' in degree for degree in degrees):
            analysis['education_level'] = 'PhD'
        elif any('master' in degree or 'ms' in degree or 'ma' in degree for degree in degrees):
            analysis['education_level'] = "Master's"
        elif any('bachelor' in degree or 'bs' in degree or 'ba' in degree for degree in degrees):
            analysis['education_level'] = "Bachelor's"
        elif any('associate' in degree for degree in degrees):
            analysis['education_level'] = "Associate's"
    
    # Generate key strengths
    if analysis['experience_years'] > 5:
        analysis['key_strengths'].append('Extensive professional experience')
    if len(analysis['skills']) > 10:
        analysis['key_strengths'].append('Diverse skill set')
    if analysis['education_level'] in ["Master's", 'PhD']:
        analysis['key_strengths'].append('Advanced education')
    
    # Areas for improvement
    if len(analysis['skills']) < 5:
        analysis['areas_for_improvement'].append('Expand skills section')
    if analysis['experience_years'] < 2:
        analysis['areas_for_improvement'].append('Build more professional experience')
    if not resume.get('publications'):
        analysis['areas_for_improvement'].append('Consider adding publications or projects')
    
    return analysis

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
        # Analyze the user's message first
        message_document = language_v1.Document(
            content=request.message,
            type_=language_v1.Document.Type.PLAIN_TEXT
        )
        
        # Get sentiment and entities from user message
        message_sentiment = language_client.analyze_sentiment(document=message_document)
        message_entities = language_client.analyze_entities(document=message_document)
        
        # Perform comprehensive resume analysis
        resume_analysis = analyze_resume_content(request.resume)
        
        # Analyze conversation history for context
        conversation_context = ""
        user_questions = []
        assistant_responses = []
        
        for msg in request.conversationHistory[-6:]:  # Last 6 messages for context
            if msg.role == "user":
                user_questions.append(msg.content)
                conversation_context += f"User: {msg.content}\n"
            else:
                assistant_responses.append(msg.content)
                conversation_context += f"Assistant: {msg.content}\n"
        
        # Determine user intent and provide appropriate response
        user_message_lower = request.message.lower()
        intent_keywords = {
            'resume_help': ['resume', 'cv', 'curriculum', 'format', 'layout', 'structure'],
            'job_search': ['job', 'position', 'hiring', 'application', 'apply', 'interview', 'career'],
            'skills': ['skill', 'experience', 'qualification', 'competency', 'expertise'],
            'cover_letter': ['cover letter', 'cover-letter', 'motivation', 'introduction'],
            'optimization': ['optimize', 'improve', 'better', 'enhance', 'tailor', 'customize'],
            'ats': ['ats', 'applicant tracking', 'tracking system', 'keyword'],
            'advice': ['help', 'advice', 'suggestion', 'recommendation', 'tip']
        }
        
        detected_intents = []
        for intent, keywords in intent_keywords.items():
            if any(keyword in user_message_lower for keyword in keywords):
                detected_intents.append(intent)
        
        # Generate intelligent response based on intent and resume analysis
        response_parts = []
        
        # Greeting and context awareness
        sentiment_score = message_sentiment.document_sentiment.score
        if sentiment_score > 0.3:
            response_parts.append("Great to see your enthusiasm! ")
        elif sentiment_score < -0.3:
            response_parts.append("I understand this can be challenging. ")
        
        # Main response based on detected intents
        if 'resume_help' in detected_intents or 'optimization' in detected_intents:
            response_parts.append("**Resume Optimization Tips:**\n\n")
            
            if resume_analysis['skills']:
                response_parts.append(f"• **Skills Section**: You have {len(resume_analysis['skills'])} skills listed. Consider prioritizing the most relevant ones for your target roles.\n")
            
            response_parts.append(f"• **Experience**: With {resume_analysis['experience_years']} years of experience, focus on achievements and quantifiable results.\n")
            
            if resume_analysis['strengths']:
                response_parts.append(f"• **Strengths**: {', '.join(resume_analysis['strengths'][:3])}\n")
            
            if resume_analysis['areas_for_improvement']:
                response_parts.append(f"• **Areas to Improve**: {', '.join(resume_analysis['areas_for_improvement'][:2])}\n")
            
            response_parts.append("• **ATS Optimization**: Use industry-standard keywords and keep formatting simple.\n")
            response_parts.append("• **Length**: Aim for 1-2 pages depending on your experience level.\n\n")
            
        elif 'job_search' in detected_intents:
            response_parts.append("**Job Search Strategy:**\n\n")
            response_parts.append("• **Targeted Applications**: Customize each application for the specific role.\n")
            response_parts.append("• **Networking**: Connect with professionals in your target companies.\n")
            response_parts.append("• **LinkedIn**: Keep your profile updated and engage with industry content.\n")
            response_parts.append("• **Follow-up**: Send thank-you notes after interviews.\n\n")
            
        elif 'skills' in detected_intents:
            if resume_analysis['skills']:
                response_parts.append(f"**Your Skills Analysis:** You have expertise in {', '.join(resume_analysis['skills'][:5])}{' and more' if len(resume_analysis['skills']) > 5 else ''}.\n\n")
                response_parts.append("**Skill Development Recommendations:**\n")
                response_parts.append("• Identify gaps between your skills and target job requirements.\n")
                response_parts.append("• Consider online courses or certifications for in-demand skills.\n")
                response_parts.append("• Highlight transferable skills from your experience.\n\n")
                
                if resume_analysis['areas_for_improvement']:
                    response_parts.append(f"**Based on your resume, consider focusing on:** {', '.join(resume_analysis['areas_for_improvement'])}\n\n")
            else:
                response_parts.append("Let's analyze your skills! Share your key competencies and I'll help you present them effectively.\n\n")
                
        elif 'cover_letter' in detected_intents:
            response_parts.append("**Cover Letter Best Practices:**\n\n")
            response_parts.append("• **Personalization**: Address the hiring manager by name when possible.\n")
            response_parts.append("• **Structure**: Introduction, body (2-3 paragraphs), conclusion.\n")
            response_parts.append("• **Focus**: Explain why you're interested and what you bring to the role.\n")
            response_parts.append("• **Length**: Keep it to 3-4 paragraphs, about 250-400 words.\n\n")
            
        elif 'ats' in detected_intents:
            response_parts.append("**ATS-Friendly Resume Tips:**\n\n")
            response_parts.append("• **Keywords**: Include relevant terms from the job description.\n")
            response_parts.append("• **Format**: Use simple fonts (Arial, Calibri) and clear headings.\n")
            response_parts.append("• **File Type**: Save as .docx or PDF, avoid images and complex formatting.\n")
            response_parts.append("• **Sections**: Use standard headings like 'Work Experience', 'Education', 'Skills'.\n\n")
            
        else:
            # General helpful response with personalized resume insights
            response_parts.append("I'm here to help you with your career development! ")
            
            if resume_analysis['experience_years'] > 0:
                response_parts.append(f"With {resume_analysis['experience_years']} years of experience")
                if resume_analysis['education_level']:
                    response_parts.append(f" and a {resume_analysis['education_level']} education")
                response_parts.append(", you have a solid foundation to build upon.\n\n")
            else:
                response_parts.append("Let's build a strong foundation for your career journey.\n\n")
            
            response_parts.append("I can assist with:\n\n")
            response_parts.append("• **Resume optimization** and formatting tips\n")
            response_parts.append("• **Job search strategies** and application advice\n")
            response_parts.append("• **Interview preparation** and common questions\n")
            response_parts.append("• **Career transition** guidance\n")
            response_parts.append("• **Skill development** recommendations\n\n")
            
            if resume_analysis['strengths']:
                response_parts.append(f"**Your key strengths:** {', '.join(resume_analysis['strengths'][:3])}\n\n")
            
            response_parts.append("What specific aspect would you like help with?")
        
        # Add job description analysis if detected
        job_details = extract_job_details(request.message)
        if job_details:
            response_parts.append(f"\n\n**Job Analysis:** I detected a job posting for **{job_details.positionName}** at **{job_details.companyName}**.\n\n")
            response_parts.append("**Next Steps:**\n")
            response_parts.append("• Review the job requirements against your resume\n")
            response_parts.append("• Customize your application materials\n")
            response_parts.append("• Prepare for potential interview questions\n")
            response_parts.append("• Research the company and role\n\n")
            response_parts.append("Would you like me to help you tailor your resume for this specific position?")
        
        ai_response = ''.join(response_parts)
        
        return ChatResponse(
            response=ai_response,
            isJobDescription=job_details is not None,
            jobDetails=job_details
        )
        
    except Exception as e:
        print(f"Error processing chat message: {e}")
        # Fallback response
        fallback_response = """I apologize, but I'm having trouble processing your message right now. Here are some general tips to get you started:

**Resume Basics:**
• Keep it to 1-2 pages
• Use clear, professional formatting
• Highlight achievements with metrics
• Tailor for each job application

**Job Search Tips:**
• Customize your resume for each application
• Network on LinkedIn
• Follow up after interviews
• Research company culture

Feel free to ask me specific questions about resume optimization, job search strategies, or career development!"""
        
        return ChatResponse(
            response=fallback_response,
            isJobDescription=False,
            jobDetails=None
        )