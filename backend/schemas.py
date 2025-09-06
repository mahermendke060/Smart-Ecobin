from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import re

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# Waste Detection Schemas
class WasteDetectionCreate(BaseModel):
    image_data: str  # Base64 encoded image
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None

class DetectedItem(BaseModel):
    item: str
    confidence: float
    disposal_method: str
    bin_type: str

class WasteDetectionResponse(BaseModel):
    id: int
    detected_items: List[DetectedItem]
    recommendations: List[str]
    environmental_impact: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Bin Schemas
class BinBase(BaseModel):
    name: str
    type: str
    latitude: float
    longitude: float
    address: Optional[str] = None

class BinCreate(BinBase):
    pass

class Bin(BinBase):
    id: int
    capacity: int
    status: str
    last_updated: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class BinUpdate(BaseModel):
    capacity: Optional[int] = None
    status: Optional[str] = None

# Feedback Schemas
class FeedbackCreate(BaseModel):
    type: str  # general, feature, bug, appreciation
    rating: Optional[int] = None
    message: str
    email: Optional[EmailStr] = None

class Feedback(BaseModel):
    id: int
    type: str
    rating: Optional[int]
    message: str
    email: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Analytics Schemas
class UserAnalytics(BaseModel):
    total_scans: int
    total_items_detected: int
    recycling_score: float
    environmental_impact: Dict[str, Any]
    monthly_stats: Dict[str, Any]
    achievements: List[str]
    
    class Config:
        from_attributes = True

# Voice Assistant Schemas
class VoiceMessage(BaseModel):
    message: str
    agent_id: str

class VoiceResponse(BaseModel):
    response: str
    audio_content: Optional[str] = None
