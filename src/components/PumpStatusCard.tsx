import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, borderRadius, spacing, shadows } from '../theme';

interface PumpStatusCardProps {
  isRunning: boolean;
  mode: 'auto' | 'manual';
  runtime?: number;
  autoMode?: boolean;
  onToggle?: (action: 'start' | 'stop') => void;
}

export function PumpStatusCard({ isRunning, mode, runtime, autoMode = false, onToggle }: PumpStatusCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isRunning ? 1 : 0)).current;
  const bgAnim = useRef(new Animated.Value(isRunning ? 1 : 0)).current;

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

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isRunning ? 1 : 0,
        damping: 15,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.timing(bgAnim, {
        toValue: isRunning ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isRunning]);

  const handlePress = () => {
    if (!onToggle) return;
    if (autoMode) {
      Alert.alert(
        'Auto Mode Active',
        'Disable auto mode from Settings to manually control the pump.',
        [{ text: 'OK' }]
      );
      return;
    }

    const action = isRunning ? 'stop' : 'start';
    Alert.alert(
      `${action === 'start' ? 'Start' : 'Stop'} Pump?`,
      `Are you sure you want to ${action} the water pump?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'start' ? 'Start' : 'Stop',
          style: action === 'stop' ? 'destructive' : 'default',
          onPress: () => onToggle(action),
        },
      ]
    );
  };

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

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 50],
  });

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textMuted + '30', colors.success + '30'],
  });

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="water" size={18} color={colors.primary} />
          <Text style={styles.title}>Pump Control</Text>
        </View>
        <View style={[styles.modeBadge, { backgroundColor: autoMode ? colors.warningBg : colors.textMuted + '15' }]}>
          <Text style={[styles.modeText, { color: autoMode ? colors.warning : colors.textMuted }]}>
            {autoMode ? 'AUTO LOCKED' : 'MANUAL'}
          </Text>
        </View>
      </View>

      <View style={styles.contentRow}>
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

        {onToggle && (
          <View style={styles.controlContainer}>
            <TouchableOpacity
              onPress={handlePress}
              activeOpacity={0.8}
              style={styles.switchTouchable}
            >
              <Animated.View style={[styles.switchTrack, { backgroundColor }]}>
                <Animated.View
                  style={[
                    styles.switchThumb,
                    {
                      transform: [{ translateX }],
                      backgroundColor: isRunning ? colors.success : colors.textMuted,
                    },
                  ]}
                >
                  <Ionicons
                    name={isRunning ? 'checkmark' : 'close'}
                    size={16}
                    color={colors.white}
                  />
                </Animated.View>
              </Animated.View>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {autoMode && (
        <Text style={styles.hint}>
          Switch to manual mode in Settings to control pump
        </Text>
      )}
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  indicatorContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    ...typography.h3,
    letterSpacing: 1,
    fontSize: 16,
  },
  runtimeText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  controlContainer: {
    marginLeft: spacing.md,
  },
  switchTouchable: {
    borderRadius: 26,
  },
  switchTrack: {
    width: 92,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  switchThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
