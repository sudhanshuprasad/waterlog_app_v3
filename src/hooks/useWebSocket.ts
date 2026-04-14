import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { wsService } from '../services/websocket';
import { apiService } from '../services/api';
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

  const fetchCurrentState = useCallback(async () => {
    if (!selectedDevice) return;
    try {
      const reading = await apiService.getLatestReading(selectedDevice.id);
      if (reading && reading.waterLevel !== undefined) {
        setWaterLevel({
           level: reading.waterLevel,
           timestamp: new Date(reading.timestamp),
           unit: 'percent'
        });
        setPumpStatus(prev => ({
           isRunning: reading.pumpStatus === 'on',
           mode: prev?.mode || 'manual',
           runtime: prev?.runtime || 0,
           lastStarted: prev?.lastStarted,
           lastStopped: prev?.lastStopped
        }));
      }
    } catch (e) {
      console.error('Failed to parse latest reading', e);
    }
  }, [selectedDevice]);

  // Set device whenever it changes — join by SL No (deviceToken)
  useEffect(() => {
    if (selectedDevice) {
      wsService.joinDevice(selectedDevice.deviceToken);
      fetchCurrentState();
    } else {
      setWaterLevel(null);
      setPumpStatus(null);
      setSettings(null);
    }
  }, [selectedDevice?.id, fetchCurrentState]);

  const sendPumpCommand = useCallback(async (action: 'start' | 'stop') => {
    console.log('[useWebSocket] sendPumpCommand called, action:', action, 'selectedDevice:', selectedDevice?.id);
    if (!selectedDevice) {
      console.warn('[useWebSocket] No selectedDevice, aborting');
      return;
    }
    const newIsRunning = action === 'start';
    // Save previous state for rollback
    const prevPumpStatus = pumpStatus;
    // Optimistic update — only touches isRunning, never autoMode
    setPumpStatus(prev => ({
      isRunning: newIsRunning,
      mode: prev?.mode ?? 'manual',
      lastStarted: newIsRunning ? new Date() : prev?.lastStarted,
      lastStopped: !newIsRunning ? new Date() : prev?.lastStopped,
      runtime: prev?.runtime ?? 0,
    }));
    try {
      console.log('[useWebSocket] Calling wsService.sendPumpCommandREST, deviceId:', selectedDevice.id, 'action:', newIsRunning ? 'on' : 'off');
      await wsService.sendPumpCommandREST(selectedDevice.id, newIsRunning ? 'on' : 'off');
      console.log('[useWebSocket] Pump command sent successfully');
    } catch (e: any) {
      console.error("[useWebSocket] Pump command failed, reverting", e);
      setPumpStatus(prevPumpStatus);
      Alert.alert('Pump Command Failed', e?.message || 'Could not send pump command. Please try again.');
    }
  }, [selectedDevice, pumpStatus]);

  const updateThresholds = useCallback(async (thresholds: PumpThresholds) => {
    if (!selectedDevice) return;
    const prevSettings = settings;
    setSettings(prev => prev ? { ...prev, thresholds } : { thresholds, autoMode: false });
    try {
      await wsService.updateSettingsREST(selectedDevice.id, { thresholds });
    } catch (e: any) {
      console.error("Update thresholds failed, reverting", e);
      setSettings(prevSettings);
      Alert.alert('Update Failed', e?.message || 'Could not update thresholds. Please try again.');
    }
  }, [selectedDevice, settings]);

  const updateWiFi = useCallback(async (config: WiFiConfig) => {
    if (!selectedDevice) return;
    try {
      await wsService.updateSettingsREST(selectedDevice.id, { wifi: config });
    } catch (e: any) {
      console.error("Update wifi failed", e);
      Alert.alert('WiFi Update Failed', e?.message || 'Could not update WiFi settings. Please try again.');
    }
  }, [selectedDevice]);

  const toggleAutoMode = useCallback(async (enabled: boolean) => {
    if (!selectedDevice) return;
    const prevSettings = settings;
    // Optimistic update — only touches autoMode, never pump isRunning
    setSettings(prev => prev ? { ...prev, autoMode: enabled } : { autoMode: enabled, thresholds: { turnOnBelow: 20, turnOffAbove: 80 } });
    try {
      await wsService.updateSettingsREST(selectedDevice.id, { autoMode: enabled });
    } catch (e: any) {
      console.error("Toggle auto mode failed, reverting", e);
      setSettings(prevSettings);
      Alert.alert('Auto Mode Failed', e?.message || 'Could not toggle auto mode. Please try again.');
    }
  }, [selectedDevice, settings]);

  const refreshStatus = useCallback(async () => {
    await Promise.all([
      refreshDevices(),
      fetchCurrentState()
    ]);
  }, [refreshDevices, fetchCurrentState]);

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
