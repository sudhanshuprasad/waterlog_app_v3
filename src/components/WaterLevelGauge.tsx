import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../theme';

interface WaterLevelGaugeProps {
  level: number; // 0-100
  size?: number;
}

export function WaterLevelGauge({ level, size = 220 }: WaterLevelGaugeProps) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Clamp level
  const clampedLevel = Math.max(0, Math.min(100, level));

  // Determine color based on level
  const getColor = () => {
    if (clampedLevel >= 60) return colors.waterHigh;
    if (clampedLevel >= 30) return colors.warning;
    return colors.danger;
  };

  const getStatusText = () => {
    if (clampedLevel >= 80) return 'FULL';
    if (clampedLevel >= 60) return 'GOOD';
    if (clampedLevel >= 30) return 'LOW';
    return 'CRITICAL';
  };

  const getStatusColor = () => {
    if (clampedLevel >= 60) return colors.success;
    if (clampedLevel >= 30) return colors.warning;
    return colors.danger;
  };

  useEffect(() => {
    // Animate fill level
    Animated.spring(fillAnim, {
      toValue: clampedLevel / 100,
      damping: 15,
      stiffness: 60,
      useNativeDriver: false,
    }).start();

    // Wave animations
    Animated.loop(
      Animated.timing(wave1Anim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(wave2Anim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    ).start();
  }, [clampedLevel]);

  // Pulse animation for critical levels
  useEffect(() => {
    if (clampedLevel < 20) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [clampedLevel < 20]);

  const containerSize = size;
  const tankHeight = containerSize * 0.65;
  const tankWidth = containerSize * 0.55;

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tankHeight - 8],
  });

  const wave1Translate = wave1Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-4, 4, -4],
  });

  const wave2Translate = wave2Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [3, -3, 3],
  });

  const waterColor = getColor();

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale: pulseAnim }] }]}
    >
      {/* Percentage display */}
      <View style={styles.percentageContainer}>
        <Text style={[styles.percentageValue, { color: waterColor }]}>
          {Math.round(clampedLevel)}
        </Text>
        <Text style={[styles.percentageSymbol, { color: waterColor }]}>%</Text>
      </View>

      {/* Tank container */}
      <View
        style={[
          styles.tank,
          {
            height: tankHeight,
            width: tankWidth,
            borderColor: waterColor + '40',
          },
        ]}
      >
        {/* Water fill */}
        <Animated.View
          style={[
            styles.waterFill,
            {
              height: fillHeight,
              backgroundColor: waterColor + '25',
            },
          ]}
        >
          {/* Wave effect 1 */}
          <Animated.View
            style={[
              styles.wave,
              {
                backgroundColor: waterColor + '30',
                transform: [{ translateY: wave1Translate }],
              },
            ]}
          />
          {/* Wave effect 2 */}
          <Animated.View
            style={[
              styles.wave2,
              {
                backgroundColor: waterColor + '20',
                transform: [{ translateY: wave2Translate }],
              },
            ]}
          />
        </Animated.View>

        {/* Level markers */}
        {[25, 50, 75].map((mark) => (
          <View
            key={mark}
            style={[
              styles.levelMark,
              { bottom: `${mark}%` as any },
            ]}
          >
            <View style={styles.markLine} />
            <Text style={styles.markText}>{mark}</Text>
          </View>
        ))}
      </View>

      {/* Status label */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      <Text style={styles.label}>Water Level</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  percentageValue: {
    ...typography.huge,
    fontSize: 56,
    lineHeight: 60,
  },
  percentageSymbol: {
    ...typography.h2,
    marginBottom: 6,
    marginLeft: 2,
  },
  tank: {
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  waterFill: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    top: -8,
    left: -10,
    right: -10,
    height: 20,
    borderRadius: 10,
  },
  wave2: {
    position: 'absolute',
    top: -4,
    left: -5,
    right: -5,
    height: 16,
    borderRadius: 8,
  },
  levelMark: {
    position: 'absolute',
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  markLine: {
    width: 8,
    height: 1,
    backgroundColor: colors.textMuted + '40',
    marginRight: 4,
  },
  markText: {
    ...typography.caption,
    fontSize: 9,
    color: colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.label,
    fontSize: 11,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
