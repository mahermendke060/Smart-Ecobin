from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import User, Feedback as FeedbackModel
from schemas import FeedbackCreate, Feedback as FeedbackSchema
from utils.auth import verify_token

router = APIRouter()
security = HTTPBearer()

@router.post("/submit", response_model=FeedbackSchema)
async def submit_feedback(
    feedback_data: FeedbackCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    
    # Validate feedback type
    valid_types = ["general", "feature", "bug", "appreciation"]
    if feedback_data.type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid feedback type. Must be one of: {valid_types}"
        )
    
    # Validate rating for general and appreciation feedback
    if feedback_data.type in ["general", "appreciation"]:
        if feedback_data.rating is None or feedback_data.rating < 1 or feedback_data.rating > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rating must be between 1 and 5 for general and appreciation feedback"
            )
    
    # Create feedback record
    db_feedback = FeedbackModel(
        user_id=user_id,
        type=feedback_data.type,
        rating=feedback_data.rating,
        message=feedback_data.message,
        email=feedback_data.email,
        status="pending"
    )
    
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    return db_feedback

@router.get("/", response_model=List[FeedbackSchema])
async def get_user_feedback(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    
    feedback_list = db.query(FeedbackModel).filter(
        FeedbackModel.user_id == user_id
    ).order_by(FeedbackModel.created_at.desc()).all()
    
    return feedback_list

@router.get("/stats")
async def get_feedback_stats(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    
    # Get feedback statistics for the user
    total_feedback = db.query(FeedbackModel).filter(FeedbackModel.user_id == user_id).count()
    
    feedback_by_type = {}
    for feedback_type in ["general", "feature", "bug", "appreciation"]:
        count = db.query(FeedbackModel).filter(
            FeedbackModel.user_id == user_id,
            FeedbackModel.type == feedback_type
        ).count()
        feedback_by_type[feedback_type] = count
    
    avg_rating = db.query(FeedbackModel).filter(
        FeedbackModel.user_id == user_id,
        FeedbackModel.rating.isnot(None)
    ).with_entities(FeedbackModel.rating).all()
    
    average_rating = sum([r[0] for r in avg_rating]) / len(avg_rating) if avg_rating else 0
    
    return {
        "total_feedback": total_feedback,
        "feedback_by_type": feedback_by_type,
        "average_rating": round(average_rating, 2),
        "contribution_score": total_feedback * 10  # Simple scoring system
    }

# Admin endpoints for feedback management
@router.get("/admin/all", response_model=List[FeedbackSchema])
async def get_all_feedback(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    user_id = verify_token(credentials.credentials)
    
    # Check if user is admin (you can implement proper admin role checking)
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.email != "admin@smartecobin.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    feedback_list = db.query(FeedbackModel).offset(skip).limit(limit).order_by(
        FeedbackModel.created_at.desc()
    ).all()
    
    return feedback_list

@router.put("/admin/{feedback_id}/status")
async def update_feedback_status(
    feedback_id: int,
    new_status: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    
    # Check if user is admin
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.email != "admin@smartecobin.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    valid_statuses = ["pending", "reviewed", "resolved"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )
    
    feedback = db.query(FeedbackModel).filter(FeedbackModel.id == feedback_id).first()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    feedback.status = new_status
    db.commit()
    
    return {"message": f"Feedback status updated to {new_status}"}
