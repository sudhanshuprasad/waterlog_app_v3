import { storage } from '../utils/storage';
import { ApiResponse, AuthResponse, Device, User } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async initTokens() {
    this.accessToken = await storage.getItem('access_token');
    this.refreshToken = await storage.getItem('refresh_token');
  }

  async setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    await storage.setItem('access_token', access);
    await storage.setItem('refresh_token', refresh);
  }

  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    await storage.removeItem('access_token');
    await storage.removeItem('refresh_token');
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async getHeaders() {
    if (!this.accessToken) {
      await this.initTokens();
    }
    return {
      'Content-Type': 'application/json',
      ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getHeaders();
    const url = `${API_BASE_URL}${endpoint}`;
    
    let response = await fetch(url, { ...options, headers });

    if (response.status === 401 && this.refreshToken) {
      // Try refreshing the token
      const refreshSuccess = await this.refreshAccessToken();
      if (refreshSuccess) {
        // Retry original request with new token
        const newHeaders = await this.getHeaders();
        response = await fetch(url, { ...options, headers: newHeaders });
      } else {
        await this.clearTokens();
        throw new Error('Session expired');
      }
    }

    const json = await response.json() as ApiResponse<T>;
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'API request failed');
    }

    return json.data as T;
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      const json = await response.json() as ApiResponse<{ accessToken: string }>;
      if (response.ok && json.success && json.data?.accessToken) {
        this.accessToken = json.data.accessToken;
        await storage.setItem('access_token', this.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // --- Auth Endpoints ---

  async login(provider: 'google', code: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, code }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message || 'Login failed');
    }
    return json.data;
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      } catch (error) {
        console.warn('Logout request failed', error);
      }
    }
    await this.clearTokens();
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/users/profile');
  }

  // --- Device Management Endpoints ---

  async getDevices(): Promise<{ items: Device[]; total: number }> {
    return this.request<{ items: Device[]; total: number }>('/devices');
  }

  async sendPumpCommand(deviceId: string, action: 'on' | 'off'): Promise<void> {
    await this.request(`/devices/${deviceId}/control/pump`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  // NOTE: Assuming these PUT endpoints exist on the backend to match the UI requirements,
  // as the provided API doc didn't cover settings/threshold updates explicitly.
  async updateDeviceSettings(deviceId: string, data: any): Promise<void> {
    await this.request(`/devices/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
