from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import base64
import io
from PIL import Image
from openai import OpenAI
import os
from typing import List
import json
import re

from database import get_db
from models import User, WasteDetection
from schemas import WasteDetectionCreate, WasteDetectionResponse, DetectedItem
from utils.auth import verify_token

router = APIRouter()
security = HTTPBearer()

# Initialize LLM client preference: OpenRouter first, then OpenAI
client: OpenAI
if os.getenv("OPENROUTER_API_KEY"):
    client = OpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": os.getenv("APP_URL", "http://localhost:8080"),
            "X-Title": "Smart EcoBin",
        },
    )
else:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
        # Ensure JPEG-compatible mode
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        
        # Save image temporarily (you might want to use cloud storage)
        image_path = f"uploads/detection_{user_id}_{len(os.listdir('uploads')) if os.path.exists('uploads') else 0}.jpg"
        os.makedirs("uploads", exist_ok=True)
        image.save(image_path, format="JPEG", quality=90)
        
        # Use LLM Vision API for waste detection
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
    """Analyze waste image using OpenRouter (Gemini Flash) if available, else OpenAI."""
    try:
        # Convert image to base64 for OpenAI API
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Pick model: when using OpenRouter allow override via OPENROUTER_MODEL
        # Default to a free vision model on OpenRouter
        if os.getenv("OPENROUTER_API_KEY"):
            model_name = os.getenv("OPENROUTER_MODEL", "qwen/qwen2.5-vl-32b-instruct:free")
        else:
            model_name = "gpt-4-vision-preview"
        try:
            print(f"[waste_detection] Using model={model_name}, api_base={getattr(client, 'base_url', 'openai default')}")
        except Exception:
            pass

        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": (
                            "You are a waste sorting assistant. Analyze the image content and output ONLY a JSON array. "
                            "NO extra text. Each array element must be an object with exactly these keys: "
                            "item (string), confidence (float in 0..1), disposal_method (string), bin_type (string from {general, recycling, organic, hazardous}).\n"
                            "Rules:\n- If plastic, paper, metal, glass: bin_type=recycling and disposal_method='Recycling'.\n"
                            "- If food/organic: bin_type=organic and disposal_method='Compost' or 'Organic Waste'.\n"
                            "- If batteries/chemicals/e-waste: bin_type=hazardous and disposal_method='Hazardous Waste'.\n"
                            "- If uncertain, return a single generic item with confidence 0.5 and bin_type=general.\n"
                            "Scoring guidance (client awards points in buckets from your confidence):\n"
                            "- confidence < 0.60 -> 5 points\n- 0.60–0.84 -> 10 points\n- 0.85–0.94 -> 15 points\n- >= 0.95 -> 20 points.\n"
                            "Return STRICT JSON only, e.g.: "
                            "[{\"item\":\"Plastic Bottle\",\"confidence\":0.92,\"disposal_method\":\"Recycling\",\"bin_type\":\"recycling\"}]"
                        )},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
                    ],
                }
            ],
            max_tokens=500,
            temperature=0.2,
        )

        # Attempt to parse JSON from model response
        content = response.choices[0].message.content if response else ""
        items_json = None
        if content:
            # Extract JSON array
            match = re.search(r"\[.*\]", content, re.DOTALL)
            if match:
                try:
                    items_json = json.loads(match.group(0))
                except Exception:
                    items_json = None

        detected_items: List[DetectedItem] = []
        if isinstance(items_json, list) and items_json:
            for item_data in items_json:
                try:
                    detected_items.append(DetectedItem(**item_data))
                except Exception:
                    continue
        
        # Fallback if parsing failed or empty
        if not detected_items:
            detected_items = [
                DetectedItem(item="Unknown Item", confidence=0.5, disposal_method="General Waste", bin_type="general")
            ]
        
        return detected_items
        
    except Exception as e:
        try:
            print(f"[waste_detection] LLM call failed: {str(e)}")
        except Exception:
            pass
        # Fallback to mock detection if LLM fails
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
