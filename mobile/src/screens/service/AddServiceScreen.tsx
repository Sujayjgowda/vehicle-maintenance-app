import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAfter, startOfDay } from 'date-fns';
import { servicesApi } from '../../api/resources';
import Input from '../../components/Input';
import Button from '../../components/Button';
import DatePickerInput from '../../components/DatePickerInput';
import { colors, spacing } from '../../theme/colors';

export default function AddServiceScreen({ route, navigation }: any) {
  const { vehicleId, record } = route.params || {};
  const isEditing = Boolean(record);

  const [date, setDate] = useState<Date>(record ? new Date(record.date) : new Date());
  const [serviceType, setServiceType] = useState(record ? record.serviceType : '');
  const [serviceCenter, setServiceCenter] = useState(record?.serviceCenter || '');
  const [odometer, setOdometer] = useState(record ? String(record.odometer) : '');
  const [cost, setCost] = useState(record ? String(record.cost) : '');
  const [notes, setNotes] = useState(record?.notes || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Service Record' : 'Add Service',
    });
  }, [isEditing, navigation]);

  const handleSubmit = async () => {
    if (isAfter(startOfDay(date), startOfDay(new Date()))) {
      Alert.alert('Invalid Date', 'Service date cannot be in the future.');
      return;
    }

    if (!serviceType || !odometer || !cost) {
      Alert.alert('Error', 'Please fill in service type, odometer reading, and cost.');
      return;
    }

    const parsedOdometer = parseInt(odometer);
    const parsedCost = parseFloat(cost);

    if (isNaN(parsedOdometer) || parsedOdometer < 0) {
      Alert.alert('Error', 'Please enter a valid odometer reading.');
      return;
    }

    if (isNaN(parsedCost) || parsedCost < 0) {
      Alert.alert('Error', 'Please enter a valid cost.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await servicesApi.update(vehicleId, record.id, {
          date: date.toISOString(),
          serviceType,
          serviceCenter: serviceCenter || undefined,
          odometer: parsedOdometer,
          cost: parsedCost,
          notes: notes || undefined,
        });
        Alert.alert('Success', 'Service record updated successfully! 🔧', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await servicesApi.create(vehicleId, {
          date: date.toISOString(),
          serviceType,
          serviceCenter: serviceCenter || undefined,
          odometer: parsedOdometer,
          cost: parsedCost,
          notes: notes || undefined,
        });
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save service record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <DatePickerInput
            label="Service Date *"
            value={date}
            onChange={setDate}
            maxDate={new Date()}
            helperText="Default is today. Future dates are restricted."
          />
          <Input
            label="Service Type *"
            value={serviceType}
            onChangeText={setServiceType}
            placeholder="e.g. Oil Change, Periodic 40k Service, Brake Service"
          />
          <Input
            label="Service Center / Garage"
            value={serviceCenter}
            onChangeText={setServiceCenter}
            placeholder="e.g. Authorized Service Center, Bosch Auto"
          />
          <Input
            label="Odometer (KM) *"
            value={odometer}
            onChangeText={setOdometer}
            placeholder="e.g. 50000"
            keyboardType="numeric"
          />
          <Input
            label="Cost (₹) *"
            value={cost}
            onChangeText={setCost}
            placeholder="e.g. 4500"
            keyboardType="decimal-pad"
          />
          <Input
            label="Notes / Replaced Items"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional details or parts replaced"
            multiline
            numberOfLines={3}
          />
          <Button
            title={isEditing ? 'Update Service Record' : 'Save Service Record'}
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingBottom: spacing.xxl * 2 },
});
