from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from database import get_db
from models import Bin as BinModel
from schemas import BinCreate, Bin as BinSchema, BinUpdate
from utils.auth import verify_token

router = APIRouter()
security = HTTPBearer()

@router.get("/", response_model=List[BinSchema])
async def get_bins(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[float] = 5.0,  # km
    bin_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(BinModel)
    
    # Filter by bin type if specified
    if bin_type:
        query = query.filter(BinModel.type == bin_type)
    
    bins = query.all()
    
    # Filter by location if coordinates provided
    if lat is not None and lng is not None:
        filtered_bins = []
        for bin in bins:
            distance = calculate_distance(lat, lng, bin.latitude, bin.longitude)
            if distance <= radius:
                filtered_bins.append(bin)
        return filtered_bins
    
    return bins

@router.get("/nearby", response_model=List[BinSchema])
async def get_nearby_bins(
    lat: float,
    lng: float,
    radius: float = 2.0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    bins = db.query(BinModel).all()
    
    # Calculate distances and sort by proximity
    bins_with_distance = []
    for bin in bins:
        distance = calculate_distance(lat, lng, bin.latitude, bin.longitude)
        if distance <= radius:
            bins_with_distance.append((bin, distance))
    
    # Sort by distance and limit results
    bins_with_distance.sort(key=lambda x: x[1])
    nearby_bins = [bin[0] for bin in bins_with_distance[:limit]]
    
    return nearby_bins

@router.get("/{bin_id}", response_model=BinSchema)
async def get_bin(bin_id: int, db: Session = Depends(get_db)):
    bin = db.query(BinModel).filter(BinModel.id == bin_id).first()
    if not bin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bin not found"
        )
    return bin

@router.post("/", response_model=BinSchema)
async def create_bin(
    bin_data: BinCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # Verify admin access (you might want to add role-based access control)
    user_id = verify_token(credentials.credentials)
    
    # Validate bin type
    valid_types = ["general", "recycling", "organic", "hazardous"]
    if bin_data.type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid bin type. Must be one of: {valid_types}"
        )
    
    db_bin = BinModel(**bin_data.dict())
    db.add(db_bin)
    db.commit()
    db.refresh(db_bin)
    
    return db_bin

@router.put("/{bin_id}", response_model=BinSchema)
async def update_bin(
    bin_id: int,
    bin_update: BinUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # Verify admin access
    user_id = verify_token(credentials.credentials)
    
    bin = db.query(BinModel).filter(BinModel.id == bin_id).first()
    if not bin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bin not found"
        )
    
    # Update bin fields
    update_data = bin_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bin, field, value)
    
    db.commit()
    db.refresh(bin)
    
    return bin

@router.get("/types/stats")
async def get_bin_type_stats(db: Session = Depends(get_db)):
    stats = {}
    bin_types = ["general", "recycling", "organic", "hazardous"]
    
    for bin_type in bin_types:
        total = db.query(BinModel).filter(BinModel.type == bin_type).count()
        available = db.query(BinModel).filter(
            BinModel.type == bin_type,
            BinModel.status == "available"
        ).count()
        nearly_full = db.query(BinModel).filter(
            BinModel.type == bin_type,
            BinModel.status == "nearly_full"
        ).count()
        full = db.query(BinModel).filter(
            BinModel.type == bin_type,
            BinModel.status == "full"
        ).count()
        
        stats[bin_type] = {
            "total": total,
            "available": available,
            "nearly_full": nearly_full,
            "full": full,
            "availability_rate": (available / total * 100) if total > 0 else 0
        }
    
    return stats

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = (math.sin(delta_lat / 2) * math.sin(delta_lat / 2) +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lng / 2) * math.sin(delta_lng / 2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    
    return distance
