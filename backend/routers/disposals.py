from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import Disposal
from utils.auth import verify_token

router = APIRouter()
security = HTTPBearer()

@router.post("/")
async def create_disposal(
    payload: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    waste_type = payload.get("waste_type")
    points_earned = int(payload.get("points_earned", 0))
    bin_id = payload.get("bin_id")
    if not waste_type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="waste_type is required")

    disposal = Disposal(
        user_id=user_id,
        bin_id=bin_id,
        waste_type=waste_type,
        points_earned=points_earned,
        weight=payload.get("weight"),
        created_at=datetime.utcnow(),
    )
    db.add(disposal)
    db.commit()
    db.refresh(disposal)
    return disposal

@router.get("/recent")
async def recent_disposals(
    limit: int = 5,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    items = (
        db.query(Disposal)
        .filter(Disposal.user_id == user_id)
        .order_by(Disposal.created_at.desc())
        .limit(limit)
        .all()
    )
    return items
