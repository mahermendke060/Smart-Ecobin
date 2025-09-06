"""
Seed data script for Smart EcoBin backend
Run this to populate the database with initial data
"""
import asyncio
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Bin, User
from utils.auth import get_password_hash

def create_sample_bins(db: Session):
    """Create sample waste bins across different locations"""
    sample_bins = [
        # Mumbai locations
        {"name": "Marine Drive General Bin", "type": "general", "latitude": 18.9434, "longitude": 72.8234, "address": "Marine Drive, Mumbai", "capacity": 75, "status": "available"},
        {"name": "Marine Drive Recycling", "type": "recycling", "latitude": 18.9430, "longitude": 72.8230, "address": "Marine Drive, Mumbai", "capacity": 60, "status": "available"},
        {"name": "Gateway of India Bin", "type": "general", "latitude": 18.9220, "longitude": 72.8347, "address": "Gateway of India, Mumbai", "capacity": 90, "status": "nearly_full"},
        {"name": "Colaba Recycling Center", "type": "recycling", "latitude": 18.9067, "longitude": 72.8147, "address": "Colaba, Mumbai", "capacity": 45, "status": "available"},
        {"name": "Bandra Organic Waste", "type": "organic", "latitude": 19.0596, "longitude": 72.8295, "address": "Bandra West, Mumbai", "capacity": 85, "status": "available"},
        
        # Delhi locations
        {"name": "India Gate General", "type": "general", "latitude": 28.6129, "longitude": 77.2295, "address": "India Gate, New Delhi", "capacity": 70, "status": "available"},
        {"name": "Connaught Place Recycling", "type": "recycling", "latitude": 28.6315, "longitude": 77.2167, "address": "Connaught Place, New Delhi", "capacity": 95, "status": "full"},
        {"name": "Red Fort Waste Bin", "type": "general", "latitude": 28.6562, "longitude": 77.2410, "address": "Red Fort, Delhi", "capacity": 55, "status": "available"},
        
        # Bangalore locations
        {"name": "Cubbon Park General", "type": "general", "latitude": 12.9716, "longitude": 77.5946, "address": "Cubbon Park, Bangalore", "capacity": 80, "status": "available"},
        {"name": "MG Road Recycling", "type": "recycling", "latitude": 12.9759, "longitude": 77.6061, "address": "MG Road, Bangalore", "capacity": 65, "status": "available"},
        {"name": "Brigade Road Organic", "type": "organic", "latitude": 12.9719, "longitude": 77.6081, "address": "Brigade Road, Bangalore", "capacity": 40, "status": "nearly_full"},
        
        # Chennai locations
        {"name": "Marina Beach General", "type": "general", "latitude": 13.0475, "longitude": 80.2824, "address": "Marina Beach, Chennai", "capacity": 85, "status": "available"},
        {"name": "T Nagar Recycling", "type": "recycling", "latitude": 13.0418, "longitude": 80.2341, "address": "T Nagar, Chennai", "capacity": 70, "status": "available"},
        
        # Hazardous waste centers
        {"name": "Mumbai Hazardous Center", "type": "hazardous", "latitude": 19.0760, "longitude": 72.8777, "address": "Andheri, Mumbai", "capacity": 30, "status": "available"},
        {"name": "Delhi Hazardous Center", "type": "hazardous", "latitude": 28.7041, "longitude": 77.1025, "address": "Rohini, Delhi", "capacity": 25, "status": "available"},
    ]
    
    for bin_data in sample_bins:
        existing_bin = db.query(Bin).filter(Bin.name == bin_data["name"]).first()
        if not existing_bin:
            bin_obj = Bin(**bin_data)
            db.add(bin_obj)
    
    db.commit()
    print(f"✅ Created {len(sample_bins)} sample bins")

def create_admin_user(db: Session):
    """Create an admin user for testing"""
    admin_email = "admin@smartecobin.com"
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    
    if not existing_admin:
        admin_user = User(
            email=admin_email,
            hashed_password=get_password_hash("admin123"),
            full_name="Smart EcoBin Admin",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print("✅ Created admin user (admin@smartecobin.com / admin123)")
    else:
        print("ℹ️ Admin user already exists")

def create_test_user(db: Session):
    """Create a test user for development"""
    test_email = "test@example.com"
    existing_user = db.query(User).filter(User.email == test_email).first()
    
    if not existing_user:
        test_user = User(
            email=test_email,
            hashed_password=get_password_hash("test123"),
            full_name="Test User",
            is_active=True
        )
        db.add(test_user)
        db.commit()
        print("✅ Created test user (test@example.com / test123)")
    else:
        print("ℹ️ Test user already exists")

def main():
    """Main seeding function"""
    print("🌱 Seeding Smart EcoBin database...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Get database session
    db = SessionLocal()
    
    try:
        # Create sample data
        create_admin_user(db)
        create_test_user(db)
        create_sample_bins(db)
        
        print("✅ Database seeding completed successfully!")
        print("\nTest Credentials:")
        print("Admin: admin@smartecobin.com / admin123")
        print("User:  test@example.com / test123")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
