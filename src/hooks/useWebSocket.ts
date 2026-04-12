import { useState, useEffect, useCallback, useRef } from 'react';
import { wsService } from '../services/websocket';
import { useDevices } from '../context/DeviceContext';
import {
  WaterLevelData,
  PumpStatus,
  DeviceSettings,
  PumpThresholds,
  WiFiConfig,
} from '../types';

export function useWebSocket() {
  const { selectedDevice, refreshDevices } = useDevices();
  const [waterLevel, setWaterLevel] = useState<WaterLevelData | null>(null);
  const [pumpStatus, setPumpStatus] = useState<PumpStatus | null>(null);
  const [settings, setSettings] = useState<DeviceSettings | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Subscribe to events
    const unsubs = [
      wsService.on('water_level', (data: WaterLevelData) => setWaterLevel(data)),
      wsService.on('pump_status', (data: PumpStatus) => setPumpStatus(data)),
      wsService.on('settings_update', (data: DeviceSettings) => setSettings(data)),
      wsService.on('connection_status', (data: { connected: boolean }) =>
        setIsConnected(data.connected)
      ),
    ];

    cleanupRef.current = unsubs;

    // Connect
    wsService.connect();

    return () => {
      unsubs.forEach((unsub) => unsub());
      wsService.disconnect();
    };
  }, []);

  // Set device id whenever it changes
  useEffect(() => {
    if (selectedDevice) {
      wsService.joinDevice(selectedDevice.id);
      
      // Seed data if any
      if (selectedDevice.lastReading) {
        setWaterLevel({
           level: selectedDevice.lastReading.waterLevel,
           timestamp: new Date(selectedDevice.lastReading.timestamp),
           unit: 'percent'
        });
        setPumpStatus({
           isRunning: selectedDevice.lastReading.pumpStatus === 'on',
           mode: 'manual',
           runtime: 0
        });
      }
    }
  }, [selectedDevice?.id]);

  const sendPumpCommand = useCallback(async (action: 'start' | 'stop') => {
    if (!selectedDevice) return;
    try {
      await wsService.sendPumpCommandREST(selectedDevice.id, action === 'start' ? 'on' : 'off');
      // Optimistic update
      setPumpStatus(prev => prev ? { ...prev, isRunning: action === 'start' } : { isRunning: action === 'start', mode: 'manual' });
    } catch (e) {
      console.error("Pump command failed", e);
    }
  }, [selectedDevice]);

  const updateThresholds = useCallback(async (thresholds: PumpThresholds) => {
    if (!selectedDevice) return;
    try {
      await wsService.updateSettingsREST(selectedDevice.id, { thresholds });
      setSettings(prev => prev ? { ...prev, thresholds } : null);
    } catch (e) {
      console.error("Update thresholds failed", e);
    }
  }, [selectedDevice]);

  const updateWiFi = useCallback(async (config: WiFiConfig) => {
    if (!selectedDevice) return;
    try {
      await wsService.updateSettingsREST(selectedDevice.id, { wifi: config });
    } catch (e) {
      console.error("Update wifi failed", e);
    }
  }, [selectedDevice]);

  const toggleAutoMode = useCallback(async (enabled: boolean) => {
    if (!selectedDevice) return;
    try {
      await wsService.updateSettingsREST(selectedDevice.id, { autoMode: enabled });
      setSettings(prev => prev ? { ...prev, autoMode: enabled } : null);
    } catch (e) {
       console.error("Toggle auto mode failed", e);
    }
  }, [selectedDevice]);

  const refreshStatus = useCallback(async () => {
    await refreshDevices();
  }, [refreshDevices]);

  return {
    waterLevel,
    pumpStatus,
    settings,
    isConnected,
    sendPumpCommand,
    updateThresholds,
    updateWiFi,
    toggleAutoMode,
    refreshStatus,
  };
}
