from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    waste_detections = relationship("WasteDetection", back_populates="user")
    feedback_submissions = relationship("Feedback", back_populates="user")
    analytics_data = relationship("UserAnalytics", back_populates="user")
    profiles = relationship("Profile", back_populates="user")
    disposals = relationship("Disposal", back_populates="user")

class WasteDetection(Base):
    __tablename__ = "waste_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_path = Column(String(500))
    detected_items = Column(JSON)  # Store detected waste items as JSON
    confidence_scores = Column(JSON)  # Store confidence scores
    disposal_recommendations = Column(JSON)  # Store disposal recommendations
    location_lat = Column(Float)
    location_lng = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="waste_detections")

class Bin(Base):
    __tablename__ = "bins"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # general, recycling, organic, hazardous
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500))
    capacity = Column(Integer, default=100)  # Percentage
    status = Column(String(50), default="available")  # available, nearly_full, full, maintenance
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String(50), nullable=False)  # general, feature, bug, appreciation
    rating = Column(Integer)  # 1-5 stars for general/appreciation feedback
    message = Column(Text, nullable=False)
    email = Column(String(255))  # Optional email for non-authenticated users
    status = Column(String(50), default="pending")  # pending, reviewed, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="feedback_submissions")

class UserAnalytics(Base):
    __tablename__ = "user_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_scans = Column(Integer, default=0)
    total_items_disposed = Column(Integer, default=0)
    co2_saved = Column(Float, default=0.0)  # kg of CO2 saved
    trees_saved = Column(Float, default=0.0)  # equivalent trees saved
    water_saved = Column(Float, default=0.0)  # liters of water saved
    energy_saved = Column(Float, default=0.0)  # kWh saved
    points_earned = Column(Integer, default=0)
    level = Column(Integer, default=1)
    badges = Column(JSON)  # Store earned badges as JSON array
    streak_days = Column(Integer, default=0)
    last_scan_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="analytics_data")

class VoiceInteraction(Base):
    __tablename__ = "voice_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    audio_url = Column(String(500))  # URL to generated audio file
    session_id = Column(String(255))  # For grouping related interactions
    created_at = Column(DateTime, default=datetime.utcnow)

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    full_name = Column(String(255))
    email = Column(String(255))
    avatar_url = Column(String(500))
    points = Column(Integer, default=0)
    total_disposals = Column(Integer, default=0)
    bins_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="profiles")

class Disposal(Base):
    __tablename__ = "disposals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    bin_id = Column(Integer, ForeignKey("bins.id"), nullable=True)
    waste_type = Column(String(100), nullable=False)
    points_earned = Column(Integer, default=0)
    weight = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="disposals")
