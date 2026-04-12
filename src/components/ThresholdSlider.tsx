import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, borderRadius, spacing, shadows } from '../theme';
import { PumpThresholds } from '../types';

interface ThresholdSliderProps {
  thresholds: PumpThresholds;
  onUpdate: (thresholds: PumpThresholds) => void;
}

export function ThresholdSlider({ thresholds, onUpdate }: ThresholdSliderProps) {
  const [turnOnBelow, setTurnOnBelow] = useState(thresholds.turnOnBelow);
  const [turnOffAbove, setTurnOffAbove] = useState(thresholds.turnOffAbove);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    setTurnOnBelow(thresholds.turnOnBelow);
    setTurnOffAbove(thresholds.turnOffAbove);
    setHasChanged(false);
  }, [thresholds]);

  const handleTurnOnChange = (value: number) => {
    const rounded = Math.round(value);
    if (rounded < turnOffAbove - 5) {
      setTurnOnBelow(rounded);
      setHasChanged(true);
    }
  };

  const handleTurnOffChange = (value: number) => {
    const rounded = Math.round(value);
    if (rounded > turnOnBelow + 5) {
      setTurnOffAbove(rounded);
      setHasChanged(true);
    }
  };

  const handleSave = () => {
    onUpdate({ turnOnBelow, turnOffAbove });
    setHasChanged(false);
  };

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="options" size={18} color={colors.primary} />
          <Text style={styles.title}>Pump Thresholds</Text>
        </View>
      </View>

      {/* Visual range bar */}
      <View style={styles.rangeVisual}>
        <View style={styles.rangeTrack}>
          <View
            style={[
              styles.dangerZone,
              { width: `${turnOnBelow}%` },
            ]}
          />
          <View
            style={[
              styles.normalZone,
              { left: `${turnOnBelow}%`, width: `${turnOffAbove - turnOnBelow}%` },
            ]}
          />
          <View
            style={[
              styles.fullZone,
              { left: `${turnOffAbove}%`, width: `${100 - turnOffAbove}%` },
            ]}
          />
        </View>
        <View style={styles.rangeLabels}>
          <Text style={[styles.rangeLabel, { color: colors.danger }]}>LOW</Text>
          <Text style={[styles.rangeLabel, { color: colors.primary }]}>OK</Text>
          <Text style={[styles.rangeLabel, { color: colors.success }]}>FULL</Text>
        </View>
      </View>

      {/* Turn ON threshold */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <View style={styles.sliderLabelRow}>
            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
            <Text style={styles.sliderLabel}>Turn ON Below</Text>
          </View>
          <Text style={[styles.sliderValue, { color: colors.danger }]}>
            {turnOnBelow}%
          </Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={90}
          step={1}
          value={turnOnBelow}
          onValueChange={handleTurnOnChange}
          minimumTrackTintColor={colors.danger}
          maximumTrackTintColor={colors.textMuted + '20'}
          thumbTintColor={colors.danger}
        />
        <Text style={styles.sliderHint}>
          Pump starts when water drops below {turnOnBelow}%
        </Text>
      </View>

      {/* Turn OFF threshold */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <View style={styles.sliderLabelRow}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.sliderLabel}>Turn OFF Above</Text>
          </View>
          <Text style={[styles.sliderValue, { color: colors.success }]}>
            {turnOffAbove}%
          </Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={10}
          maximumValue={95}
          step={1}
          value={turnOffAbove}
          onValueChange={handleTurnOffChange}
          minimumTrackTintColor={colors.success}
          maximumTrackTintColor={colors.textMuted + '20'}
          thumbTintColor={colors.success}
        />
        <Text style={styles.sliderHint}>
          Pump stops when water reaches {turnOffAbove}%
        </Text>
      </View>

      {hasChanged && (
        <View style={styles.saveRow}>
          <Text style={styles.unsavedText}>Unsaved changes</Text>
          <View style={styles.saveButton}>
            <Text style={styles.saveButtonText} onPress={handleSave}>
              Save Thresholds
            </Text>
          </View>
        </View>
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
  rangeVisual: {
    marginBottom: spacing.xl,
  },
  rangeTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted + '15',
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  dangerZone: {
    height: '100%',
    backgroundColor: colors.danger + '40',
    position: 'absolute',
    left: 0,
  },
  normalZone: {
    height: '100%',
    backgroundColor: colors.primary + '40',
    position: 'absolute',
  },
  fullZone: {
    height: '100%',
    backgroundColor: colors.success + '40',
    position: 'absolute',
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  rangeLabel: {
    ...typography.label,
    fontSize: 9,
  },
  sliderSection: {
    marginBottom: spacing.lg,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sliderLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 14,
  },
  sliderValue: {
    ...typography.bodyBold,
    fontSize: 18,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderHint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: -4,
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  unsavedText: {
    ...typography.caption,
    color: colors.warning,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    ...typography.bodyBold,
    color: colors.white,
    fontSize: 13,
  },
});
