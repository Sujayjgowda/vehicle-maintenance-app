import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { servicesApi } from '../../api/resources';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors, spacing } from '../../theme/colors';

export default function AddServiceScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [serviceType, setServiceType] = useState('');
  const [serviceCenter, setServiceCenter] = useState('');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!serviceType || !odometer || !cost) { Alert.alert('Error', 'Please fill required fields'); return; }
    setLoading(true);
    try {
      await servicesApi.create(vehicleId, {
        date: new Date().toISOString(), serviceType, serviceCenter: serviceCenter || undefined,
        odometer: parseInt(odometer), cost: parseFloat(cost), notes: notes || undefined,
      });
      navigation.goBack();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Failed'); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Input label="Service Type *" value={serviceType} onChangeText={setServiceType} placeholder="e.g. Oil Change, Full Service" />
          <Input label="Service Center" value={serviceCenter} onChangeText={setServiceCenter} placeholder="e.g. Authorized Toyota" />
          <Input label="Odometer (KM) *" value={odometer} onChangeText={setOdometer} placeholder="e.g. 50000" keyboardType="numeric" />
          <Input label="Cost (₹) *" value={cost} onChangeText={setCost} placeholder="e.g. 5000" keyboardType="decimal-pad" />
          <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Any additional notes" multiline numberOfLines={3} />
          <Button title="Save Service Record" onPress={handleSubmit} loading={loading} style={{ marginTop: spacing.md }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingBottom: spacing.xxl * 2 },
});
