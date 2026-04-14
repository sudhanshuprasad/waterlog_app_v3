import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../src/services/api';
import { useDevices } from '../../src/context/DeviceContext';
import { colors, typography, borderRadius, spacing, shadows } from '../../src/theme';

export default function EditDeviceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ deviceId: string; deviceToken: string; deviceName: string; deviceLocation: string }>();
  const { refreshDevices } = useDevices();

  const [name, setName] = useState(params.deviceName || '');
  const [location, setLocation] = useState(params.deviceLocation || '');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Device name is required');
      return;
    }

    setLoading(true);
    try {
      await apiService.updateDeviceSettings(params.deviceId, {
        name: name.trim(),
        location: location.trim() || undefined,
      });
      await refreshDevices();
      Alert.alert('Success', 'Device updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Could not update device');
    } finally {
      setLoading(false);
    }
  };

  const performDelete = async () => {
    console.log('[EditDevice] Delete confirmed, setting deleting=true');
    setDeleting(true);
    try {
      console.log('[EditDevice] Calling apiService.deleteDevice...');
      await apiService.deleteDevice(params.deviceId);
      console.log('[EditDevice] API call successful, calling refreshDevices...');
      await refreshDevices();
      console.log('[EditDevice] Refresh successful, showing success alert');
      if (Platform.OS === 'web') {
        window.alert('Device removed successfully');
        router.back();
      } else {
        Alert.alert('Deleted', 'Device removed successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.error('[EditDevice] Delete failed with error:', error);
      if (Platform.OS === 'web') {
        window.alert(error.message || 'Could not delete device');
      } else {
        Alert.alert('Delete Failed', error.message || 'Could not delete device');
      }
    } finally {
      console.log('[EditDevice] Setting deleting=false');
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    console.log('[EditDevice] handleDelete pressed for deviceId:', params.deviceId);
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete "${params.deviceName}"? This action cannot be undone.`);
      if (confirmed) {
        performDelete();
      } else {
        console.log('[EditDevice] Delete cancelled');
      }
      return;
    }

    Alert.alert(
      'Delete Device',
      `Are you sure you want to delete "${params.deviceName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => console.log('[EditDevice] Delete cancelled') },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: performDelete,
        },
      ]
    );
  };

  const isProcessing = loading || deleting;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Device</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Device Token / SL No (read-only) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Device SL No</Text>
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.inputDisabledText}>{params.deviceToken}</Text>
          </View>
        </View>

        {/* Database ID (read-only, hidden for cleaner UI but available if needed) */}
        {/*
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Internal ID</Text>
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.inputDisabledText}>{params.deviceId}</Text>
          </View>
        </View>
        */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Device Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Roof Tank"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            editable={!isProcessing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Main Building"
            placeholderTextColor={colors.textMuted}
            value={location}
            onChangeText={setLocation}
            editable={!isProcessing}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isProcessing && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isProcessing}
        >
          {loading ? (
            <ActivityIndicator color={colors.backgroundLight} />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Delete section */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.deleteButton, isProcessing && styles.buttonDisabled]}
            onPress={handleDelete}
            disabled={isProcessing}
          >
            {deleting ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                <Text style={styles.deleteButtonText}>Delete Device</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing['4xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  backButton: {
    padding: spacing.xs,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceBorder + '30',
  },
  inputDisabledText: {
    ...typography.body,
    color: colors.textMuted,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadows.card,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...typography.bodyBold,
    color: colors.backgroundLight,
  },
  dangerSection: {
    marginTop: spacing['3xl'],
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  dangerTitle: {
    ...typography.label,
    color: colors.danger,
    marginBottom: spacing.md,
    fontSize: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.danger + '40',
    backgroundColor: colors.dangerBg,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  deleteButtonText: {
    ...typography.bodyBold,
    color: colors.danger,
  },
});
