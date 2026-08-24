import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { isAfter, startOfDay } from 'date-fns';
import { fuelApi } from '../../api/fuel';
import Input from '../../components/Input';
import Button from '../../components/Button';
import DatePickerInput from '../../components/DatePickerInput';
import { colors, spacing, borderRadius, fontSize } from '../../theme/colors';

// Standard benchmark market fuel rates in India (₹ / Unit)
const FUEL_TYPES = [
  { id: 'PETROL', label: 'Petrol', defaultRate: '102.86', icon: 'speedometer-outline' },
  { id: 'DIESEL', label: 'Diesel', defaultRate: '88.94', icon: 'water-outline' },
  { id: 'CNG', label: 'CNG', defaultRate: '79.50', icon: 'flame-outline' },
  { id: 'CUSTOM', label: 'Custom', defaultRate: '', icon: 'calculator-outline' },
];

export default function AddFuelScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;

  const [date, setDate] = useState<Date>(new Date());
  const [fuelType, setFuelType] = useState('PETROL');
  const [ratePerLiter, setRatePerLiter] = useState('102.86');
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [odometer, setOdometer] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Fuel Type Selection
  const handleSelectFuelType = (item: typeof FUEL_TYPES[0]) => {
    setFuelType(item.id);
    if (item.defaultRate) {
      setRatePerLiter(item.defaultRate);
      const rate = parseFloat(item.defaultRate);
      if (liters && rate > 0) {
        setCost((parseFloat(liters) * rate).toFixed(2));
      } else if (cost && rate > 0) {
        setLiters((parseFloat(cost) / rate).toFixed(2));
      }
    }
  };

  // When Liters changes, update Cost if Rate is present
  const handleLitersChange = (val: string) => {
    setLiters(val);
    const numLiters = parseFloat(val);
    const numRate = parseFloat(ratePerLiter);
    if (!isNaN(numLiters) && !isNaN(numRate) && numRate > 0) {
      setCost((numLiters * numRate).toFixed(2));
    }
  };

  // When Cost changes, update Liters if Rate is present
  const handleCostChange = (val: string) => {
    setCost(val);
    const numCost = parseFloat(val);
    const numRate = parseFloat(ratePerLiter);
    if (!isNaN(numCost) && !isNaN(numRate) && numRate > 0) {
      setLiters((numCost / numRate).toFixed(2));
    }
  };

  // When Rate changes, recalculate Cost based on Liters
  const handleRateChange = (val: string) => {
    setRatePerLiter(val);
    const numRate = parseFloat(val);
    const numLiters = parseFloat(liters);
    if (!isNaN(numRate) && !isNaN(numLiters) && numRate > 0) {
      setCost((numLiters * numRate).toFixed(2));
    }
  };

  // Calculated effective rate (₹/L)
  const computedRate =
    parseFloat(cost) > 0 && parseFloat(liters) > 0
      ? (parseFloat(cost) / parseFloat(liters)).toFixed(2)
      : ratePerLiter || '—';

  const handleSubmit = async () => {
    // Validate Future Date
    if (isAfter(startOfDay(date), startOfDay(new Date()))) {
      Alert.alert('Invalid Date', 'Transaction date cannot be in the future.');
      return;
    }

    if (!liters || !cost || !odometer) {
      Alert.alert('Error', 'Please fill in fuel quantity, cost, and odometer reading.');
      return;
    }

    const parsedLiters = parseFloat(liters);
    const parsedCost = parseFloat(cost);
    const parsedOdometer = parseInt(odometer);

    if (isNaN(parsedLiters) || parsedLiters <= 0) {
      Alert.alert('Error', 'Please enter a valid fuel quantity in liters.');
      return;
    }

    if (isNaN(parsedCost) || parsedCost <= 0) {
      Alert.alert('Error', 'Please enter a valid total cost.');
      return;
    }

    if (isNaN(parsedOdometer) || parsedOdometer < 0) {
      Alert.alert('Error', 'Please enter a valid odometer reading.');
      return;
    }

    setLoading(true);
    try {
      await fuelApi.create(vehicleId, {
        date: date.toISOString(),
        liters: parsedLiters,
        cost: parsedCost,
        odometerReading: parsedOdometer,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to add fuel record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* 1. Transaction Date Picker */}
          <DatePickerInput
            label="Fuel Transaction Date *"
            value={date}
            onChange={setDate}
            maxDate={new Date()}
            helperText="Default is today. Future dates are restricted."
          />

          {/* 2. Fuel Type Selector & Benchmark Price */}
          <Text style={styles.sectionLabel}>FUEL TYPE & BENCHMARK PRICE</Text>
          <View style={styles.fuelChips}>
            {FUEL_TYPES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.fuelChip, fuelType === item.id && styles.fuelChipActive]}
                onPress={() => handleSelectFuelType(item)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={16}
                  color={fuelType === item.id ? colors.textOnPrimary : colors.primary}
                />
                <Text style={[styles.fuelChipText, fuelType === item.id && styles.fuelChipTextActive]}>
                  {item.label}
                </Text>
                {item.defaultRate ? (
                  <Text style={[styles.chipRate, fuelType === item.id && styles.chipRateActive]}>
                    ₹{item.defaultRate}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

          {/* 3. Fuel Rate / Price Per Liter */}
          <Input
            label="Price per Liter / Unit (₹/L)"
            value={ratePerLiter}
            onChangeText={handleRateChange}
            placeholder="e.g. 102.86"
            keyboardType="decimal-pad"
          />

          {/* 4. Fuel Quantity and Cost with Auto-Calculation Badge */}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Input
                label="Fuel Quantity (L) *"
                value={liters}
                onChangeText={handleLitersChange}
                placeholder="e.g. 35"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Input
                label="Total Cost (₹) *"
                value={cost}
                onChangeText={handleCostChange}
                placeholder="e.g. 3600"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Live Price Calculation Summary Banner */}
          {parseFloat(liters) > 0 && parseFloat(cost) > 0 ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Effective Rate</Text>
                <Text style={styles.summaryValue}>₹{computedRate}/L</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Filled</Text>
                <Text style={styles.summaryValue}>{liters} Liters</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>₹{cost}</Text>
              </View>
            </View>
          ) : null}

          {/* 5. Odometer Reading */}
          <Input
            label="Odometer Reading (KM) *"
            value={odometer}
            onChangeText={setOdometer}
            placeholder="e.g. 45000"
            keyboardType="numeric"
          />

          <Button
            title="Save Fuel Record"
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
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fuelChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fuelChip: {
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
  fuelChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  fuelChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
  },
  fuelChipTextActive: {
    color: colors.textOnPrimary,
  },
  chipRate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  chipRateActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
  },
});
