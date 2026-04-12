import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, borderRadius, spacing, shadows } from '../theme';

interface PumpStatusCardProps {
  isRunning: boolean;
  mode: 'auto' | 'manual';
  runtime?: number;
}

export function PumpStatusCard({ isRunning, mode, runtime }: PumpStatusCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRunning) {
      // Pulse animation when running
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isRunning]);

  const formatRuntime = (seconds?: number) => {
    if (!seconds) return '—';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const statusColor = isRunning ? colors.success : colors.textMuted;
  const bgColor = isRunning ? colors.successBg : 'rgba(100, 116, 139, 0.08)';

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="water" size={18} color={colors.primary} />
          <Text style={styles.title}>Pump Status</Text>
        </View>
        <View style={[styles.modeBadge, { backgroundColor: mode === 'auto' ? colors.accent + '20' : colors.textMuted + '15' }]}>
          <Text style={[styles.modeText, { color: mode === 'auto' ? colors.accent : colors.textMuted }]}>
            {mode.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        {/* Status indicator with glow */}
        <View style={styles.indicatorContainer}>
          {isRunning && (
            <Animated.View
              style={[
                styles.glowRing,
                {
                  borderColor: statusColor,
                  opacity: glowOpacity,
                },
              ]}
            />
          )}
          <Animated.View
            style={[
              styles.statusDot,
              {
                backgroundColor: statusColor,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        </View>

        <View style={styles.statusInfo}>
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {isRunning ? 'RUNNING' : 'STOPPED'}
          </Text>
          <Text style={styles.runtimeText}>
            {isRunning ? `Runtime: ${formatRuntime(runtime)}` : 'Pump is idle'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  modeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  modeText: {
    ...typography.label,
    fontSize: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  indicatorContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    ...typography.h3,
    letterSpacing: 2,
  },
  runtimeText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
