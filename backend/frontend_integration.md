# Frontend Integration Guide

This guide explains how to update your React frontend to use the new Python backend instead of Supabase.

## Environment Variables

Update your frontend `.env` file:

```env
# Replace Supabase variables with Python backend
VITE_API_BASE_URL=http://localhost:8000/api
VITE_BACKEND_URL=http://localhost:8000

# Remove these Supabase variables:
# VITE_SUPABASE_PROJECT_ID=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...
# VITE_SUPABASE_URL=...
```

## API Client Setup

Create a new API client to replace Supabase:

```typescript
// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('access_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setToken(response.access_token);
    return response;
  }

  async register(email: string, password: string, full_name?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  // Waste Detection
  async detectWaste(imageData: string, location?: { lat: number; lng: number }) {
    return this.request('/detection/detect', {
      method: 'POST',
      body: JSON.stringify({
        image_data: imageData,
        location_lat: location?.lat,
        location_lng: location?.lng,
      }),
    });
  }

  async getDetectionHistory() {
    return this.request('/detection/history');
  }

  // Bins
  async getBins(filters?: { lat?: number; lng?: number; radius?: number; bin_type?: string }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/bins/${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getNearbyBins(lat: number, lng: number, radius = 2, limit = 10) {
    return this.request(`/bins/nearby?lat=${lat}&lng=${lng}&radius=${radius}&limit=${limit}`);
  }

  // Analytics
  async getDashboardAnalytics() {
    return this.request('/analytics/dashboard');
  }

  async getEnvironmentalImpact() {
    return this.request('/analytics/environmental-impact');
  }

  async getLeaderboard() {
    return this.request('/analytics/leaderboard');
  }

  // Feedback
  async submitFeedback(feedback: {
    type: string;
    rating?: number;
    message: string;
    email?: string;
  }) {
    return this.request('/feedback/submit', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  async getFeedback() {
    return this.request('/feedback/');
  }

  // Voice Assistant
  async voiceChat(message: string, agentId: string) {
    return this.request('/voice/chat', {
      method: 'POST',
      body: JSON.stringify({ message, agent_id: agentId }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

## Update Auth Context

Replace Supabase auth with the new API:

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await apiClient.login(email, password);
    const userData = await apiClient.getCurrentUser();
    setUser(userData);
  }

  async function register(email: string, password: string, fullName?: string) {
    await apiClient.register(email, password, fullName);
    await login(email, password);
  }

  async function logout() {
    await apiClient.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## Component Updates

### Update Feedback Component

```typescript
// In src/components/Feedback.tsx, replace the handleSubmit function:

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!feedback.trim()) {
    toast({
      title: 'Feedback Required',
      description: 'Please provide your feedback before submitting.',
      variant: 'destructive',
    });
    return;
  }

  setIsSubmitting(true);

  try {
    await apiClient.submitFeedback({
      type: selectedType,
      rating: selectedType === 'general' || selectedType === 'appreciation' ? rating : undefined,
      message: feedback.trim(),
      email: email.trim() || undefined,
    });

    setIsSubmitted(true);
    toast({
      title: 'Feedback Submitted!',
      description: 'Thank you for helping us improve Smart EcoBin.',
    });

    // Reset form after delay
    setTimeout(() => {
      setIsSubmitted(false);
      setFeedback('');
      setRating(0);
      setEmail('');
      setSelectedType('general');
    }, 3000);

  } catch (error) {
    toast({
      title: 'Submission Failed',
      description: 'Please try again later.',
      variant: 'destructive',
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

### Update Voice Assistant

```typescript
// In src/components/VoiceAssistant.tsx, update the API call:

const sendMessage = async (message: string) => {
  try {
    const response = await apiClient.voiceChat(message, 'agent_2501k49fw5tffb8tw0x104q2x8nz');
    
    // Handle response
    if (response.audio_content) {
      // Play audio response
      const audio = new Audio(`data:audio/mp3;base64,${response.audio_content}`);
      audio.play();
    }
    
    return response.response;
  } catch (error) {
    console.error('Voice assistant error:', error);
    return "I'm sorry, I'm having trouble processing your request right now.";
  }
};
```

## Quick Migration Steps

1. **Install the Python backend dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up PostgreSQL database**:
   ```bash
   # Using Docker
   docker-compose up postgres redis -d
   
   # Or install PostgreSQL locally and create database
   createdb smart_ecobin
   ```

3. **Configure environment variables**:
   - Update `backend/.env` with your database credentials and API keys
   - Update frontend `.env` to point to Python backend

4. **Seed the database**:
   ```bash
   cd backend
   python seed_data.py
   ```

5. **Start the Python backend**:
   ```bash
   cd backend
   python start.py
   ```

6. **Update frontend imports**:
   - Replace all Supabase imports with the new API client
   - Update authentication calls
   - Update data fetching calls

The Python backend is now ready and provides all the same functionality as your Supabase setup, but with more control and customization options!
