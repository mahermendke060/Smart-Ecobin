from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import httpx
import base64
import os
from typing import Dict, Any

from database import get_db
from models import VoiceInteraction
from schemas import VoiceMessage, VoiceResponse
from utils.auth import verify_token

router = APIRouter()
security = HTTPBearer()

@router.post("/chat", response_model=VoiceResponse)
async def voice_chat(
    voice_data: VoiceMessage,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    
    try:
        # Generate contextual response
        response_text = generate_contextual_response(voice_data.message, voice_data.agent_id)
        
        # Generate audio using ElevenLabs
        audio_content = await generate_audio_response(response_text)
        
        # Store interaction
        interaction = VoiceInteraction(
            user_id=user_id,
            message=voice_data.message,
            response=response_text
        )
        db.add(interaction)
        db.commit()
        
        return VoiceResponse(
            response=response_text,
            audio_content=audio_content
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing voice request: {str(e)}"
        )

async def generate_audio_response(text: str) -> str:
    """Generate audio response using ElevenLabs API"""
    elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
    if not elevenlabs_api_key:
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x",
                headers={
                    "xi-api-key": elevenlabs_api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "text": text,
                    "model_id": "eleven_turbo_v2_5",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                }
            )
            
            if response.status_code == 200:
                audio_bytes = response.content
                return base64.b64encode(audio_bytes).decode('utf-8')
            else:
                return None
                
    except Exception as e:
        print(f"Error generating audio: {e}")
        return None

def generate_contextual_response(message: str, agent_id: str) -> str:
    """Generate contextual response for Smart EcoBin assistant"""
    lower_message = message.lower()
    
    # Enhanced responses for the Smart EcoBin agent
    if any(word in lower_message for word in ['bin', 'garbage', 'waste', 'trash']):
        return "I can help you find nearby waste bins! The map shows all available bins in your area with their current status. Green bins are available, yellow bins are nearly full, and red bins need emptying."
    
    if any(word in lower_message for word in ['recycle', 'recycling']):
        return "For recycling, look for blue or green bins marked as recycling bins. Make sure to separate your materials properly - paper, plastic, glass, and metal should go in designated recycling bins."
    
    if any(word in lower_message for word in ['location', 'where', 'find', 'nearest']):
        return "You can use the search function to find specific bins, or tap the location button to center the map on your current position. I can help you navigate to the nearest available bin."
    
    if any(word in lower_message for word in ['scan', 'detect', 'identify']):
        return "Use the scan feature to identify waste items! Just take a photo and I'll help you determine the best disposal method and find the right type of bin for each item."
    
    if any(word in lower_message for word in ['hello', 'hi', 'hey']):
        return "Hello! I'm your Smart EcoBin assistant powered by ElevenLabs AI. I can help you find nearby bins, provide recycling information, and guide you to proper waste disposal locations. How can I assist you today?"
    
    if 'help' in lower_message:
        return "I'm here to help with waste management! You can ask me about finding bins, recycling guidelines, waste disposal procedures, or scanning items. Just speak naturally and I'll do my best to assist you."
    
    if any(word in lower_message for word in ['smart', 'ecobin']):
        return "Smart EcoBin is an intelligent waste management system that helps you locate and manage waste disposal efficiently. I'm your AI assistant to guide you through the process and make recycling easier!"
    
    if any(word in lower_message for word in ['analytics', 'stats', 'score']):
        return "Check your analytics dashboard to see your recycling score, environmental impact, and achievements! You can track how much CO2 you've saved and see your progress over time."
    
    if any(word in lower_message for word in ['feedback', 'suggest', 'improve']):
        return "I'd love to hear your feedback! Use the feedback section to share suggestions, report issues, or tell us what you love about Smart EcoBin. Your input helps us improve the app."
    
    return "I'm your Smart EcoBin AI assistant. I can help you find bins, provide recycling information, guide you with waste disposal, and answer questions about the app. Could you please be more specific about what you need help with?"

@router.get("/history")
async def get_voice_history(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = verify_token(credentials.credentials)
    
    interactions = db.query(VoiceInteraction).filter(
        VoiceInteraction.user_id == user_id
    ).order_by(VoiceInteraction.created_at.desc()).limit(20).all()
    
    return interactions
