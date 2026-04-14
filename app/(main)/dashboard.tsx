import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  const router = useRouter();
  const { devices, selectedDevice, selectDevice, refreshDevices } = useDevices();
  const [deviceSelectorVisible, setDeviceSelectorVisible] = React.useState(false);
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
    await Promise.all([
      refreshStatus(),
      refreshDevices(),
    ]);
    setTimeout(() => setRefreshing(false), 500);
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
            <TouchableOpacity onPress={() => {
              setDeviceSelectorVisible(true);
              refreshDevices();
            }} style={styles.deviceSelectorButton}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.greeting}>{selectedDevice?.name || 'WaterLog'}</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
                </View>
                <Text style={styles.subtitle}>{selectedDevice?.location || 'Dashboard'}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.headerRight}>
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
              <TouchableOpacity onPress={() => router.push('/register-device')} style={styles.addButton}>
                <Ionicons name="add" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
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

        {/* Device Selector Modal */}
        <Modal visible={deviceSelectorVisible} transparent animationType="slide">
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setDeviceSelectorVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Device</Text>
                <TouchableOpacity onPress={() => setDeviceSelectorVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {devices.map(device => (
                  <TouchableOpacity 
                    key={device.id} 
                    style={[
                      styles.deviceOption, 
                      selectedDevice?.id === device.id && styles.deviceOptionSelected
                    ]}
                    onPress={() => {
                      selectDevice(device.id);
                      setDeviceSelectorVisible(false);
                    }}
                  >
                    <View style={styles.deviceOptionInfo}>
                      <Text style={[
                        styles.deviceOptionName,
                        selectedDevice?.id === device.id && styles.deviceOptionNameSelected
                      ]}>{device.name}</Text>
                      {device.location ? (
                        <Text style={styles.deviceOptionLocation}>{device.location}</Text>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {selectedDevice?.id === device.id && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                      <TouchableOpacity
                        onPress={(e) => {
                          setDeviceSelectorVisible(false);
                          router.push({
                            pathname: '/edit-device',
                            params: {
                              deviceId: device.id,
                              deviceName: device.name,
                              deviceLocation: device.location || ''
                            }
                          });
                        }}
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
                {devices.length === 0 && (
                  <Text style={styles.noDevicesText}>No devices found.</Text>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

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
  deviceSelectorButton: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    padding: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
    paddingBottom: spacing['4xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  deviceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    marginBottom: spacing.sm,
  },
  deviceOptionSelected: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    borderBottomWidth: 0,
  },
  deviceOptionInfo: {
    flex: 1,
  },
  deviceOptionName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  deviceOptionNameSelected: {
    color: colors.primary,
  },
  deviceOptionLocation: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noDevicesText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
