from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import User, Profile, UserAnalytics as UserAnalyticsModel
from utils.auth import verify_token

router = APIRouter()
security = HTTPBearer()


def get_or_create_profile(user_id: int, db: Session) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        profile = Profile(
            user_id=user_id,
            full_name=user.full_name,
            email=user.email,
            points=0,
            total_disposals=0,
            bins_used=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.get("/me")
async def get_my_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    profile = get_or_create_profile(user_id, db)
    return jsonable_encoder(profile)

@router.post("/ensure")
async def ensure_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    profile = get_or_create_profile(user_id, db)
    return jsonable_encoder(profile)

@router.post("/points/add")
async def add_points(
    payload: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Increment user's points and disposal totals.
    Body: { "points": int, "increment_disposals": bool }
    """
    user_id = verify_token(credentials.credentials)
    pts = int(payload.get("points", 0))
    increment_disposals = bool(payload.get("increment_disposals", True))

    if pts == 0 and not increment_disposals:
        return {"updated": False}

    profile = get_or_create_profile(user_id, db)
    profile.points = (profile.points or 0) + int(pts)
    if increment_disposals:
        profile.total_disposals = (profile.total_disposals or 0) + 1
    profile.updated_at = datetime.utcnow()
    db.add(profile)

    # Update analytics for leaderboard visibility
    ua = db.query(UserAnalyticsModel).filter(UserAnalyticsModel.user_id == user_id).first()
    if not ua:
        ua = UserAnalyticsModel(user_id=user_id, total_scans=0, points_earned=0)
    if increment_disposals:
        ua.total_scans = (ua.total_scans or 0) + 1
    ua.points_earned = (ua.points_earned or 0) + int(pts)
    ua.updated_at = datetime.utcnow()
    db.add(ua)
    db.commit()
    db.refresh(profile)
    return jsonable_encoder(profile)
