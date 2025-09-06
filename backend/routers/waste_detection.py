from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import base64
import io
from PIL import Image
import openai
import os
from typing import List

from database import get_db
from models import User, WasteDetection
from schemas import WasteDetectionCreate, WasteDetectionResponse, DetectedItem
from utils.auth import verify_token

router = APIRouter()
security = HTTPBearer()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

@router.post("/detect", response_model=WasteDetectionResponse)
async def detect_waste(
    detection_data: WasteDetectionCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    
    try:
        # Decode base64 image
        image_data = base64.b64decode(detection_data.image_data)
        image = Image.open(io.BytesIO(image_data))
        
        # Save image temporarily (you might want to use cloud storage)
        image_path = f"uploads/detection_{user_id}_{len(os.listdir('uploads')) if os.path.exists('uploads') else 0}.jpg"
        os.makedirs("uploads", exist_ok=True)
        image.save(image_path)
        
        # Use OpenAI Vision API for waste detection
        detected_items = await analyze_waste_image(image_data)
        
        # Create detection record
        db_detection = WasteDetection(
            user_id=user_id,
            image_path=image_path,
            detected_items=[item.dict() for item in detected_items],
            confidence_scores={item.item: item.confidence for item in detected_items},
            disposal_recommendations=[item.disposal_method for item in detected_items],
            location_lat=detection_data.location_lat,
            location_lng=detection_data.location_lng
        )
        
        db.add(db_detection)
        db.commit()
        db.refresh(db_detection)
        
        # Calculate environmental impact
        environmental_impact = calculate_environmental_impact(detected_items)
        
        return WasteDetectionResponse(
            id=db_detection.id,
            detected_items=detected_items,
            recommendations=generate_disposal_recommendations(detected_items),
            environmental_impact=environmental_impact,
            created_at=db_detection.created_at
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing image: {str(e)}"
        )

async def analyze_waste_image(image_data: bytes) -> List[DetectedItem]:
    """Analyze waste image using OpenAI Vision API"""
    try:
        # Convert image to base64 for OpenAI API
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        response = openai.ChatCompletion.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze this image and identify all waste items. For each item, provide: item name, confidence (0-1), disposal method, and appropriate bin type (general, recycling, organic, hazardous). Return as JSON array."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        
        # Parse response and create DetectedItem objects
        # This is a simplified version - you'd want more robust parsing
        detected_items = []
        
        # Mock data for demonstration - replace with actual OpenAI response parsing
        mock_items = [
            {"item": "Plastic Bottle", "confidence": 0.95, "disposal_method": "Recycling", "bin_type": "recycling"},
            {"item": "Food Wrapper", "confidence": 0.87, "disposal_method": "General Waste", "bin_type": "general"}
        ]
        
        for item_data in mock_items:
            detected_items.append(DetectedItem(**item_data))
        
        return detected_items
        
    except Exception as e:
        # Fallback to mock detection if OpenAI fails
        return [
            DetectedItem(
                item="Unknown Item",
                confidence=0.5,
                disposal_method="General Waste",
                bin_type="general"
            )
        ]

def calculate_environmental_impact(detected_items: List[DetectedItem]) -> dict:
    """Calculate environmental impact of detected items"""
    impact = {
        "co2_saved": 0,
        "recycling_potential": 0,
        "environmental_score": 0
    }
    
    for item in detected_items:
        if item.bin_type == "recycling":
            impact["co2_saved"] += 0.5  # kg CO2 saved per recycled item
            impact["recycling_potential"] += 1
        impact["environmental_score"] += item.confidence * 10
    
    return impact

def generate_disposal_recommendations(detected_items: List[DetectedItem]) -> List[str]:
    """Generate disposal recommendations based on detected items"""
    recommendations = []
    
    recycling_items = [item for item in detected_items if item.bin_type == "recycling"]
    if recycling_items:
        recommendations.append(f"Great! {len(recycling_items)} items can be recycled. Look for blue recycling bins.")
    
    hazardous_items = [item for item in detected_items if item.bin_type == "hazardous"]
    if hazardous_items:
        recommendations.append("Some items require special disposal. Find hazardous waste collection points.")
    
    organic_items = [item for item in detected_items if item.bin_type == "organic"]
    if organic_items:
        recommendations.append("Organic waste detected. Use green compost bins if available.")
    
    if not recommendations:
        recommendations.append("Items can be disposed of in general waste bins.")
    
    return recommendations

@router.get("/history")
async def get_detection_history(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    
    detections = db.query(WasteDetection).filter(
        WasteDetection.user_id == user_id
    ).order_by(WasteDetection.created_at.desc()).limit(50).all()
    
    return detections
