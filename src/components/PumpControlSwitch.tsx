import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, borderRadius, spacing, shadows } from '../theme';

interface PumpControlSwitchProps {
  isRunning: boolean;
  autoMode: boolean;
  onToggle: (action: 'start' | 'stop') => void;
}

export function PumpControlSwitch({
  isRunning,
  autoMode,
  onToggle,
}: PumpControlSwitchProps) {
  const slideAnim = useRef(new Animated.Value(isRunning ? 1 : 0)).current;
  const bgAnim = useRef(new Animated.Value(isRunning ? 1 : 0)).current;

  useEffect(() => {
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
    console.log('[PumpControlSwitch] handlePress called, isRunning:', isRunning, 'autoMode:', autoMode);
    if (autoMode) {
      console.log('[PumpControlSwitch] Blocked by autoMode');
      Alert.alert(
        'Auto Mode Active',
        'Disable auto mode from Settings to manually control the pump.',
        [{ text: 'OK' }]
      );
      return;
    }

    const action = isRunning ? 'stop' : 'start';
    console.log('[PumpControlSwitch] Will prompt for action:', action);
    Alert.alert(
      `${action === 'start' ? 'Start' : 'Stop'} Pump?`,
      `Are you sure you want to ${action} the water pump?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'start' ? 'Start' : 'Stop',
          style: action === 'stop' ? 'destructive' : 'default',
          onPress: () => {
            console.log('[PumpControlSwitch] User confirmed, calling onToggle with:', action);
            onToggle(action);
          },
        },
      ]
    );
  };

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
          <Ionicons name="power" size={18} color={colors.primary} />
          <Text style={styles.title}>Pump Control</Text>
        </View>
        {autoMode && (
          <View style={styles.autoBadge}>
            <Ionicons name="lock-closed" size={10} color={colors.warning} />
            <Text style={styles.autoText}>AUTO LOCKED</Text>
          </View>
        )}
      </View>

      <View style={styles.controlRow}>
        <Text style={[styles.label, { color: !isRunning ? colors.textPrimary : colors.textMuted }]}>
          OFF
        </Text>

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

        <Text style={[styles.label, { color: isRunning ? colors.success : colors.textMuted }]}>
          ON
        </Text>
      </View>

      <Text style={styles.hint}>
        {autoMode
          ? 'Switch to manual mode in Settings to control pump'
          : isRunning
          ? 'Tap switch to stop the pump'
          : 'Tap switch to start the pump'}
      </Text>
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
    marginBottom: spacing.xl,
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
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  autoText: {
    ...typography.label,
    fontSize: 9,
    color: colors.warning,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  label: {
    ...typography.bodyBold,
    fontSize: 14,
    letterSpacing: 1,
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
