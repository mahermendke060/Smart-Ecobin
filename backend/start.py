#!/usr/bin/env python3
"""
Smart EcoBin Backend Startup Script
"""
import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    print(f"✅ Python {version} detected")
    if sys.version_info < (3, 8, 0):
        print("❌ Error: Python 3.8 or higher is required")
        sys.exit(1)

def install_dependencies():
    """Install required dependencies"""
    print("Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        sys.exit(1)

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ .env file not found. Please create one based on the example.")
        return False
    
    required_vars = [
        "DATABASE_URL",
        "SECRET_KEY",
        "OPENAI_API_KEY",
        "ELEVENLABS_API_KEY"
    ]
    
    with open(env_file) as f:
        content = f.read()
        
    missing_vars = []
    for var in required_vars:
        if f"{var}=" not in content or f"{var}=your-" in content:
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Please configure these environment variables in .env: {', '.join(missing_vars)}")
        return False
    
    print("✅ Environment configuration looks good")
    return True

def create_uploads_dir():
    """Create uploads directory if it doesn't exist"""
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)
    print("✅ Uploads directory ready")

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting Smart EcoBin Backend Server...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔄 Press Ctrl+C to stop the server")
    
    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

def main():
    """Main startup function"""
    print("🌱 Smart EcoBin Backend Setup")
    print("=" * 40)
    
    # Check Python version
    check_python_version()
    
    # Skip dependency installation if already done
    print("⏭️  Skipping dependency installation (already completed)")
    
    # Check environment configuration
    if not check_env_file():
        print("\n📝 Please update your .env file and run this script again.")
        return
    
    # Create necessary directories
    create_uploads_dir()
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main()
