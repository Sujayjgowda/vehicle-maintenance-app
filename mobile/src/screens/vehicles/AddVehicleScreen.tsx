import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, View, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { vehiclesApi } from '../../api/vehicles';
import { confirmAction } from '../../utils/confirmAlert';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors, spacing, borderRadius, fontSize } from '../../theme/colors';

export default function AddVehicleScreen({ route, navigation }: any) {
  const existingVehicle = route?.params?.vehicle;
  const isEditing = !!existingVehicle;

  const [make, setMake] = useState(existingVehicle?.make || '');
  const [model, setModel] = useState(existingVehicle?.model || '');
  const [year, setYear] = useState(existingVehicle?.year ? String(existingVehicle.year) : '');
  const [plate, setPlate] = useState(existingVehicle?.licensePlate || '');
  const [fuelType, setFuelType] = useState(existingVehicle?.fuelType || 'PETROL');
  const [odometer, setOdometer] = useState(
    existingVehicle?.currentOdometer !== undefined && existingVehicle?.currentOdometer !== null
      ? String(existingVehicle.currentOdometer)
      : ''
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleBack = () => {
    if (route?.params?.returnTo) {
      navigation.navigate(route.params.returnTo);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('VehicleList');
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Vehicle' : 'Add Vehicle',
      headerLeft: () => (
        <TouchableOpacity onPress={handleBack} style={{ marginRight: spacing.md, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditing, route?.params?.returnTo]);

  const handleSubmit = async () => {
    if (!make || !model || !year || !plate) {
      Alert.alert('Error', 'Please fill in all required fields (*)');
      return;
    }
    setLoading(true);
    try {
      const cleanPlate = plate.trim().toUpperCase();

      // Check for duplicate vehicle with same license plate
      const existingRes = await vehiclesApi.getAll().catch(() => ({ data: [] }));
      const allVehicles: any[] = existingRes.data || [];
      const isDuplicate = allVehicles.some((v) => {
        if (isEditing && v.id === existingVehicle.id) return false;
        return v.licensePlate?.trim().toUpperCase() === cleanPlate;
      });

      if (isDuplicate) {
        Alert.alert(
          'Duplicate Vehicle Detected',
          `A vehicle with license plate "${cleanPlate}" is already registered in your garage.`
        );
        setLoading(false);
        return;
      }

      const payload: any = {
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year, 10),
        licensePlate: cleanPlate,
        fuelType: fuelType || 'PETROL',
      };
      if (odometer && !isNaN(parseFloat(odometer))) {
        payload.currentOdometer = Math.round(parseFloat(odometer));
      }

      if (isEditing) {
        await vehiclesApi.update(existingVehicle.id, payload);
      } else {
        await vehiclesApi.create(payload);
      }
      handleBack();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || (isEditing ? 'Failed to update vehicle' : 'Failed to add vehicle'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!existingVehicle) return;
    confirmAction(
      'Delete Vehicle',
      `Are you sure you want to delete ${existingVehicle.make} ${existingVehicle.model}? All associated records (fuel, expenses, services) will be permanently deleted.`,
      async () => {
        setDeleting(true);
        try {
          await vehiclesApi.delete(existingVehicle.id);
          navigation.navigate('VehicleList');
        } catch (e: any) {
          Alert.alert('Error', e.response?.data?.message || 'Failed to delete vehicle');
        } finally {
          setDeleting(false);
        }
      }
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Input label="Make *" value={make} onChangeText={setMake} placeholder="e.g. Toyota" />
          <Input label="Model *" value={model} onChangeText={setModel} placeholder="e.g. Innova" />
          <Input label="Year *" value={year} onChangeText={setYear} placeholder="e.g. 2022" keyboardType="numeric" />
          <Input label="License Plate *" value={plate} onChangeText={setPlate} placeholder="e.g. KA-01-AB-1234" autoCapitalize="characters" />
          
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Fuel Type *</Text>
            <View style={styles.fuelOptionsRow}>
              {[
                { id: 'PETROL', label: 'Petrol', icon: 'flame', color: '#F97316' },
                { id: 'DIESEL', label: 'Diesel', icon: 'water', color: '#0EA5E9' },
                { id: 'CNG', label: 'CNG', icon: 'leaf', color: '#10B981' },
                { id: 'ELECTRIC', label: 'Electric', icon: 'flash', color: '#8B5CF6' },
              ].map((opt) => {
                const isSelected = (fuelType || 'PETROL').toUpperCase() === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.fuelChip,
                      isSelected && { backgroundColor: opt.color + '18', borderColor: opt.color, borderWidth: 1.5 },
                    ]}
                    onPress={() => setFuelType(opt.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={16}
                      color={isSelected ? opt.color : colors.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.fuelChipText,
                        isSelected && { color: opt.color, fontWeight: '700' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Input label="Current Odometer (KM)" value={odometer} onChangeText={setOdometer} placeholder="e.g. 15000" keyboardType="numeric" />
          
          <Button
            title={isEditing ? 'Update Vehicle' : 'Add Vehicle'}
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: spacing.md }}
          />

          {isEditing && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              disabled={deleting}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error || '#EF4444'} />
              <Text style={styles.deleteText}>{deleting ? 'Deleting...' : 'Delete Vehicle'}</Text>
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
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fuelOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  fuelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fuelChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.xl,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteText: {
    color: colors.error || '#EF4444',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
