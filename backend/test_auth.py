#!/usr/bin/env python3
"""
Test script to verify authentication functionality
"""
import sys
import os
sys.path.append('.')

from database import engine, SessionLocal, Base
from models import User
from utils.auth import get_password_hash, verify_password
from sqlalchemy import text

def test_database_connection():
    """Test database connection and create tables"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        
        # Test connection
        db = SessionLocal()
        result = db.execute(text("SELECT 1"))
        print("✅ Database connection successful")
        db.close()
        return True
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def create_test_users():
    """Create test users for authentication"""
    try:
        db = SessionLocal()
        
        # Check if admin user exists
        admin_user = db.query(User).filter(User.email == "admin@smartecobin.com").first()
        if not admin_user:
            # Create admin user
            hashed_password = get_password_hash("admin123")
            admin_user = User(
                email="admin@smartecobin.com",
                hashed_password=hashed_password,
                full_name="Admin User",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("✅ Admin user created: admin@smartecobin.com / admin123")
        else:
            print("✅ Admin user already exists")
        
        # Check if test user exists
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            # Create test user
            hashed_password = get_password_hash("test123")
            test_user = User(
                email="test@example.com",
                hashed_password=hashed_password,
                full_name="Test User",
                is_active=True
            )
            db.add(test_user)
            db.commit()
            print("✅ Test user created: test@example.com / test123")
        else:
            print("✅ Test user already exists")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ User creation error: {e}")
        return False

def test_password_verification():
    """Test password hashing and verification"""
    try:
        password = "test123"
        hashed = get_password_hash(password)
        
        # Test correct password
        if verify_password(password, hashed):
            print("✅ Password verification works correctly")
        else:
            print("❌ Password verification failed")
            return False
        
        # Test incorrect password
        if not verify_password("wrong_password", hashed):
            print("✅ Password rejection works correctly")
        else:
            print("❌ Password rejection failed")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Password verification error: {e}")
        return False

def test_user_login():
    """Test user login functionality"""
    try:
        db = SessionLocal()
        
        # Test admin login
        admin_user = db.query(User).filter(User.email == "admin@smartecobin.com").first()
        if admin_user and verify_password("admin123", admin_user.hashed_password):
            print("✅ Admin login verification successful")
        else:
            print("❌ Admin login verification failed")
            return False
        
        # Test test user login
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if test_user and verify_password("test123", test_user.hashed_password):
            print("✅ Test user login verification successful")
        else:
            print("❌ Test user login verification failed")
            return False
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ Login test error: {e}")
        return False

def main():
    print("Testing Smart EcoBin Authentication System")
    print("=" * 50)
    
    # Test database connection
    if not test_database_connection():
        return
    
    # Test password functions
    if not test_password_verification():
        return
    
    # Create test users
    if not create_test_users():
        return
    
    # Test user login
    if not test_user_login():
        return
    
    print("=" * 50)
    print("All authentication tests passed!")
    print("\nTest accounts available:")
    print("- admin@smartecobin.com / admin123")
    print("- test@example.com / test123")

if __name__ == "__main__":
    main()
