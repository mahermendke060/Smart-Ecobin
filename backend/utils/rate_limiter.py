import time
from typing import Dict, Optional
from collections import defaultdict, deque
import asyncio
from fastapi import HTTPException, Request
import redis
import os
from dotenv import load_dotenv

load_dotenv()

class InMemoryRateLimiter:
    """
    In-memory rate limiter for development/small scale production
    """
    def __init__(self):
        self.requests: Dict[str, deque] = defaultdict(deque)
        self.failed_attempts: Dict[str, deque] = defaultdict(deque)
    
    def is_rate_limited(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """
        Check if a key is rate limited
        """
        now = time.time()
        window_start = now - window_seconds
        
        # Clean old requests
        while self.requests[key] and self.requests[key][0] < window_start:
            self.requests[key].popleft()
        
        # Check if limit exceeded
        if len(self.requests[key]) >= max_requests:
            return True
        
        # Add current request
        self.requests[key].append(now)
        return False
    
    def add_failed_attempt(self, key: str):
        """
        Add a failed login attempt
        """
        now = time.time()
        self.failed_attempts[key].append(now)
    
    def is_account_locked(self, key: str, max_attempts: int = 5, lockout_minutes: int = 15) -> bool:
        """
        Check if account is locked due to failed attempts
        """
        now = time.time()
        window_start = now - (lockout_minutes * 60)
        
        # Clean old attempts
        while self.failed_attempts[key] and self.failed_attempts[key][0] < window_start:
            self.failed_attempts[key].popleft()
        
        return len(self.failed_attempts[key]) >= max_attempts

class RedisRateLimiter:
    """
    Redis-based rate limiter for production
    """
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()
            self.available = True
        except:
            self.available = False
            self.fallback = InMemoryRateLimiter()
    
    def is_rate_limited(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """
        Check if a key is rate limited using Redis
        """
        if not self.available:
            return self.fallback.is_rate_limited(key, max_requests, window_seconds)
        
        try:
            pipe = self.redis_client.pipeline()
            pipe.zremrangebyscore(key, 0, time.time() - window_seconds)
            pipe.zcard(key)
            pipe.zadd(key, {str(time.time()): time.time()})
            pipe.expire(key, window_seconds)
            results = pipe.execute()
            
            return results[1] >= max_requests
        except:
            return self.fallback.is_rate_limited(key, max_requests, window_seconds)
    
    def add_failed_attempt(self, key: str):
        """
        Add a failed login attempt
        """
        if not self.available:
            return self.fallback.add_failed_attempt(key)
        
        try:
            failed_key = f"failed:{key}"
            self.redis_client.zadd(failed_key, {str(time.time()): time.time()})
            self.redis_client.expire(failed_key, 900)  # 15 minutes
        except:
            self.fallback.add_failed_attempt(key)
    
    def is_account_locked(self, key: str, max_attempts: int = 5, lockout_minutes: int = 15) -> bool:
        """
        Check if account is locked due to failed attempts
        """
        if not self.available:
            return self.fallback.is_account_locked(key, max_attempts, lockout_minutes)
        
        try:
            failed_key = f"failed:{key}"
            window_start = time.time() - (lockout_minutes * 60)
            self.redis_client.zremrangebyscore(failed_key, 0, window_start)
            count = self.redis_client.zcard(failed_key)
            return count >= max_attempts
        except:
            return self.fallback.is_account_locked(key, max_attempts, lockout_minutes)

# Global rate limiter instance
rate_limiter = RedisRateLimiter()

def get_client_ip(request: Request) -> str:
    """
    Get client IP address from request
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "unknown"

async def check_rate_limit(request: Request, max_requests: int = 60, window_seconds: int = 60):
    """
    Middleware to check rate limits
    """
    client_ip = get_client_ip(request)
    key = f"rate_limit:{client_ip}"
    
    if rate_limiter.is_rate_limited(key, max_requests, window_seconds):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later.",
            headers={"Retry-After": str(window_seconds)}
        )

async def check_auth_rate_limit(request: Request, email: str):
    """
    Check rate limits for authentication endpoints
    """
    client_ip = get_client_ip(request)
    
    # Check IP-based rate limiting (stricter for auth)
    ip_key = f"auth_rate_limit:{client_ip}"
    if rate_limiter.is_rate_limited(ip_key, 10, 300):  # 10 attempts per 5 minutes per IP
        raise HTTPException(
            status_code=429,
            detail="Too many authentication attempts from this IP. Please try again later."
        )
    
    # Check account lockout
    if rate_limiter.is_account_locked(email):
        raise HTTPException(
            status_code=423,
            detail="Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes."
        )

def record_failed_login(email: str):
    """
    Record a failed login attempt
    """
    rate_limiter.add_failed_attempt(email)
