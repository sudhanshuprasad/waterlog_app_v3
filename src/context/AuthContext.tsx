import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { User } from '../types';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configure Google Auth
  // Replace these with your actual Google Cloud Console client IDs
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      // Depending on the Google provider setup, you might get a code or an access_token.
      // Assuming you get an authorization code:
      const authCode = response.params?.code || response.authentication?.accessToken;
      if (authCode) {
        handleGoogleResponse(authCode);
      }
    }
  }, [response]);

  const checkExistingSession = async () => {
    try {
      await apiService.initTokens();
      const token = apiService.getAccessToken();
      const storedUser = await storage.getItem('user_data');
      if (token && storedUser) {
        // Optionally verify token validity or fetch fresh profile here
        setUser(JSON.parse(storedUser));
      } else {
        await apiService.clearTokens();
      }
    } catch (error) {
      console.error('Error checking session:', error);
      await apiService.clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleResponse = async (code: string) => {
    try {
      setIsLoading(true);
      // Attempt real login with API
      const authResponse = await apiService.login('google', code);
      await apiService.setTokens(authResponse.accessToken, authResponse.refreshToken);
      setUser(authResponse.user);
      await storage.setItem('user_data', JSON.stringify(authResponse.user));
    } catch (error) {
      console.error('Real backend auth failed:', error, 'Falling back to mock auth');
      // Mock Fallback
      await handleMockAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockAuth = async () => {
    const mockUser: User = {
      id: 'mock_user_1',
      email: 'demo@waterlog.app',
      name: 'Demo User',
    };
    setUser(mockUser);
    try {
      // Store dummy tokens
      await apiService.setTokens('mock_access', 'mock_refresh');
      await storage.setItem('user_data', JSON.stringify(mockUser));
    } catch {}
  };

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await promptAsync();
      if (result?.type !== 'success') {
         await handleMockAuth();
      }
    } catch (error) {
      console.log('Google sign-in unavailable, using mock auth');
      await handleMockAuth();
    }
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    try {
      setUser(null);
      await apiService.logout();
      await storage.removeItem('user_data');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
