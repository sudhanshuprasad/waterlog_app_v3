import { io, Socket } from 'socket.io-client';
import { apiService } from './api';
import { DeviceReading, DeviceSettings, PumpThresholds, WiFiConfig } from '../types';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

type EventCallback = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isConnected: boolean = false;
  private currentDeviceToken: string | null = null;

  async connect() {
    if (this.socket && this.socket.connected) {
      console.log('[WebSocketService] Already connected!');
      return;
    }

    if (this.socket && !this.socket.connected) {
      console.log('[WebSocketService] Socket exists but disconnected, reconnecting...');
      this.socket.connect();
      return;
    }

    console.log('[WebSocketService] Initializing new connection...');
    await apiService.initTokens();
    const token = apiService.getAccessToken();
    if (!token) {
      console.warn('[WebSocketService] Cannot connect to socket without auth token. Token is null.');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      console.log('[WebSocketService] Connected to socket server! ID:', this.socket?.id);
      this.isConnected = true;
      this.emit('connection_status', { connected: true });
      if (this.currentDeviceToken) {
        this.joinDevice(this.currentDeviceToken);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocketService] Disconnected from server. Reason:', reason);
      this.isConnected = false;
      this.emit('connection_status', { connected: false });
      
      // If the server forcefully disconnects the socket, we must reconnect manually.
      // Other reasons like 'io client disconnect' or 'ping timeout' will auto-reconnect or are intentional.
      if (reason === 'io server disconnect') {
         setTimeout(() => {
            console.log('[WebSocketService] Reconnecting after server disconnect...');
            this.socket?.connect();
         }, 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocketService] Connection error:', error.message);
    });

    // Server confirms subscription
    this.socket.on('subscribed', (data: any) => {
      // console.log('[WebSocketService] SUBSCRIBED confirmed by server:', JSON.stringify(data));
    });

    this.socket.on('subscription:error', (data: any) => {
      console.error('[WebSocketService] SUBSCRIPTION ERROR from server:', JSON.stringify(data));
    });

    this.socket.on('connected', (data: any) => {
      // console.log('[WebSocketService] SERVER connected event:', JSON.stringify(data));
    });

    this.socket.on('sensor_update', (payload: any) => {
      console.log('[WebSocketService] RECEIVED sensor_update:', JSON.stringify(payload, null, 2));
      
      // Filter out events that do not belong to the currently selected device
      const isMatch = payload.slno === this.currentDeviceToken || payload.deviceId === this.currentDeviceToken;
      if (!isMatch && this.currentDeviceToken !== null) {
        // console.log(`[WebSocketService] Ignoring update for ${payload.slno || payload.deviceId} as selected device is ${this.currentDeviceToken}`);
        return;
      }

      const reading = payload?.data?.reading;
      if (!reading) {
        console.warn('[WebSocketService] No reading in sensor_update payload');
        return;
      }

      this.emit('water_level', {
        level: reading.waterLevel,
        timestamp: new Date(payload.timestamp),
        unit: 'percent',
      });
      
      this.emit('pump_status', {
        isRunning: reading.pumpStatus === 'on',
        mode: 'manual',
        lastStarted: undefined,
        runtime: 0,
      });
    });

    this.socket.on('command_ack', (data: { commandId: string; status: string; message?: string }) => {
      console.log('[WebSocketService] command_ack:', JSON.stringify(data));
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

  leaveDevice(deviceToken: string) {
    if (this.isConnected && this.socket) {
      this.socket.emit('unsubscribe:device', { deviceToken });
    }
  }

  joinDevice(deviceToken: string) {
    // console.log(`[WebSocketService] Intent to join device room by token: ${deviceToken}`);
    if (this.currentDeviceToken && this.currentDeviceToken !== deviceToken) {
      this.leaveDevice(this.currentDeviceToken);
    }
    this.currentDeviceToken = deviceToken;
    if (this.isConnected && this.socket) {
      // console.log(`[WebSocketService] Emitting join_device with deviceToken=${deviceToken}`);
      this.socket.emit('join_device', { deviceToken });
    } else {
      console.log(`[WebSocketService] Cannot emit join_device yet, socket connected=${this.isConnected}`);
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
