import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Platform, AppState, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, ResponseType, makeRedirectUri } from 'expo-auth-session';
import { User } from '../types';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';

const sessionResult = WebBrowser.maybeCompleteAuthSession();
console.log('[AUTH DEBUG] maybeCompleteAuthSession result:', JSON.stringify(sessionResult));

// Google OAuth discovery document
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// Google OAuth Client IDs from env variables
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

// Select the correct client ID based on the current platform
function getClientIdForPlatform(): string {
  switch (Platform.OS) {
    case 'android':
      return GOOGLE_ANDROID_CLIENT_ID;
    case 'ios':
      return GOOGLE_IOS_CLIENT_ID;
    case 'web':
    default:
      return GOOGLE_WEB_CLIENT_ID;
  }
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  handleAuthCode: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  handleAuthCode: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const platformClientId = useMemo(() => getClientIdForPlatform(), []);
  const codeHandled = useRef(false);

  // Manual deep link parser to catch the redirect in Dev Builds
  const handleDeepLink = useCallback((url: string | null) => {
    if (!url) return;
    
    // Check if it's our OAuth redirect
    if (url.includes('/oauth2redirect')) {
      console.log('[AUTH DEBUG] Manual link parser caught OAuth redirect!');
      // Extract the authorization code from the URL parameters
      const match = url.match(/[?&]code=([^&]+)/);
      if (match && match[1]) {
        const authCode = decodeURIComponent(match[1]);
        console.log('[AUTH DEBUG] Found code in manual deep link! Length:', authCode.length);
        
        // Ensure we only process the code once
        if (!codeHandled.current) {
          codeHandled.current = true;
          handleGoogleResponse(authCode);
        } else {
          console.log('[AUTH DEBUG] Code already handled, ignoring.');
        }
      }
    }
  }, []);

  // Configure Redirect URI
  // Web  → http://localhost:8081
  // Android/iOS → com.googleusercontent.apps.<CLIENT_ID_PREFIX>:/oauth2redirect
  // Note: custom URI schemes are absolutely necessary when using native Client IDs
  // (like the Android and iOS Google Client IDs) as Google strictly checks against them.
  const redirectUri = useMemo(() => {
    let uri: string;
    if (Platform.OS === 'web') {
      uri = makeRedirectUri({ preferLocalhost: true });
    } else {
      // Reverse the platform specific client ID to produce the custom URI scheme
      const reversed = platformClientId.split('.').reverse().join('.');
      uri = makeRedirectUri({
        native: `${reversed}:/oauth2redirect`,
      });
    }
    console.log('[AUTH DEBUG] redirectUri:', uri);
    return uri;
  }, [platformClientId]);

  // Configure Google Auth — raw useAuthRequest so we ONLY get the code, no auto-exchange
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: platformClientId,
      responseType: ResponseType.Code,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      usePKCE: false,
    },
    discovery
  );

  // Log request state
  useEffect(() => {
    console.log('[AUTH DEBUG] Platform:', Platform.OS);
    console.log('[AUTH DEBUG] Selected Client ID:', platformClientId ? `${platformClientId.substring(0, 20)}...` : 'MISSING');
    console.log('[AUTH DEBUG] Request ready:', !!request);
    if (request) {
      console.log('[AUTH DEBUG] Request URL:', request.url);
    }
  }, [request, platformClientId]);

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
        // Guard: only process the code once (auth codes are single-use)
        if (!codeHandled.current) {
          codeHandled.current = true;
          handleGoogleResponse(code);
        } else {
          console.log('[AUTH DEBUG] Code already handled, skipping duplicate');
        }
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

  // Track app foreground/background to detect when OAuth redirect brings app back
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      console.log('[AUTH DEBUG] AppState changed to:', nextState);
    });
    const linkingSub = Linking.addEventListener('url', (event) => {
      console.log('[AUTH DEBUG] Incoming deep link URL:', event.url);
      handleDeepLink(event.url);
    });
    Linking.getInitialURL().then((url) => {
      console.log('[AUTH DEBUG] Initial URL (cold start):', url);
      handleDeepLink(url);
    });
    return () => {
      subscription.remove();
      linkingSub.remove();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      console.log('[AUTH DEBUG] signInWithGoogle called, request ready:', !!request);
      console.log('[AUTH DEBUG] About to call promptAsync...');
      setIsLoading(true);
      codeHandled.current = false; // Reset the guard so a new code can be processed

      const result = await promptAsync();
      console.log('[AUTH DEBUG] promptAsync RETURNED — type:', result?.type);
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
        handleAuthCode: handleGoogleResponse,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
