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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAfter, startOfDay } from 'date-fns';
import { expensesApi } from '../../api/resources';
import Input from '../../components/Input';
import Button from '../../components/Button';
import DatePickerInput from '../../components/DatePickerInput';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

const categories = ['FUEL', 'SERVICE', 'REPAIR', 'INSURANCE', 'TOLL', 'PARKING', 'OTHER'];

export default function AddExpenseScreen({ route, navigation }: any) {
  const { vehicleId, record } = route.params || {};
  const isEditing = Boolean(record);

  const [date, setDate] = useState<Date>(record ? new Date(record.date) : new Date());
  const [category, setCategory] = useState(record ? record.category : 'FUEL');
  const [amount, setAmount] = useState(record ? String(record.amount) : '');
  const [notes, setNotes] = useState(record?.notes || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Expense' : 'Add Expense',
    });
  }, [isEditing, navigation]);

  const handleSubmit = async () => {
    if (isAfter(startOfDay(date), startOfDay(new Date()))) {
      Alert.alert('Invalid Date', 'Expense date cannot be in the future.');
      return;
    }

    if (!amount) {
      Alert.alert('Error', 'Please enter an expense amount.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await expensesApi.update(vehicleId, record.id, {
          category,
          amount: parsedAmount,
          date: date.toISOString(),
          notes: notes || undefined,
        });
        Alert.alert('Success', 'Expense updated successfully! 💰', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await expensesApi.create(vehicleId, {
          category,
          amount: parsedAmount,
          date: date.toISOString(),
          notes: notes || undefined,
        });
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <DatePickerInput
            label="Expense Date *"
            value={date}
            onChange={setDate}
            maxDate={new Date()}
            helperText="Default is today. Future dates are restricted."
          />

          <Text style={styles.label}>CATEGORY *</Text>
          <View style={styles.chips}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, category === c && styles.chipActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Amount (₹) *"
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 500"
            keyboardType="decimal-pad"
          />
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Highway toll, Monthly parking, Car wash"
            multiline
            numberOfLines={2}
          />
          <Button
            title={isEditing ? 'Update Expense' : 'Save Expense'}
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
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
});
