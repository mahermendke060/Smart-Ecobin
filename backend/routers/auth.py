from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta
import logging

from database import get_db
from models import User
from schemas import UserCreate, UserLogin, User as UserSchema, Token
from utils.auth import verify_password, get_password_hash, create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES
from utils.validators import validate_password_strength, validate_email_format, validate_full_name, sanitize_input
from utils.rate_limiter import check_auth_rate_limit, record_failed_login

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=UserSchema)
async def register(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    try:
        # Rate limiting check
        await check_auth_rate_limit(request, user.email)
        
        # Validate email format
        email_valid, email_error = validate_email_format(user.email)
        if not email_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=email_error
            )
        
        # Validate password strength
        password_valid, password_errors = validate_password_strength(user.password)
        if not password_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Password does not meet security requirements", "errors": password_errors}
            )
        
        # Validate full name
        name_valid, name_error = validate_full_name(user.full_name)
        if not name_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=name_error
            )
        
        # Sanitize inputs
        sanitized_email = sanitize_input(user.email.lower())
        sanitized_name = sanitize_input(user.full_name) if user.full_name else None
        
        # Check if user already exists
        db_user = db.query(User).filter(User.email == sanitized_email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists"
            )
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=sanitized_email,
            hashed_password=hashed_password,
            full_name=sanitized_name
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        logging.info(f"New user registered: {sanitized_email}")
        return db_user
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    try:
        # Rate limiting and account lockout check
        await check_auth_rate_limit(request, user_credentials.email)
        
        # Sanitize email input
        sanitized_email = sanitize_input(user_credentials.email.lower())
        
        # Authenticate user
        user = db.query(User).filter(User.email == sanitized_email).first()
        
        if not user or not verify_password(user_credentials.password, user.hashed_password):
            # Record failed attempt
            record_failed_login(sanitized_email)
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if account is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated. Please contact support."
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}, 
            expires_delta=access_token_expires
        )
        
        logging.info(f"User logged in: {sanitized_email}")
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )

@router.get("/me", response_model=UserSchema)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.post("/logout")
async def logout(request: Request, current_user: User = Depends(get_current_user)):
    try:
        # Log the logout event
        logging.info(f"User logged out: {current_user.email}")
        
        # For JWT tokens, logout is primarily handled on the client side
        # In a production environment, you might want to implement token blacklisting
        # or store active tokens in Redis and remove them here
        
        return {"message": "Logged out successfully", "status": "success"}
        
    except Exception as e:
        logging.error(f"Logout error for user {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed. Please try again."
        )
