from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from pydantic import BaseModel, Field

from database import get_db
from services.location_service import location_service
from routers.auth import get_current_user
from models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/location", tags=["location"])

class LocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    radius_km: int = Field(default=5, ge=1, le=50, description="Search radius in kilometers")
    bin_type: str = Field(default="recycling", description="Type of bin to search for")

class AddressRequest(BaseModel):
    address: str = Field(..., min_length=1, max_length=500, description="Address to geocode")

class BinLocation(BaseModel):
    id: str
    name: str
    address: str
    latitude: float
    longitude: float
    rating: float
    type: str
    distance: float
    phone: str
    hours: str
    website: str

@router.post("/search-nearby-bins", response_model=List[BinLocation])
async def search_nearby_bins(
    location_request: LocationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search for nearby recycling bins based on coordinates
    """
    try:
        bins = await location_service.search_nearby_bins(
            latitude=location_request.latitude,
            longitude=location_request.longitude,
            radius_km=location_request.radius_km,
            bin_type=location_request.bin_type
        )
        
        logger.info(f"User {current_user.email} searched for bins near {location_request.latitude}, {location_request.longitude}")
        return bins
        
    except Exception as e:
        logger.error(f"Error searching nearby bins: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to search for nearby bins. Please try again."
        )

@router.get("/search-bins")
async def search_bins_by_params(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude coordinate"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude coordinate"),
    radius_km: int = Query(default=5, ge=1, le=50, description="Search radius in kilometers"),
    bin_type: str = Query(default="recycling", description="Type of bin to search for"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search for nearby recycling bins using query parameters
    """
    try:
        bins = await location_service.search_nearby_bins(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            bin_type=bin_type
        )
        
        logger.info(f"User {current_user.email} searched for bins near {latitude}, {longitude}")
        return {"bins": bins, "count": len(bins)}
        
    except Exception as e:
        logger.error(f"Error searching nearby bins: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to search for nearby bins. Please try again."
        )

@router.post("/geocode")
async def geocode_address(
    address_request: AddressRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Convert address to coordinates
    """
    try:
        coordinates = await location_service.get_location_from_address(address_request.address)
        
        if coordinates:
            latitude, longitude = coordinates
            logger.info(f"User {current_user.email} geocoded address: {address_request.address}")
            return {
                "address": address_request.address,
                "latitude": latitude,
                "longitude": longitude
            }
        else:
            raise HTTPException(
                status_code=404,
                detail="Could not find coordinates for the provided address"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error geocoding address: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to geocode address. Please try again."
        )

@router.get("/bin-types")
async def get_bin_types(
    current_user: User = Depends(get_current_user)
):
    """
    Get available bin types for search
    """
    return {
        "bin_types": [
            {"value": "recycling", "label": "Recycling Bins"},
            {"value": "general", "label": "General Waste"},
            {"value": "organic", "label": "Organic/Compost"},
            {"value": "electronic", "label": "Electronic Waste"},
            {"value": "hazardous", "label": "Hazardous Materials"},
            {"value": "textile", "label": "Textile Recycling"},
            {"value": "battery", "label": "Battery Collection"},
            {"value": "glass", "label": "Glass Recycling"}
        ]
    }
