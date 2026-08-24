import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAfter, startOfDay } from 'date-fns';
import { partsApi } from '../../api/resources';
import Input from '../../components/Input';
import Button from '../../components/Button';
import DatePickerInput from '../../components/DatePickerInput';
import { colors, spacing } from '../../theme/colors';

export default function AddPartScreen({ route, navigation }: any) {
  const { vehicleId, record } = route.params || {};
  const isEditing = Boolean(record);

  const [installDate, setInstallDate] = useState<Date>(record ? new Date(record.installDate) : new Date());
  const [name, setName] = useState(record ? record.componentName : '');
  const [odometer, setOdometer] = useState(record ? String(record.installOdometer) : '');
  const [intervalKm, setIntervalKm] = useState(record?.replacementIntervalKm ? String(record.replacementIntervalKm) : '');
  const [intervalMonths, setIntervalMonths] = useState(record?.replacementIntervalMonths ? String(record.replacementIntervalMonths) : '');
  const [cost, setCost] = useState(record?.cost ? String(record.cost) : '');
  const [notes, setNotes] = useState(record?.notes || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Part Record' : 'Add Part',
    });
  }, [isEditing, navigation]);

  const handleSubmit = async () => {
    if (isAfter(startOfDay(installDate), startOfDay(new Date()))) {
      Alert.alert('Invalid Date', 'Installation date cannot be in the future.');
      return;
    }

    if (!name || !odometer) {
      Alert.alert('Error', 'Component name and odometer reading are required.');
      return;
    }

    const parsedOdometer = parseInt(odometer);
    if (isNaN(parsedOdometer) || parsedOdometer < 0) {
      Alert.alert('Error', 'Please enter a valid odometer reading.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await partsApi.update(vehicleId, record.id, {
          componentName: name,
          installDate: installDate.toISOString(),
          installOdometer: parsedOdometer,
          replacementIntervalKm: intervalKm ? parseInt(intervalKm) : undefined,
          replacementIntervalMonths: intervalMonths ? parseInt(intervalMonths) : undefined,
          cost: cost ? parseFloat(cost) : undefined,
          notes: notes || undefined,
        });
        Alert.alert('Success', 'Part record updated successfully! ⚙️', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await partsApi.create(vehicleId, {
          componentName: name,
          installDate: installDate.toISOString(),
          installOdometer: parsedOdometer,
          replacementIntervalKm: intervalKm ? parseInt(intervalKm) : undefined,
          replacementIntervalMonths: intervalMonths ? parseInt(intervalMonths) : undefined,
          cost: cost ? parseFloat(cost) : undefined,
          notes: notes || undefined,
        });
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save part record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <DatePickerInput
            label="Installation Date *"
            value={installDate}
            onChange={setInstallDate}
            maxDate={new Date()}
            helperText="Default is today. Future dates are restricted."
          />
          <Input
            label="Component Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Engine Oil, Front Brake Pads, Spark Plugs"
          />
          <Input
            label="Install Odometer (KM) *"
            value={odometer}
            onChangeText={setOdometer}
            placeholder="e.g. 45000"
            keyboardType="numeric"
          />
          <Input
            label="Replacement Interval (KM)"
            value={intervalKm}
            onChangeText={setIntervalKm}
            placeholder="e.g. 10000"
            keyboardType="numeric"
          />
          <Input
            label="Replacement Interval (Months)"
            value={intervalMonths}
            onChangeText={setIntervalMonths}
            placeholder="e.g. 12"
            keyboardType="numeric"
          />
          <Input
            label="Cost (₹)"
            value={cost}
            onChangeText={setCost}
            placeholder="e.g. 2500"
            keyboardType="decimal-pad"
          />
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Brand, warranty, or mechanic details"
            multiline
            numberOfLines={2}
          />
          <Button
            title={isEditing ? 'Update Part Record' : 'Save Part Record'}
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
