import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { useDevices } from '../../src/context/DeviceContext';
import { WaterLevelGauge } from '../../src/components/WaterLevelGauge';
import { PumpStatusCard } from '../../src/components/PumpStatusCard';
import { PumpControlSwitch } from '../../src/components/PumpControlSwitch';
import { colors, gradients, typography, borderRadius, spacing, shadows } from '../../src/theme';

export default function DashboardScreen() {
  const { selectedDevice } = useDevices();
  const {
    waterLevel,
    pumpStatus,
    settings,
    isConnected,
    sendPumpCommand,
    refreshStatus,
  } = useWebSocket();

  const [refreshing, setRefreshing] = React.useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    refreshStatus();
    setTimeout(() => setRefreshing(false), 1500);
  };

  const formatTime = (date?: Date) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <LinearGradient
      colors={gradients.background as any}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{selectedDevice?.name || 'WaterLog'}</Text>
              <Text style={styles.subtitle}>{selectedDevice?.location || 'Dashboard'}</Text>
            </View>
            <View style={styles.connectionStatus}>
              <View
                style={[
                  styles.connectionDot,
                  {
                    backgroundColor: isConnected
                      ? colors.success
                      : colors.danger,
                  },
                ]}
              />
              <Text
                style={[
                  styles.connectionText,
                  { color: isConnected ? colors.success : colors.danger },
                ]}
              >
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {/* Water Level Gauge */}
            <View style={[styles.gaugeCard, shadows.card]}>
              <WaterLevelGauge level={waterLevel?.level ?? 0} />
              <View style={styles.lastUpdated}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={colors.textMuted}
                />
                <Text style={styles.lastUpdatedText}>
                  Last update: {formatTime(waterLevel?.timestamp)}
                </Text>
              </View>
            </View>

            {/* Pump Status */}
            <PumpStatusCard
              isRunning={pumpStatus?.isRunning ?? false}
              mode={pumpStatus?.mode ?? 'manual'}
              runtime={pumpStatus?.runtime}
            />

            {/* Pump Control */}
            <PumpControlSwitch
              isRunning={pumpStatus?.isRunning ?? false}
              autoMode={settings?.autoMode ?? false}
              onToggle={sendPumpCommand}
            />

            {/* Quick stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, shadows.card]}>
                <Ionicons name="speedometer-outline" size={20} color={colors.accent} />
                <Text style={styles.statValue}>
                  {waterLevel?.level?.toFixed(1) ?? '—'}%
                </Text>
                <Text style={styles.statLabel}>Current Level</Text>
              </View>
              <View style={[styles.statCard, shadows.card]}>
                <Ionicons
                  name="flash-outline"
                  size={20}
                  color={pumpStatus?.isRunning ? colors.success : colors.textMuted}
                />
                <Text style={styles.statValue}>
                  {pumpStatus?.isRunning ? 'Active' : 'Idle'}
                </Text>
                <Text style={styles.statLabel}>Pump State</Text>
              </View>
              <View style={[styles.statCard, shadows.card]}>
                <Ionicons
                  name="git-compare-outline"
                  size={20}
                  color={settings?.autoMode ? colors.accent : colors.textMuted}
                />
                <Text style={styles.statValue}>
                  {settings?.autoMode ? 'Auto' : 'Manual'}
                </Text>
                <Text style={styles.statLabel}>Mode</Text>
              </View>
            </View>

            {/* Bottom padding */}
            <View style={{ height: spacing['3xl'] }} />
          </ScrollView>
        </Animated.View>
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
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  greeting: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectionText: {
    ...typography.label,
    fontSize: 10,
  },
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },
  gaugeCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  lastUpdatedText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
});
