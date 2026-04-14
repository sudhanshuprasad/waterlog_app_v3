import React, { createContext, useContext, useState, useEffect } from 'react';
import { Device } from '../types';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

interface DeviceContextType {
  devices: Device[];
  selectedDevice: Device | null;
  isLoading: boolean;
  refreshDevices: () => Promise<void>;
  selectDevice: (deviceId: string) => void;
}

const DeviceContext = createContext<DeviceContextType>({
  devices: [],
  selectedDevice: null,
  isLoading: true,
  refreshDevices: async () => {},
  selectDevice: () => {},
});

export const useDevices = () => useContext(DeviceContext);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshDevices = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getDevices();
      setDevices(data.devices);
      
      // Auto-select first device if none selected
      if (data.devices.length > 0 && !selectedDevice) {
        setSelectedDevice(data.devices[0]);
      } else if (selectedDevice) {
        // Update selected device info
        const updated = data.devices.find(d => d.id === selectedDevice.id);
        if (updated) {
          setSelectedDevice(updated);
        } else {
          // Device was removed, fallback to another device or null
          setSelectedDevice(data.devices.length > 0 ? data.devices[0] : null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      // Fallback pseudo-device for development/mock mode when API fails
      if (devices.length === 0) {
         const mockDevice: Device = {
           id: 'mock-device-1',
           name: 'Mock Home Tank',
           location: 'Roof',
           status: 'active',
           lastSeen: new Date().toISOString()
         };
         setDevices([mockDevice]);
         if (!selectedDevice) setSelectedDevice(mockDevice);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshDevices();
    } else {
      setDevices([]);
      setSelectedDevice(null);
    }
  }, [isAuthenticated]);

  const selectDevice = (deviceId: string) => {
    const dev = devices.find(d => d.id === deviceId);
    if (dev) {
      setSelectedDevice(dev);
    }
  };

  return (
    <DeviceContext.Provider
      value={{
        devices,
        selectedDevice,
        isLoading,
        refreshDevices,
        selectDevice,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}
