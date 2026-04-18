import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, ResponseType, makeRedirectUri } from 'expo-auth-session';
import { User } from '../types';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth discovery document
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

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

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configure Redirect URI
  const redirectUri = useMemo(() => {
    const uri = makeRedirectUri({ preferLocalhost: true });
    console.log('[AUTH DEBUG] redirectUri:', uri);
    return uri;
  }, []);

  // Configure Google Auth — raw useAuthRequest so we ONLY get the code, no auto-exchange
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      responseType: ResponseType.Code,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      usePKCE: false,
    },
    discovery
  );

  // Log request state
  useEffect(() => {
    console.log('[AUTH DEBUG] Google Client ID:', GOOGLE_CLIENT_ID);
    console.log('[AUTH DEBUG] Request ready:', !!request);
    if (request) {
      console.log('[AUTH DEBUG] Request URL:', request.url);
    }
  }, [request]);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Handle Google auth response
  useEffect(() => {
    console.log('[AUTH DEBUG] Response changed:', JSON.stringify(response, null, 2));
    if (response?.type === 'success') {
      console.log('[AUTH DEBUG] Success! Params:', response.params);
      const { code } = response.params;
      if (code) {
        console.log('[AUTH DEBUG] Got authorization code, length:', code.length);
        handleGoogleResponse(code);
      } else {
        console.error('[AUTH DEBUG] Success response but no code in params!');
        setIsLoading(false);
      }
    } else if (response?.type === 'error') {
      console.error('[AUTH DEBUG] Auth error:', response.error);
      setIsLoading(false);
    } else if (response?.type === 'cancel') {
      console.log('[AUTH DEBUG] Auth cancelled by user');
      setIsLoading(false);
    } else if (response?.type === 'dismiss') {
      console.log('[AUTH DEBUG] Auth dismissed (window closed)');
      setIsLoading(false);
    }
  }, [response]);

  const checkExistingSession = async () => {
    try {
      await apiService.initTokens();
      const token = apiService.getAccessToken();
      const storedUser = await storage.getItem('user_data');
      console.log('[AUTH DEBUG] Existing session check - token:', !!token, 'user:', !!storedUser);
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        await apiService.clearTokens();
      }
    } catch (error) {
      console.error('[AUTH DEBUG] Error checking session:', error);
      await apiService.clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleResponse = async (code: string) => {
    try {
      setIsLoading(true);
      console.log('[AUTH DEBUG] Sending code to backend with redirectUri:', redirectUri);
      const authResponse = await apiService.login('google', code, redirectUri);
      console.log('[AUTH DEBUG] Backend login success, user:', authResponse.user?.email);
      await apiService.setTokens(authResponse.accessToken, authResponse.refreshToken);
      setUser(authResponse.user);
      await storage.setItem('user_data', JSON.stringify(authResponse.user));
    } catch (error) {
      console.error('[AUTH DEBUG] Backend authentication failed:', error);
      alert('Authentication failed. Please check your connection or Google configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = useCallback(async () => {
    try {
      console.log('[AUTH DEBUG] signInWithGoogle called, request ready:', !!request);
      setIsLoading(true);
      const result = await promptAsync();
      console.log('[AUTH DEBUG] promptAsync result type:', result?.type);
      console.log('[AUTH DEBUG] promptAsync full result:', JSON.stringify(result, null, 2));
      if (result?.type !== 'success') {
         setIsLoading(false);
      }
    } catch (error) {
      console.error('[AUTH DEBUG] Google sign-in error:', error);
      setIsLoading(false);
    }
  }, [promptAsync, request]);

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
