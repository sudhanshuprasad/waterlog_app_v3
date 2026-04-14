import { io, Socket } from 'socket.io-client';
import { apiService } from './api';
import { DeviceReading, DeviceSettings, PumpThresholds, WiFiConfig } from '../types';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

type EventCallback = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isConnected: boolean = false;
  private currentDeviceId: string | null = null;

  async connect() {
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return;
    }

    const token = apiService.getAccessToken();
    if (!token) {
      console.warn('Cannot connect to socket without auth token');
      return;
    }

    this.socket = io(SOCKET_URL, {
      query: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.emit('connection_status', { connected: true });
      if (this.currentDeviceId) {
        this.joinDevice(this.currentDeviceId);
      }
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.emit('connection_status', { connected: false });
    });

    this.socket.on('sensor_update', (data: DeviceReading) => {
      // Map data structure if needed, or just emit directly
      this.emit('water_level', {
        level: data.waterLevel,
        timestamp: new Date(data.timestamp),
        unit: 'percent',
      });
      
      this.emit('pump_status', {
        isRunning: data.pumpStatus === 'on',
        mode: 'manual', // API doesn't specify mode in sensor_update, defaulting
        lastStarted: undefined,
        runtime: 0,
      });
    });

    this.socket.on('command_ack', (data: { commandId: string; status: string; message?: string }) => {
      // Handle command acknowledgement
      // In a real app we might show a toast or hide a loading spinner here
      if (data.status === 'failed') {
        console.error('Command failed:', data.message);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.emit('connection_status', { connected: false });
  }

  joinDevice(deviceId: string) {
    this.currentDeviceId = deviceId;
    if (this.isConnected && this.socket) {
      this.socket.emit('join_device', { deviceId });
    }
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  // Fallback / mock wrappers for UI actions until backend logic is fully complete
  // Actual pump control should go through the REST API directly since the spec
  // dictates POST /devices/:id/control/pump
  async sendPumpCommandREST(deviceId: string, action: 'on' | 'off') {
    console.log('[WebSocketService] sendPumpCommandREST called, deviceId:', deviceId, 'action:', action);
    const result = await apiService.sendPumpCommand(deviceId, action);
    console.log('[WebSocketService] sendPumpCommandREST result:', result);
    return result;
  }

  async updateSettingsREST(deviceId: string, settings: any) {
    return apiService.updateDeviceSettings(deviceId, settings);
  }
}

export const wsService = new WebSocketService();
