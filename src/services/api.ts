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

    const rawText = await response.text();
    let json: ApiResponse<T>;
    try {
      json = JSON.parse(rawText);
    } catch (e) {
      console.error(`[API DEBUG] Failed to parse JSON for ${endpoint}. Raw text was:`, rawText);
      throw new Error(`Invalid server response from ${endpoint} (Status ${response.status})`);
    }

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
      const rawText = await response.text();
      let json: ApiResponse<{ accessToken: string }>;
      try {
        json = JSON.parse(rawText) as ApiResponse<{ accessToken: string }>;
      } catch (e) {
        console.error('[API DEBUG] Failed to parse JSON for /auth/refresh. Raw text:', rawText);
        return false;
      }
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

  async login(provider: 'google', code: string, redirectUri?: string): Promise<AuthResponse> {
    const body = { provider, code, redirectUri };
    console.log('[API DEBUG] POST /auth/login body:', JSON.stringify(body, null, 2));
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const rawText = await response.text();
    console.log('[API DEBUG] /auth/login status:', response.status);
    console.log('[API DEBUG] /auth/login raw response text:', rawText);
    
    let json;
    try {
      json = JSON.parse(rawText);
    } catch (e) {
      console.error('[API DEBUG] Failed to parse JSON. Raw text was:', rawText);
      throw new Error(`Invalid server response (Status ${response.status})`);
    }

    console.log('[API DEBUG] /auth/login response:', JSON.stringify(json, null, 2));
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

  async getDevices(): Promise<{ devices: Device[]; total: number }> {
    return this.request<{ devices: Device[]; total: number }>('/devices');
  }

  async registerDevice(data: { slno?: string; id?: string; name: string; location?: string }): Promise<Device> {
    return this.request<Device>('/devices/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendPumpCommand(deviceId: string, action: 'on' | 'off'): Promise<void> {
    console.log('[ApiService] sendPumpCommand called, deviceId:', deviceId, 'action:', action);
    console.log('[ApiService] URL:', `/devices/${deviceId}/control/pump`);
    try {
      const result = await this.request(`/devices/${deviceId}/control/pump`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      console.log('[ApiService] sendPumpCommand response:', result);
    } catch (error) {
      console.error('[ApiService] sendPumpCommand error:', error);
      throw error;
    }
  }

  // NOTE: Assuming these PUT endpoints exist on the backend to match the UI requirements,
  // as the provided API doc didn't cover settings/threshold updates explicitly.
  async updateDeviceSettings(deviceId: string, data: any): Promise<void> {
    await this.request(`/devices/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDevice(deviceId: string): Promise<void> {
    console.log('[ApiService] Calling DELETE /devices/', deviceId);
    try {
      await this.request(`/devices/${deviceId}`, {
        method: 'DELETE',
      });
      console.log('[ApiService] DELETE successful for:', deviceId);
    } catch (e) {
      console.error('[ApiService] DELETE failed:', e);
      throw e;
    }
  }

  async getLatestReading(deviceId: string): Promise<any> {
    try {
      const data = await this.request<any>(`/data/${deviceId}/latest`, {
        method: 'GET',
      });
      return data;
    } catch (e) {
      console.error('[ApiService] Failed to get latest reading', e);
      return null;
    }
  }
}

export const apiService = new ApiService();
