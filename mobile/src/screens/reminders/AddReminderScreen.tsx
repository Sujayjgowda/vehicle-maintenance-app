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
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors, spacing, borderRadius, fontSize } from '../../theme/colors';

const REMINDER_TYPES = [
  { id: 'INSURANCE', label: 'Insurance', icon: 'shield-checkmark-outline' as const, defaultTitle: 'Insurance Renewal' },
  { id: 'PUC', label: 'PUC', icon: 'document-text-outline' as const, defaultTitle: 'PUC Certificate Renewal' },
  { id: 'SERVICE', label: 'Service', icon: 'build-outline' as const, defaultTitle: 'Periodic Maintenance Service' },
  { id: 'PART_REPLACEMENT', label: 'Part', icon: 'cog-outline' as const, defaultTitle: 'Part Replacement Due' },
];

export default function AddReminderScreen({ route, navigation }: any) {
  const initialVehicleId = route?.params?.vehicleId;

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId || '');
  const [loadingVehicles, setLoadingVehicles] = useState(!initialVehicleId);

  const [type, setType] = useState('INSURANCE');
  const [title, setTitle] = useState('Insurance Renewal');
  const [dueKm, setDueKm] = useState('');
  const [dueDate, setDueDate] = useState<Date>(addYears(new Date(), 1));
  const [hasDueDate, setHasDueDate] = useState(true);
  const [hasDueKm, setHasDueKm] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setTitle(item.defaultTitle);
    if (item.id === 'PUC') {
      setDueDate(addMonths(new Date(), 6));
      setHasDueDate(true);
    } else if (item.id === 'INSURANCE') {
      setDueDate(addYears(new Date(), 1));
      setHasDueDate(true);
    } else if (item.id === 'SERVICE') {
      setDueDate(addMonths(new Date(), 6));
      setHasDueKm(true);
    }
  };

  const handlePresetDate = (months: number) => {
    setDueDate(addMonths(new Date(), months));
    setHasDueDate(true);
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

    if (hasDueKm && (!dueKm || parseInt(dueKm) <= 0)) {
      Alert.alert('Error', 'Please enter a valid Due KM reading.');
      return;
    }

    setLoading(true);
    try {
      await remindersApi.create(selectedVehicleId, {
        type,
        title: title.trim() || undefined,
        dueDate: hasDueDate ? dueDate.toISOString() : undefined,
        dueKm: hasDueKm && dueKm ? parseInt(dueKm) : undefined,
        status: 'PENDING',
      });
      Alert.alert('Success', 'Reminder saved successfully! 🎉', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save reminder');
    } finally {
      setLoading(false);
    }
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
                <Text style={styles.selectedDateBadge}>
                  📅 Due: {format(dueDate, 'EEEE, dd MMMM yyyy')}
                </Text>
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
            title="Save Reminder"
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: spacing.lg }}
          />
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
  selectedDateBadge: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  subLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.xs, fontWeight: '600' },
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
});
