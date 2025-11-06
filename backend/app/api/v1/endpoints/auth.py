from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from datetime import datetime, timedelta
import os
from app.core.config import settings
import secrets
import string
import random
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from sqlmodel import Session, select
from app.db.models import User, get_session

router = APIRouter()
security = HTTPBearer()

# Mock password reset tokens - replace with database in production
reset_tokens = {}

# JWT settings
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    firstName: str
    lastName: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None

class PasswordChange(BaseModel):
    currentPassword: str
    newPassword: str

class UserPreferences(BaseModel):
    emailNotifications: bool = True
    jobAlerts: bool = True
    weeklyReports: bool = False

class UserProfile(BaseModel):
    id: str
    email: str
    firstName: str
    lastName: str
    avatar: Optional[str] = None
    createdAt: str
    subscription: dict
    preferences: UserPreferences

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def generate_reset_token() -> str:
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))

def generate_reset_code():
    """Generate a random 6-digit reset code"""
    return ''.join(random.choices('0123456789', k=6))

def send_password_reset_email(email: str, reset_code: str):
    """Send password reset email with one-time code using SendGrid"""
    try:
        sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        from_email = os.getenv('FROM_EMAIL', 'noreply@yourdomain.com')

        message = Mail(
            from_email=from_email,
            to_emails=email,
            subject='Password Reset Code',
            html_content=f'''
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Code</h2>
                <p>You requested a password reset for your account.</p>
                <p>Your one-time reset code is:</p>
                <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 3px;">{reset_code}</span>
                </div>
                <p>This code will expire in 15 minutes.</p>
                <p>If you didn't request this reset, please ignore this email.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply.</p>
            </div>
            '''
        )

        response = sg.send(message)
        return response.status_code == 202
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), session: Session = Depends(get_session)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user = session.get(User, int(user_id))
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user

@router.post("/register", response_model=dict)
async def register(user_data: UserCreate, session: Session = Depends(get_session)):
    try:
        # Check if user already exists
        existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create new user
        hashed_password = get_password_hash(user_data.password)

        user = User(
            email=user_data.email,
            first_name=user_data.firstName,
            last_name=user_data.lastName,
            password_hash=hashed_password,
            subscription_plan="free",
            subscription_status="active",
            resumes_used=0,
            resumes_limit=5,
            email_notifications=True,
            job_alerts=True,
            weekly_reports=False
        )

        session.add(user)
        session.commit()
        session.refresh(user)

        # Create access token
        access_token = create_access_token(data={"sub": str(user.id)})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "subscription": {
                    "plan": user.subscription_plan,
                    "status": user.subscription_status,
                    "resumesUsed": user.resumes_used,
                    "resumesLimit": user.resumes_limit
                },
                "preferences": {
                    "emailNotifications": user.email_notifications,
                    "jobAlerts": user.job_alerts,
                    "weeklyReports": user.weekly_reports
                }
            }
        }
    except Exception as e:
        print(f"Registration error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=dict)
async def login(user_data: UserLogin, session: Session = Depends(get_session)):
    # Find user by email
    user = session.exec(select(User).where(User.email == user_data.email)).first()

    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "subscription": {
                "plan": user.subscription_plan,
                "status": user.subscription_status,
                "resumesUsed": user.resumes_used,
                "resumesLimit": user.resumes_limit
            },
            "preferences": {
                "emailNotifications": user.email_notifications,
                "jobAlerts": user.job_alerts,
                "weeklyReports": user.weekly_reports
            }
        }
    }

@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserProfile(
        id=str(current_user.id),
        email=current_user.email,
        firstName=current_user.first_name,
        lastName=current_user.last_name,
        avatar=current_user.avatar_url,
        createdAt=current_user.created_at.isoformat(),
        subscription={
            "plan": current_user.subscription_plan,
            "status": current_user.subscription_status,
            "resumesUsed": current_user.resumes_used,
            "resumesLimit": current_user.resumes_limit
        },
        preferences=UserPreferences(
            emailNotifications=current_user.email_notifications,
            jobAlerts=current_user.job_alerts,
            weeklyReports=current_user.weekly_reports
        )
    )

@router.put("/profile", response_model=UserProfile)
async def update_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Update user data
    if user_data.firstName is not None:
        current_user.first_name = user_data.firstName
    if user_data.lastName is not None:
        current_user.last_name = user_data.lastName
    if user_data.email is not None:
        # Check if email is already taken by another user
        existing_user = session.exec(select(User).where(User.email == user_data.email, User.id != current_user.id)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = user_data.email

    current_user.updated_at = datetime.utcnow()
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return UserProfile(
        id=str(current_user.id),
        email=current_user.email,
        firstName=current_user.first_name,
        lastName=current_user.last_name,
        avatar=current_user.avatar_url,
        createdAt=current_user.created_at.isoformat(),
        subscription={
            "plan": current_user.subscription_plan,
            "status": current_user.subscription_status,
            "resumesUsed": current_user.resumes_used,
            "resumesLimit": current_user.resumes_limit
        },
        preferences=UserPreferences(
            emailNotifications=current_user.email_notifications,
            jobAlerts=current_user.job_alerts,
            weeklyReports=current_user.weekly_reports
        )
    )

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Verify current password
    if not verify_password(password_data.currentPassword, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Update password
    current_user.password_hash = get_password_hash(password_data.newPassword)
    current_user.updated_at = datetime.utcnow()
    session.add(current_user)
    session.commit()

    return {"message": "Password changed successfully"}

@router.post("/forgot-password")
async def forgot_password(email_data: dict, session: Session = Depends(get_session)):
    email = email_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    # Find user by email
    user = session.exec(select(User).where(User.email == email)).first()

    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If an account with this email exists, a password reset code has been sent."}

    # Generate reset code
    reset_code = generate_reset_code()
    expiration_time = datetime.utcnow() + timedelta(minutes=15)

    # Store reset code (in production, use database)
    reset_tokens[reset_code] = {
        "user_id": user.id,
        "email": email,
        "expires_at": expiration_time.isoformat()
    }

    # Send password reset email
    email_sent = send_password_reset_email(email, reset_code)

    if not email_sent:
        # Log the error but don't tell the user
        print(f"Failed to send password reset email to {email}")

    return {"message": "If an account with this email exists, a password reset code has been sent."}

@router.post("/reset-password")
async def reset_password(reset_data: dict, session: Session = Depends(get_session)):
    code = reset_data.get("code")
    new_password = reset_data.get("new_password")

    if not code or not new_password:
        raise HTTPException(status_code=400, detail="Code and new password are required")

    # Check if code exists and is valid
    code_data = reset_tokens.get(code)
    if not code_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    # Check if code has expired
    expires_at = datetime.fromisoformat(code_data["expires_at"])
    if datetime.utcnow() > expires_at:
        # Clean up expired code
        del reset_tokens[code]
        raise HTTPException(status_code=400, detail="Reset code has expired")

    # Update user password
    user_id = code_data["user_id"]
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    user.password_hash = get_password_hash(new_password)
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()

    # Clean up used code
    del reset_tokens[code]

    return {"message": "Password has been reset successfully"}