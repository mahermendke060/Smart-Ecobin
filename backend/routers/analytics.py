from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any

from database import get_db
from models import User, WasteDetection, Profile as ProfileModel, UserAnalytics as UserAnalyticsModel, Feedback
from schemas import UserAnalytics
from utils.auth import verify_token

router = APIRouter()
security = HTTPBearer()

@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard_analytics(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    
    # Get or create user analytics
    user_analytics = db.query(UserAnalyticsModel).filter(
        UserAnalyticsModel.user_id == user_id
    ).first()
    
    if not user_analytics:
        user_analytics = create_user_analytics(user_id, db)
    
    # Calculate recent activity
    last_30_days = datetime.utcnow() - timedelta(days=30)
    recent_scans = db.query(WasteDetection).filter(
        WasteDetection.user_id == user_id,
        WasteDetection.created_at >= last_30_days
    ).count()
    
    # Calculate weekly stats
    weekly_stats = calculate_weekly_stats(user_id, db)
    
    # Calculate environmental impact
    environmental_impact = calculate_total_environmental_impact(user_id, db)
    
    # Get achievements
    achievements = calculate_achievements(user_id, db)
    
    return {
        "total_scans": user_analytics.total_scans,
        "recent_scans": recent_scans,
        "recycling_score": user_analytics.recycling_score,
        "environmental_impact": environmental_impact,
        "weekly_stats": weekly_stats,
        "achievements": achievements,
        "monthly_comparison": calculate_monthly_comparison(user_id, db)
    }

@router.get("/environmental-impact")
async def get_environmental_impact(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    
    impact = calculate_total_environmental_impact(user_id, db)
    
    # Add detailed breakdown
    impact["breakdown"] = {
        "plastic_recycled": impact.get("plastic_items", 0),
        "paper_recycled": impact.get("paper_items", 0),
        "metal_recycled": impact.get("metal_items", 0),
        "glass_recycled": impact.get("glass_items", 0)
    }
    
    # Calculate projections
    impact["yearly_projection"] = {
        "co2_saved": impact.get("co2_saved", 0) * 12,
        "items_recycled": impact.get("total_recycled", 0) * 12,
        "environmental_score": impact.get("environmental_score", 0) * 12
    }
    
    return impact

@router.get("/leaderboard")
async def get_leaderboard(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
    period: str = Query("all", regex="^(all|week|month)$")
):
    user_id = verify_token(credentials.credentials)
    
    # Period-based leaderboard using Disposals aggregation for week/month
    from models import Disposal
    now = datetime.utcnow()
    start_date = None
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)

    if start_date is not None:
        # Aggregate points by user within period
        rows = (
            db.query(Disposal.user_id, func.coalesce(func.sum(Disposal.points_earned), 0).label("pts"), func.count(Disposal.id).label("scans"))
              .filter(Disposal.created_at >= start_date)
              .group_by(Disposal.user_id)
              .order_by(func.sum(Disposal.points_earned).desc())
              .limit(10)
              .all()
        )
        leaderboard = []
        for i, r in enumerate(rows):
            prof = db.query(ProfileModel).filter(ProfileModel.user_id == r.user_id).first()
            usr = db.query(User).filter(User.id == r.user_id).first()
            leaderboard.append({
                "rank": i + 1,
                "user_name": (prof.full_name if prof and prof.full_name else (usr.email if usr else "Anonymous")),
                "avatar_url": (prof.avatar_url if prof else None),
                "recycling_score": int(r.pts or 0),
                "total_scans": int(r.scans or 0),
                "is_current_user": r.user_id == user_id
            })
        # Current user rank in this period
        your_pts = 0
        if user_id:
            your_row = (
                db.query(func.coalesce(func.sum(Disposal.points_earned), 0))
                  .filter(Disposal.user_id == user_id, Disposal.created_at >= start_date)
                  .scalar()
            )
            your_pts = int(your_row or 0)
        higher = (
            db.query(Disposal.user_id)
              .filter(Disposal.created_at >= start_date)
              .group_by(Disposal.user_id)
              .having(func.sum(Disposal.points_earned) > your_pts)
              .count()
        )
        return {"leaderboard": leaderboard, "current_user_rank": higher + 1}

    # All-time leaderboard using a merge of Analytics (points_earned) and Profiles (points)
    analytics_rows = db.query(UserAnalyticsModel).order_by(UserAnalyticsModel.points_earned.desc()).all()
    profile_rows = db.query(ProfileModel).order_by(ProfileModel.points.desc()).all()

    # Build a combined dict of user_id -> points using analytics first, then profile points if analytics missing
    combined: dict[int, int] = {}
    # Start with analytics points
    for a in analytics_rows:
        combined[a.user_id] = int(a.points_earned or 0)
    # Merge profile points taking the larger value so it matches Dashboard totals
    for p in profile_rows:
        prof_pts = int(p.points or 0)
        prev = combined.get(p.user_id, 0)
        combined[p.user_id] = max(prev, prof_pts)

    # Sort by points desc
    sorted_all = sorted(combined.items(), key=lambda x: x[1], reverse=True)
    # Top 10 for display
    sorted_users = sorted_all[:10]

    leaderboard = []
    for i, (uid, pts) in enumerate(sorted_users):
        usr = db.query(User).filter(User.id == uid).first()
        prof = db.query(ProfileModel).filter(ProfileModel.user_id == uid).first()
        # total_scans from analytics when present
        arow = next((a for a in analytics_rows if a.user_id == uid), None)
        leaderboard.append({
            "rank": i + 1,
            "user_name": (prof.full_name if prof and prof.full_name else (usr.full_name if usr and usr.full_name else (usr.email if usr else "Anonymous"))),
            "avatar_url": (prof.avatar_url if prof else None),
            "recycling_score": int(pts or 0),
            "total_scans": int(arow.total_scans) if arow else 0,
            "is_current_user": int(uid) == int(user_id)
        })

    # Compute current user's rank across combined set (standard competition ranking)
    try:
        uid_int = int(user_id)
    except Exception:
        uid_int = user_id
    current_pts = combined.get(uid_int, 0)
    current_user_rank = sum(1 for _, v in combined.items() if v > current_pts) + 1

    return {"leaderboard": leaderboard, "current_user_rank": current_user_rank, "total_users": len(combined)}

def create_user_analytics(user_id: int, db: Session) -> UserAnalyticsModel:
    """Create initial analytics record for user"""
    user_analytics = UserAnalyticsModel(
        user_id=user_id,
        total_scans=0,
        total_items_detected=0,
        recycling_score=0.0,
        environmental_impact={},
        monthly_stats={},
        achievements=[]
    )
    db.add(user_analytics)
    db.commit()
    db.refresh(user_analytics)
    return user_analytics

def calculate_weekly_stats(user_id: int, db: Session) -> Dict[str, Any]:
    """Calculate weekly statistics for user"""
    last_7_days = datetime.utcnow() - timedelta(days=7)
    
    weekly_scans = db.query(WasteDetection).filter(
        WasteDetection.user_id == user_id,
        WasteDetection.created_at >= last_7_days
    ).count()
    
    # Calculate daily breakdown
    daily_stats = {}
    for i in range(7):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        daily_scans = db.query(WasteDetection).filter(
            WasteDetection.user_id == user_id,
            WasteDetection.created_at >= day_start,
            WasteDetection.created_at < day_end
        ).count()
        
        daily_stats[day.strftime("%Y-%m-%d")] = daily_scans
    
    return {
        "total_weekly_scans": weekly_scans,
        "daily_breakdown": daily_stats,
        "average_daily": weekly_scans / 7
    }

def calculate_total_environmental_impact(user_id: int, db: Session) -> Dict[str, Any]:
    """Calculate total environmental impact for user"""
    detections = db.query(WasteDetection).filter(
        WasteDetection.user_id == user_id
    ).all()
    
    total_impact = {
        "co2_saved": 0,
        "total_recycled": 0,
        "environmental_score": 0,
        "plastic_items": 0,
        "paper_items": 0,
        "metal_items": 0,
        "glass_items": 0
    }
    
    for detection in detections:
        if detection.detected_items:
            for item in detection.detected_items:
                if isinstance(item, dict) and item.get("bin_type") == "recycling":
                    total_impact["total_recycled"] += 1
                    total_impact["co2_saved"] += 0.5  # kg CO2 saved per recycled item
                    
                    # Categorize by material type
                    item_name = item.get("item", "").lower()
                    if "plastic" in item_name or "bottle" in item_name:
                        total_impact["plastic_items"] += 1
                    elif "paper" in item_name or "cardboard" in item_name:
                        total_impact["paper_items"] += 1
                    elif "metal" in item_name or "can" in item_name:
                        total_impact["metal_items"] += 1
                    elif "glass" in item_name:
                        total_impact["glass_items"] += 1
                
                confidence = item.get("confidence", 0)
                total_impact["environmental_score"] += confidence * 10
    
    return total_impact

def calculate_achievements(user_id: int, db: Session) -> list:
    """Calculate user achievements"""
    achievements = []
    
    # Get user stats
    total_scans = db.query(WasteDetection).filter(
        WasteDetection.user_id == user_id
    ).count()
    
    user_analytics = db.query(UserAnalyticsModel).filter(
        UserAnalyticsModel.user_id == user_id
    ).first()
    
    # Scan-based achievements
    if total_scans >= 1:
        achievements.append("First Scan")
    if total_scans >= 10:
        achievements.append("Eco Beginner")
    if total_scans >= 50:
        achievements.append("Waste Detective")
    if total_scans >= 100:
        achievements.append("Eco Champion")
    
    # Recycling-based achievements
    if user_analytics and user_analytics.recycling_score >= 100:
        achievements.append("Recycling Hero")
    if user_analytics and user_analytics.recycling_score >= 500:
        achievements.append("Green Guardian")
    
    # Feedback achievements
    feedback_count = db.query(Feedback).filter(
        Feedback.user_id == user_id
    ).count()
    
    if feedback_count >= 1:
        achievements.append("Community Contributor")
    if feedback_count >= 5:
        achievements.append("Feedback Champion")
    
    return achievements

def calculate_monthly_comparison(user_id: int, db: Session) -> Dict[str, Any]:
    """Calculate monthly comparison statistics"""
    current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    
    current_month_scans = db.query(WasteDetection).filter(
        WasteDetection.user_id == user_id,
        WasteDetection.created_at >= current_month_start
    ).count()
    
    last_month_scans = db.query(WasteDetection).filter(
        WasteDetection.user_id == user_id,
        WasteDetection.created_at >= last_month_start,
        WasteDetection.created_at < current_month_start
    ).count()
    
    change_percentage = 0
    if last_month_scans > 0:
        change_percentage = ((current_month_scans - last_month_scans) / last_month_scans) * 100
    
    return {
        "current_month": current_month_scans,
        "last_month": last_month_scans,
        "change_percentage": round(change_percentage, 2),
        "trend": "up" if change_percentage > 0 else "down" if change_percentage < 0 else "stable"
    }
