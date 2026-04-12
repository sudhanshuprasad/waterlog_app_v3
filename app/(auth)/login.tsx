import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { colors, gradients, typography, borderRadius, spacing, shadows } from '../../src/theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const buttonSlide = useRef(new Animated.Value(60)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 12,
        stiffness: 100,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(buttonSlide, {
        toValue: 0,
        duration: 600,
        delay: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(buttonFade, {
        toValue: 1,
        duration: 400,
        delay: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous wave animations
    Animated.loop(
      Animated.timing(wave1Anim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(wave2Anim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    ).start();

    // Ripple animations
    const createRipple = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    createRipple(ripple1, 0).start();
    createRipple(ripple2, 1500).start();
  }, []);

  const wave1TranslateY = wave1Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -15, 0],
  });

  const wave2TranslateY = wave2Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -10, 0],
  });

  const ripple1Scale = ripple1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 2.5],
  });

  const ripple1Opacity = ripple1.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.4, 0.2, 0],
  });

  const ripple2Scale = ripple2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 2.5],
  });

  const ripple2Opacity = ripple2.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.4, 0.2, 0],
  });

  return (
    <LinearGradient
      colors={gradients.loginBg as any}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Water ripple effects */}
        <View style={styles.rippleContainer}>
          <Animated.View
            style={[
              styles.ripple,
              {
                transform: [{ scale: ripple1Scale }],
                opacity: ripple1Opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ripple,
              {
                transform: [{ scale: ripple2Scale }],
                opacity: ripple2Opacity,
              },
            ]}
          />
        </View>

        {/* Logo section */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="water" size={42} color={colors.primary} />
            </View>
            {/* Glow behind logo */}
            <View style={styles.logoGlow} />
          </View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={styles.appName}>WaterLog</Text>
            <Text style={styles.tagline}>Smart Water Management</Text>
          </Animated.View>
        </Animated.View>

        {/* Features preview */}
        <Animated.View
          style={[
            styles.featuresContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {[
            { icon: 'analytics-outline' as const, text: 'Real-time monitoring' },
            { icon: 'toggle-outline' as const, text: 'Remote pump control' },
            { icon: 'settings-outline' as const, text: 'Smart automation' },
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name={feature.icon} size={16} color={colors.accent} />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Bottom section with waves and button */}
        <View style={styles.bottomSection}>
          {/* Animated waves */}
          <View style={styles.wavesContainer}>
            <Animated.View
              style={[
                styles.wave,
                styles.wave1,
                { transform: [{ translateY: wave1TranslateY }] },
              ]}
            />
            <Animated.View
              style={[
                styles.wave,
                styles.wave2,
                { transform: [{ translateY: wave2TranslateY }] },
              ]}
            />
          </View>

          {/* Sign in button */}
          <Animated.View
            style={{
              opacity: buttonFade,
              transform: [{ translateY: buttonSlide }],
            }}
          >
            <TouchableOpacity
              style={[styles.googleButton, shadows.card]}
              onPress={signInWithGoogle}
              activeOpacity={0.85}
            >
              <View style={styles.googleIconContainer}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By signing in, you agree to our Terms of Service
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing['3xl'],
  },
  rippleContainer: {
    position: 'absolute',
    top: height * 0.25,
    left: width / 2 - 40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: height * 0.12,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: spacing['2xl'],
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary + '12',
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '08',
    top: -16,
    left: -16,
    zIndex: -1,
  },
  appName: {
    ...typography.h1,
    fontSize: 38,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -1,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  featuresContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bottomSection: {
    paddingBottom: spacing['3xl'],
    position: 'relative',
  },
  wavesContainer: {
    position: 'absolute',
    bottom: 120,
    left: -spacing['3xl'],
    right: -spacing['3xl'],
    height: 60,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    left: -20,
    right: -20,
    height: 40,
    borderRadius: 20,
  },
  wave1: {
    backgroundColor: colors.primary + '08',
    bottom: 0,
  },
  wave2: {
    backgroundColor: colors.accent + '06',
    bottom: 10,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    gap: spacing.md,
  },
  googleIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  googleButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
    fontSize: 16,
  },
  termsText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: 11,
  },
});
