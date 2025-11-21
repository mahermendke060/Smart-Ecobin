// API service for Smart EcoBin backend
const API_BASE_URL = 'http://localhost:8000';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async get(url: string): Promise<any> {
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Session expired');
      }
      const err = await response.json().catch(() => ({}));
      const msg = err?.detail?.message || err?.detail || `GET ${url} failed (${response.status})`;
      throw new Error(msg);
    }
    return response.json();
  }

  async post(url: string, body: any): Promise<any> {
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Session expired');
      }
      const err = await response.json().catch(() => ({}));
      const msg = err?.detail?.message || err?.detail || `POST ${url} failed (${response.status})`;
      throw new Error(msg);
    }
    return response.json();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data;
  }

  async register(userData: RegisterData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Session expired');
      }
      throw new Error('Failed to get user data');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } finally {
      localStorage.removeItem('access_token');
    }
  }

  async changePassword(current_password: string, new_password: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ current_password, new_password })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.detail?.message || err?.detail || 'Password change failed';
      throw new Error(msg);
    }
    return response.json();
  }

  // Health check
  async checkHealth(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  }

  // Profiles
  async ensureProfile(): Promise<any> {
    return this.post(`${API_BASE_URL}/api/profiles/ensure`, {});
  }

  async getProfile(): Promise<any> {
    return this.get(`${API_BASE_URL}/api/profiles/me`);
  }

  async addPoints(points: number, increment_disposals = true): Promise<any> {
    return this.post(`${API_BASE_URL}/api/profiles/points/add`, { points, increment_disposals });
  }

  // Disposals
  async createDisposal(payload: { waste_type: string; points_earned: number; bin_id?: number | null; weight?: number | null; }): Promise<any> {
    return this.post(`${API_BASE_URL}/api/disposals/`, payload);
  }

  async getRecentDisposals(limit = 5): Promise<any[]> {
    return this.get(`${API_BASE_URL}/api/disposals/recent?limit=${limit}`);
  }

  // Waste detection
  async detectWaste(image_data_base64: string, location?: { lat?: number; lng?: number }): Promise<any> {
    return this.post(`${API_BASE_URL}/api/waste/detect`, {
      image_data: image_data_base64,
      location_lat: location?.lat,
      location_lng: location?.lng
    });
  }

  // Analytics
  async getDashboardAnalytics(): Promise<any> {
    return this.get(`${API_BASE_URL}/api/analytics/dashboard`);
  }

  async getLeaderboard(): Promise<any> {
    return this.get(`${API_BASE_URL}/api/analytics/leaderboard`);
  }
}

export const apiService = new ApiService();
export type { User, LoginCredentials, RegisterData, AuthResponse };
