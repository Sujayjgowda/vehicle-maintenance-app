import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { addMonths, addYears, format } from 'date-fns';
import { remindersApi } from '../../api/resources';
import { vehiclesApi } from '../../api/vehicles';
import { confirmAction } from '../../utils/confirmAlert';
import Input from '../../components/Input';
import Button from '../../components/Button';
import DatePickerInput from '../../components/DatePickerInput';
import { colors, spacing, borderRadius, fontSize } from '../../theme/colors';

const REMINDER_TYPES = [
  { id: 'INSURANCE', label: 'Insurance', icon: 'shield-checkmark-outline' as const, defaultTitle: 'Insurance Renewal' },
  { id: 'PUC', label: 'PUC', icon: 'document-text-outline' as const, defaultTitle: 'PUC Certificate Renewal' },
  { id: 'SERVICE', label: 'Service', icon: 'build-outline' as const, defaultTitle: 'Periodic Maintenance Service' },
  { id: 'PART_REPLACEMENT', label: 'Part', icon: 'cog-outline' as const, defaultTitle: 'Part Replacement Due' },
];

export default function AddReminderScreen({ route, navigation }: any) {
  const existingRecord = route?.params?.record;
  const isEditing = Boolean(existingRecord);
  const initialVehicleId = route?.params?.vehicleId || existingRecord?.vehicleId;

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId || '');
  const [loadingVehicles, setLoadingVehicles] = useState(!initialVehicleId);

  const [type, setType] = useState(existingRecord?.type || 'INSURANCE');
  const [title, setTitle] = useState(existingRecord?.title || 'Insurance Renewal');
  const [dueKm, setDueKm] = useState(existingRecord?.dueKm ? String(existingRecord.dueKm) : '');
  const [dueDate, setDueDate] = useState<Date>(
    existingRecord?.dueDate ? new Date(existingRecord.dueDate) : addYears(new Date(), 1)
  );
  const [hasDueDate, setHasDueDate] = useState(
    existingRecord ? Boolean(existingRecord.dueDate) : true
  );
  const [hasDueKm, setHasDueKm] = useState(
    existingRecord ? Boolean(existingRecord.dueKm) : false
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Set header options
  useEffect(() => {
    const returnTo = route.params?.returnTo;
    if (isEditing) {
      navigation.setOptions({
        title: 'Edit Reminder',
        ...(returnTo ? {
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.navigate(returnTo)} style={{ paddingRight: 8 }}>
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        } : {}),
      });
    } else if (returnTo) {
      navigation.setOptions({
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.navigate(returnTo)} style={{ paddingRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        ),
      });
    }
  }, [isEditing, navigation, route.params?.returnTo]);

  // Load vehicles if not provided
  useEffect(() => {
    async function fetchVehicles() {
      try {
        const res = await vehiclesApi.getAll();
        setVehicles(res.data);
        if (!selectedVehicleId && res.data.length > 0) {
          setSelectedVehicleId(res.data[0].id);
        }
      } catch (e) {
        console.log('Error fetching vehicles', e);
      } finally {
        setLoadingVehicles(false);
      }
    }
    fetchVehicles();
  }, []);

  const handleSelectType = (item: typeof REMINDER_TYPES[0]) => {
    setType(item.id);
    if (!isEditing || !title) {
      setTitle(item.defaultTitle);
    }
    // Always enable due date for date-based types
    if (item.id === 'PUC') {
      setDueDate(addMonths(new Date(), 6));
      setHasDueDate(true);
    } else if (item.id === 'INSURANCE') {
      setDueDate(addYears(new Date(), 1));
      setHasDueDate(true);
    } else if (item.id === 'SERVICE') {
      setDueDate(addMonths(new Date(), 6));
      setHasDueDate(true);
      setHasDueKm(true);
    } else if (item.id === 'PART_REPLACEMENT') {
      setDueDate(addMonths(new Date(), 3));
      setHasDueDate(true);
    }
  };

  const handlePresetDate = (months: number) => {
    setDueDate(addMonths(new Date(), months));
    setHasDueDate(true);
  };

  const navigateBack = () => {
    if (route.params?.returnTo) {
      navigation.navigate(route.params.returnTo);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!selectedVehicleId) {
      Alert.alert('Error', 'Please select a vehicle.');
      return;
    }

    if (!hasDueDate && !hasDueKm) {
      Alert.alert('Error', 'Please enable at least a Due Date or Due KM.');
      return;
    }

    if (hasDueKm && (!dueKm || parseInt(dueKm, 10) <= 0)) {
      Alert.alert('Error', 'Please enter a valid Due KM reading.');
      return;
    }

    setLoading(true);
    try {
      // 1. Check duplicate reminders for this vehicle on the same date / type
      const existingRes = await remindersApi.getAll(selectedVehicleId).catch(() => ({ data: [] }));
      const allReminders: any[] = existingRes.data || [];

      const targetDateStr = hasDueDate ? dueDate.toISOString().slice(0, 10) : null;
      const targetKm = hasDueKm && dueKm ? parseInt(dueKm, 10) : null;

      const isDuplicate = allReminders.some((r) => {
        if (isEditing && r.id === existingRecord.id) return false;
        if (r.status === 'COMPLETED' || r.status === 'CANCELLED') return false;
        if (r.type !== type) return false;

        if (targetDateStr && r.dueDate) {
          const rDateStr = new Date(r.dueDate).toISOString().slice(0, 10);
          if (rDateStr === targetDateStr) return true;
        }

        if (targetKm && r.dueKm && r.dueKm === targetKm) {
          return true;
        }

        return false;
      });

      if (isDuplicate) {
        Alert.alert(
          'Duplicate Reminder Detected',
          `An active ${type.replace('_', ' ')} reminder is already scheduled for this ${targetDateStr ? `date (${targetDateStr})` : `mileage (${targetKm} KM)`}.`
        );
        setLoading(false);
        return;
      }

      // Build payload — only include fields that have values (avoid sending null to Zod validator)
      const payload: Record<string, any> = {
        type,
        status: 'PENDING',
      };

      if (title && title.trim()) {
        payload.title = title.trim();
      }

      if (hasDueDate) {
        payload.dueDate = dueDate.toISOString();
      }

      if (hasDueKm && dueKm) {
        payload.dueKm = parseInt(dueKm, 10);
      }

      if (isEditing) {
        // For update, we need to handle clearing fields explicitly
        const updatePayload: Record<string, any> = {
          type,
          title: title.trim() || undefined,
        };
        if (hasDueDate) {
          updatePayload.dueDate = dueDate.toISOString();
        }
        if (hasDueKm && dueKm) {
          updatePayload.dueKm = parseInt(dueKm, 10);
        }
        if (!isNaN(Number(updatePayload.dueKm)) === false) {
          delete updatePayload.dueKm;
        }
        await remindersApi.update(selectedVehicleId, existingRecord.id, updatePayload);
      } else {
        await remindersApi.create(selectedVehicleId, payload);
      }

      navigateBack();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data?.error || (isEditing ? 'Failed to update reminder' : 'Failed to save reminder');
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!existingRecord) return;
    confirmAction(
      'Delete Reminder',
      'Are you sure you want to remove this reminder?',
      async () => {
        setDeleting(true);
        try {
          await remindersApi.delete(selectedVehicleId, existingRecord.id);
          navigateBack();
        } catch (e: any) {
          Alert.alert('Error', e.response?.data?.message || 'Failed to delete reminder');
        } finally {
          setDeleting(false);
        }
      }
    );
  };

  if (loadingVehicles) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* 1. Vehicle Selector */}
          {vehicles.length > 1 ? (
            <View style={styles.section}>
              <Text style={styles.label}>SELECT VEHICLE *</Text>
              <View style={styles.chipsRow}>
                {vehicles.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.vehicleChip, selectedVehicleId === v.id && styles.vehicleChipActive]}
                    onPress={() => setSelectedVehicleId(v.id)}
                  >
                    <Ionicons
                      name="car-sport"
                      size={16}
                      color={selectedVehicleId === v.id ? colors.textOnPrimary : colors.primary}
                    />
                    <Text style={[styles.vehicleChipText, selectedVehicleId === v.id && styles.vehicleChipTextActive]}>
                      {v.make} {v.model} ({v.licensePlate})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {/* 2. Reminder Type */}
          <View style={styles.section}>
            <Text style={styles.label}>REMINDER TYPE *</Text>
            <View style={styles.chipsRow}>
              {REMINDER_TYPES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.typeChip, type === item.id && styles.typeChipActive]}
                  onPress={() => handleSelectType(item)}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={type === item.id ? colors.textOnPrimary : colors.primary}
                  />
                  <Text style={[styles.typeChipText, type === item.id && styles.typeChipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 3. Title */}
          <Input
            label="Reminder Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Insurance Renewal, 50,000 KM Service"
          />

          {/* 4. Trigger by Date */}
          <View style={styles.cardBox}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Remind by Due Date</Text>
                <Text style={styles.toggleSub}>Alert on or before specific calendar date</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, hasDueDate && styles.toggleBtnActive]}
                onPress={() => setHasDueDate(!hasDueDate)}
              >
                <Ionicons name={hasDueDate ? 'checkbox' : 'square-outline'} size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {hasDueDate ? (
              <View style={styles.dateSelectorArea}>
                {/* Calendar Date Picker */}
                <DatePickerInput
                  label="Due Date *"
                  value={dueDate}
                  onChange={setDueDate}
                  minDate={new Date()}
                  maxDate={addYears(new Date(), 10)}
                  helperText="Select the date when this reminder is due"
                />

                {/* Quick preset chips */}
                <Text style={styles.subLabel}>Quick Presets:</Text>
                <View style={styles.presetChips}>
                  <TouchableOpacity style={styles.presetChip} onPress={() => handlePresetDate(1)}>
                    <Text style={styles.presetChipText}>+1 Month</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.presetChip} onPress={() => handlePresetDate(3)}>
                    <Text style={styles.presetChipText}>+3 Months</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.presetChip} onPress={() => handlePresetDate(6)}>
                    <Text style={styles.presetChipText}>+6 Months</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.presetChip} onPress={() => handlePresetDate(12)}>
                    <Text style={styles.presetChipText}>+1 Year</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>

          {/* 5. Trigger by Odometer KM */}
          <View style={styles.cardBox}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Remind by Odometer (KM)</Text>
                <Text style={styles.toggleSub}>Alert when vehicle reaches specific mileage</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, hasDueKm && styles.toggleBtnActive]}
                onPress={() => setHasDueKm(!hasDueKm)}
              >
                <Ionicons name={hasDueKm ? 'checkbox' : 'square-outline'} size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {hasDueKm ? (
              <View style={{ marginTop: spacing.md }}>
                <Input
                  label="Target Odometer (KM) *"
                  value={dueKm}
                  onChangeText={setDueKm}
                  placeholder="e.g. 50000"
                  keyboardType="numeric"
                />
              </View>
            ) : null}
          </View>

          {/* 6. Submit Button */}
          <Button
            title={isEditing ? 'Update Reminder' : 'Save Reminder'}
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: spacing.lg }}
          />

          {isEditing && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              disabled={deleting}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error || '#EF4444'} />
              <Text style={styles.deleteText}>{deleting ? 'Deleting...' : 'Delete Reminder'}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingBottom: spacing.xxl * 2 },
  section: { marginBottom: spacing.lg },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  vehicleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  vehicleChipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '500' },
  vehicleChipTextActive: { color: colors.textOnPrimary, fontWeight: '600' },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  typeChipTextActive: { color: colors.textOnPrimary },
  cardBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  toggleSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  toggleBtn: { padding: spacing.xs },
  toggleBtnActive: {},
  dateSelectorArea: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  subLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.xs, fontWeight: '600', marginTop: spacing.sm },
  presetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textSecondary },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.lg,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.error || '#EF4444',
  },
});
