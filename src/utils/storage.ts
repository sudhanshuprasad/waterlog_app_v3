import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * A wrapper around SecureStore that falls back to localStorage on the Web,
 * since expo-secure-store does not support the web platform natively.
 */
const inMemoryCache: Record<string, string> = {};

export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error('Local storage is unavailable:', e);
      }
    } else {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (e) {
        console.warn('SecureStore unavailable, falling back to memory cache:', e);
        inMemoryCache[key] = value;
      }
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error('Local storage is unavailable:', e);
        return null;
      }
    } else {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (e) {
        console.warn('SecureStore unavailable, reading from memory cache:', e);
        return inMemoryCache[key] || null;
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Local storage is unavailable:', e);
      }
    } else {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (e) {
        console.warn('SecureStore unavailable, deleting from memory cache:', e);
        delete inMemoryCache[key];
      }
    }
  }
};
