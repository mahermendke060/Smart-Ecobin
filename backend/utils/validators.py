import re
from typing import Optional
from pydantic import ValidationError

def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """
    Validate password strength for production use.
    Returns (is_valid, list_of_errors)
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if len(password) > 128:
        errors.append("Password must be less than 128 characters long")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        errors.append("Password must contain at least one digit")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_+=\-\[\]\\;\'\/~`]', password):
        errors.append("Password must contain at least one special character")
    
    # Check for common weak passwords
    weak_passwords = [
        'password', '12345678', 'qwerty123', 'admin123', 
        'password123', '123456789', 'welcome123'
    ]
    
    if password.lower() in weak_passwords:
        errors.append("Password is too common. Please choose a stronger password")
    
    return len(errors) == 0, errors

def validate_email_format(email: str) -> tuple[bool, Optional[str]]:
    """
    Validate email format beyond basic regex
    """
    if not email or len(email) > 254:
        return False, "Email address is too long"
    
    # Check for basic email format
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        return False, "Invalid email format"
    
    # Check for suspicious patterns
    if '..' in email or email.startswith('.') or email.endswith('.'):
        return False, "Invalid email format"
    
    return True, None

def validate_full_name(name: Optional[str]) -> tuple[bool, Optional[str]]:
    """
    Validate full name
    """
    if not name:
        return False, "Full name is required"
    
    name = name.strip()
    
    if len(name) < 2:
        return False, "Full name must be at least 2 characters long"
    
    if len(name) > 100:
        return False, "Full name must be less than 100 characters long"
    
    # Check for valid characters (letters, spaces, hyphens, apostrophes)
    if not re.match(r"^[a-zA-Z\s\-'\.]+$", name):
        return False, "Full name contains invalid characters"
    
    return True, None

def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent XSS and injection attacks
    """
    if not text:
        return ""
    
    # Remove potentially dangerous characters
    text = re.sub(r'[<>"\']', '', text)
    
    # Trim whitespace
    text = text.strip()
    
    return text
