import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAfter, startOfDay } from 'date-fns';
import { repairsApi } from '../../api/resources';
import Input from '../../components/Input';
import Button from '../../components/Button';
import DatePickerInput from '../../components/DatePickerInput';
import { colors, spacing } from '../../theme/colors';

export default function AddRepairScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;

  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [cause, setCause] = useState('');
  const [location, setLocation] = useState('');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (isAfter(startOfDay(date), startOfDay(new Date()))) {
      Alert.alert('Invalid Date', 'Repair date cannot be in the future.');
      return;
    }

    if (!description || !odometer || !cost) {
      Alert.alert('Error', 'Please fill in description, odometer, and repair cost.');
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
      await repairsApi.create(vehicleId, {
        date: date.toISOString(),
        description,
        odometer: parsedOdometer,
        cost: parsedCost,
        cause: cause || undefined,
        location: location || undefined,
        notes: notes || undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save repair log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <DatePickerInput
            label="Repair / Breakdown Date *"
            value={date}
            onChange={setDate}
            maxDate={new Date()}
            helperText="Default is today. Future dates are restricted."
          />
          <Input
            label="Description *"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Battery replaced, Flat Tyre repair, Alternator fix"
          />
          <Input
            label="Cause / Reason"
            value={cause}
            onChangeText={setCause}
            placeholder="e.g. Battery drained overnight, Nail in tyre"
          />
          <Input
            label="Location / Workshop"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Highway NH-48, Local mechanic"
          />
          <Input
            label="Odometer (KM) *"
            value={odometer}
            onChangeText={setOdometer}
            placeholder="e.g. 52000"
            keyboardType="numeric"
          />
          <Input
            label="Cost (₹) *"
            value={cost}
            onChangeText={setCost}
            placeholder="e.g. 3500"
            keyboardType="decimal-pad"
          />
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes"
            multiline
            numberOfLines={2}
          />
          <Button
            title="Save Repair Log"
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
