from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn
import os
from dotenv import load_dotenv

from database import get_db, engine
from models import Base
from routers import auth, bins, analytics, feedback, location
from routers import waste_detection, profiles, disposals
from utils.auth import verify_token

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart EcoBin API",
    description="Python backend for Smart EcoBin waste management system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "https://lovable.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(bins.router, prefix="/api/bins", tags=["bins"])
app.include_router(location.router, prefix="/api/location", tags=["location"])
app.include_router(waste_detection.router, prefix="/api/waste", tags=["waste"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["profiles"])
app.include_router(disposals.router, prefix="/api/disposals", tags=["disposals"])

@app.get("/")
async def root():
    return {"message": "Smart EcoBin API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "smart-ecobin-api"}

@app.get("/api/health")
async def health_check_api():
    return {"status": "healthy", "service": "smart-ecobin-api"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
