// API Client for Express Backend
// Replace all Supabase calls with these API methods

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiError {
  error: string;
  errors?: Array<{ msg: string; param: string }>;
}

interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Request failed',
      }));
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // ==================== Auth Endpoints ====================

  async signUp(
    email: string,
    password: string,
    displayName?: string
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  // ==================== Profile Endpoints ====================

  async getProfile(): Promise<User> {
    return this.request<User>('/profiles/me');
  }

  async updateProfile(data: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<User> {
    return this.request<User>('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserRoles(): Promise<Array<{ role: string; createdAt: string }>> {
    return this.request<Array<{ role: string; createdAt: string }>>(
      '/profiles/me/roles'
    );
  }

  // ==================== Upload Endpoints ====================

  async uploadAvatar(file: File): Promise<{
    url: string;
    filename: string;
    size: number;
    contentType: string;
  }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Upload failed',
      }));
      throw new Error(error.error || 'Failed to upload avatar');
    }

    return response.json();
  }

  async deleteAvatar(filename: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/upload/avatar/${filename}`, {
      method: 'DELETE',
    });
  }

  async uploadFile(file: File): Promise<{
    url: string;
    filename: string;
    size: number;
    contentType: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload/file`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Upload failed',
      }));
      throw new Error(error.error || 'Failed to upload file');
    }

    return response.json();
  }

  // ==================== Theme Endpoints ====================

  async getThemeConfig(): Promise<Record<string, string>> {
    return this.request<Record<string, string>>('/theme');
  }

  async updateThemeConfig(
    config: Record<string, string>
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>('/theme', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
