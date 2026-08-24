import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vehiclesApi } from '../../api/vehicles';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors, spacing, fontSize } from '../../theme/colors';

export default function AddVehicleScreen({ navigation }: any) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [odometer, setOdometer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!make || !model || !year || !plate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await vehiclesApi.create({
        make, model, year: parseInt(year), licensePlate: plate.toUpperCase(),
        currentOdometer: odometer ? parseInt(odometer) : 0,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Input label="Make *" value={make} onChangeText={setMake} placeholder="e.g. Toyota" />
          <Input label="Model *" value={model} onChangeText={setModel} placeholder="e.g. Innova" />
          <Input label="Year *" value={year} onChangeText={setYear} placeholder="e.g. 2022" keyboardType="numeric" />
          <Input label="License Plate *" value={plate} onChangeText={setPlate} placeholder="e.g. KA-01-AB-1234" autoCapitalize="characters" />
          <Input label="Current Odometer (KM)" value={odometer} onChangeText={setOdometer} placeholder="e.g. 15000" keyboardType="numeric" />
          <Button title="Add Vehicle" onPress={handleSubmit} loading={loading} style={{ marginTop: spacing.md }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingBottom: spacing.xxl * 2 },
});
