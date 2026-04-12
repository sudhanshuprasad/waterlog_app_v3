export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  oauthProvider?: string;
  createdAt?: string;
}

export interface DeviceReading {
  waterLevel: number;
  pumpStatus: 'on' | 'off';
  timestamp: string;
  battery?: number;
  signal?: number;
}

export interface Device {
  id: string;
  name: string;
  location: string;
  status: string;
  lastSeen: string;
  lastReading?: DeviceReading;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp?: string;
}

// Keep existing UI-related types
export interface WaterLevelData {
  level: number; // 0-100 percentage
  timestamp: Date;
  unit: 'percent' | 'cm' | 'liters';
  rawValue?: number;
}

export interface PumpStatus {
  isRunning: boolean;
  mode: 'auto' | 'manual';
  lastStarted?: Date;
  lastStopped?: Date;
  runtime?: number; // seconds
}

export interface PumpThresholds {
  turnOnBelow: number; // percentage
  turnOffAbove: number; // percentage
}

export interface WiFiConfig {
  ssid: string;
  password: string;
}

export interface DeviceSettings {
  thresholds: PumpThresholds;
  autoMode: boolean;
  wifi?: WiFiConfig;
}

export type WebSocketEvent =
  | { type: 'sensor_update'; data: DeviceReading }
  | { type: 'command_ack'; data: { commandId: string; status: string; message?: string } }
  | { type: 'connection_status'; data: { connected: boolean } };

export type WebSocketCommand =
  | { type: 'join_device'; data: { deviceId: string } };
