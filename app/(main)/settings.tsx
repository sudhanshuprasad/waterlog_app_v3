import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { useAuth } from '../../src/context/AuthContext';
import { AutoModeToggle } from '../../src/components/AutoModeToggle';
import { ThresholdSlider } from '../../src/components/ThresholdSlider';
import { WiFiConfigForm } from '../../src/components/WiFiConfigForm';
import { colors, gradients, typography, borderRadius, spacing, shadows } from '../../src/theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { settings, updateThresholds, updateWiFi, toggleAutoMode } = useWebSocket();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleWiFiSubmit = (ssid: string, password: string) => {
    updateWiFi({ ssid, password });
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
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Device Configuration</Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Account Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Account</Text>
            </View>
            <View style={[styles.accountCard, shadows.card]}>
              <View style={styles.avatarContainer}>
                {user?.profilePicture ? (
                  <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                  </View>
                )}
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
              </View>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>

            {/* Pump Automation Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pump Automation</Text>
            </View>

            <View style={styles.sectionContent}>
              <AutoModeToggle
                isEnabled={settings?.autoMode ?? false}
                onToggle={toggleAutoMode}
                thresholds={settings?.thresholds}
              />
            </View>

            {/* Threshold Configuration */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Water Level Thresholds</Text>
              <Text style={styles.sectionSubtitle}>
                Set when the pump should automatically start and stop
              </Text>
            </View>

            <View style={styles.sectionContent}>
              <ThresholdSlider
                thresholds={
                  settings?.thresholds ?? { turnOnBelow: 20, turnOffAbove: 80 }
                }
                onUpdate={updateThresholds}
              />
            </View>

            {/* WiFi Configuration */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Device WiFi</Text>
              <Text style={styles.sectionSubtitle}>
                Update the WiFi network for your IoT device
              </Text>
            </View>

            <View style={styles.sectionContent}>
              <WiFiConfigForm onSubmit={handleWiFiSubmit} />
            </View>

            {/* Device Info */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Device Info</Text>
            </View>
            <View style={[styles.infoCard, shadows.card]}>
              {[
                { label: 'Device ID', value: 'WL-001', icon: 'hardware-chip-outline' as const },
                { label: 'Firmware', value: 'v2.1.0', icon: 'code-outline' as const },
                { label: 'Last Seen', value: 'Just now', icon: 'time-outline' as const },
                { label: 'Signal', value: 'Strong', icon: 'cellular-outline' as const },
              ].map((item, index) => (
                <View
                  key={item.label}
                  style={[
                    styles.infoRow,
                    index < 3 && styles.infoRowBorder,
                  ]}
                >
                  <View style={styles.infoLeft}>
                    <Ionicons name={item.icon} size={16} color={colors.textMuted} />
                    <Text style={styles.infoLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* App version */}
            <Text style={styles.versionText}>WaterLog v1.0.0</Text>

            {/* Bottom padding */}
            <View style={{ height: spacing['4xl'] }} />
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },
  sectionHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 12,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    fontSize: 11,
  },
  sectionContent: {
    paddingHorizontal: spacing.lg,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    gap: spacing.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: 48,
    height: 48,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  userName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  userEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  signOutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing['2xl'],
  },
});
