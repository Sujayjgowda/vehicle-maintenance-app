import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fuelApi } from '../../api/fuel';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors, spacing } from '../../theme/colors';

export default function AddFuelScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [odometer, setOdometer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!liters || !cost || !odometer) { Alert.alert('Error', 'Please fill all fields'); return; }
    setLoading(true);
    try {
      await fuelApi.create(vehicleId, {
        date: new Date().toISOString(), liters: parseFloat(liters),
        cost: parseFloat(cost), odometerReading: parseInt(odometer),
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to add record');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Input label="Fuel Quantity (Liters)" value={liters} onChangeText={setLiters} placeholder="e.g. 40" keyboardType="decimal-pad" />
          <Input label="Total Cost (₹)" value={cost} onChangeText={setCost} placeholder="e.g. 4000" keyboardType="decimal-pad" />
          <Input label="Odometer Reading (KM)" value={odometer} onChangeText={setOdometer} placeholder="e.g. 45000" keyboardType="numeric" />
          <Button title="Save Fuel Record" onPress={handleSubmit} loading={loading} style={{ marginTop: spacing.md }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingBottom: spacing.xxl * 2 },
});
