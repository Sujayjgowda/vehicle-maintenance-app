import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { repairsApi } from '../../api/resources';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors, spacing } from '../../theme/colors';

export default function AddRepairScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [description, setDescription] = useState('');
  const [cause, setCause] = useState('');
  const [location, setLocation] = useState('');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description || !odometer || !cost) { Alert.alert('Error', 'Fill required fields'); return; }
    setLoading(true);
    try {
      await repairsApi.create(vehicleId, {
        date: new Date().toISOString(), description, odometer: parseInt(odometer),
        cost: parseFloat(cost), cause: cause || undefined, location: location || undefined, notes: notes || undefined,
      });
      navigation.goBack();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Failed'); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Input label="Description *" value={description} onChangeText={setDescription} placeholder="e.g. Battery replaced" />
          <Input label="Cause" value={cause} onChangeText={setCause} placeholder="e.g. Battery drained" />
          <Input label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Highway NH-48" />
          <Input label="Odometer (KM) *" value={odometer} onChangeText={setOdometer} placeholder="e.g. 52000" keyboardType="numeric" />
          <Input label="Cost (₹) *" value={cost} onChangeText={setCost} placeholder="e.g. 8000" keyboardType="decimal-pad" />
          <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Additional notes" multiline />
          <Button title="Save Repair Log" onPress={handleSubmit} loading={loading} style={{ marginTop: spacing.md }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingBottom: spacing.xxl * 2 },
});
