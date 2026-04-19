import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme';

/**
 * OAuth2 Redirect Handler
 *
 * This route exists so expo-router doesn't show "Unmatched Route" when
 * the Google OAuth callback deep link arrives:
 *   scheme://oauth2redirect?code=...&state=...
 *
 * The actual code exchange is handled by the `response` useEffect
 * in AuthContext (which fires from promptAsync's return value).
 * This route simply shows a loading spinner and waits for AuthGuard
 * to navigate once authentication completes.
 */
export default function OAuth2RedirectScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(main)/dashboard');
    }
  }, [isAuthenticated]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
