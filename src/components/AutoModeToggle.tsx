import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, borderRadius, spacing, shadows } from '../theme';

interface AutoModeToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  thresholds?: { turnOnBelow: number; turnOffAbove: number };
}

export function AutoModeToggle({
  isEnabled,
  onToggle,
  thresholds,
}: AutoModeToggleProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(isEnabled ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isEnabled ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (isEnabled) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isEnabled]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle(!isEnabled);
  };

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.backgroundCard, colors.accent + '15'],
  });

  const borderColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surfaceBorder, colors.accent + '40'],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View
          style={[styles.card, shadows.card, { backgroundColor, borderColor }]}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <Ionicons
                  name="settings"
                  size={20}
                  color={isEnabled ? colors.accent : colors.textMuted}
                />
              </Animated.View>
              <Text style={styles.title}>Auto Mode</Text>
            </View>

            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isEnabled ? colors.accent + '20' : colors.textMuted + '15',
                },
              ]}
            >
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: isEnabled ? colors.accent : colors.textMuted },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isEnabled ? colors.accent : colors.textMuted },
                ]}
              >
                {isEnabled ? 'ACTIVE' : 'OFF'}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>
            {isEnabled
              ? 'Pump will automatically turn on and off based on water level thresholds.'
              : 'Enable auto mode to let the system manage the pump automatically.'}
          </Text>

          {isEnabled && thresholds && (
            <View style={styles.thresholdInfo}>
              <View style={styles.thresholdItem}>
                <Ionicons name="arrow-down" size={14} color={colors.danger} />
                <Text style={styles.thresholdText}>
                  ON below {thresholds.turnOnBelow}%
                </Text>
              </View>
              <View style={styles.thresholdDivider} />
              <View style={styles.thresholdItem}>
                <Ionicons name="arrow-up" size={14} color={colors.success} />
                <Text style={styles.thresholdText}>
                  OFF above {thresholds.turnOffAbove}%
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.label,
    fontSize: 10,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  thresholdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: spacing.lg,
  },
  thresholdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  thresholdText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  thresholdDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.divider,
  },
});
