import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { isAfter, startOfDay } from 'date-fns';
import { fuelApi } from '../../api/fuel';
import Input from '../../components/Input';
import Button from '../../components/Button';
import DatePickerInput from '../../components/DatePickerInput';
import { colors, spacing, borderRadius, fontSize } from '../../theme/colors';

const POPULAR_CITIES = [
  'Bengaluru',
  'Delhi',
  'Mumbai',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Mysore',
  'Mangalore',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Kochi',
];

export default function AddFuelScreen({ route, navigation }: any) {
  const { vehicleId, record } = route.params || {};
  const isEditing = Boolean(record);

  const [date, setDate] = useState<Date>(record ? new Date(record.date) : new Date());
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [livePrices, setLivePrices] = useState<any>(null);
  const [fetchingPrices, setFetchingPrices] = useState(false);

  // City Search Modal State
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [allCities, setAllCities] = useState<Array<{ name: string; value: string }>>([]);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  const [fuelType, setFuelType] = useState('PETROL');
  const [ratePerLiter, setRatePerLiter] = useState(
    record && record.liters > 0 ? (record.cost / record.liters).toFixed(2) : '102.86'
  );
  const [liters, setLiters] = useState(record ? String(record.liters) : '');
  const [cost, setCost] = useState(record ? String(record.cost) : '');
  const [odometer, setOdometer] = useState(record ? String(record.odometerReading) : '');
  const [loading, setLoading] = useState(false);

  // Set navigation header title dynamically
  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Fuel Record' : 'Add Fuel Record',
    });
  }, [isEditing, navigation]);

  // Load all available cities for modal
  useEffect(() => {
    fuelApi.getCities().then((res) => {
      if (Array.isArray(res.data)) {
        setAllCities(res.data);
      }
    }).catch((e) => console.log('Error loading cities:', e));
  }, []);

  // Fetch real-time live daily fuel rates from fuel.indianapi.in
  const fetchLivePrices = useCallback(async (city: string) => {
    setFetchingPrices(true);
    try {
      const res = await fuelApi.getLivePrices(city);
      if (res.data?.selectedCity) {
        setLivePrices(res.data.selectedCity);
        // Auto-update rate for newly selected city
        if (fuelType === 'PETROL' && res.data.selectedCity.petrol) {
          const pRate = res.data.selectedCity.petrol.toFixed(2);
          setRatePerLiter(pRate);
          if (liters && parseFloat(liters) > 0) {
            setCost((parseFloat(liters) * parseFloat(pRate)).toFixed(2));
          }
        } else if (fuelType === 'DIESEL' && res.data.selectedCity.diesel) {
          const dRate = res.data.selectedCity.diesel.toFixed(2);
          setRatePerLiter(dRate);
          if (liters && parseFloat(liters) > 0) {
            setCost((parseFloat(liters) * parseFloat(dRate)).toFixed(2));
          }
        }
      }
    } catch (e) {
      console.log('Error fetching live fuel prices:', e);
    } finally {
      setFetchingPrices(false);
    }
  }, [fuelType, liters]);

  useEffect(() => {
    fetchLivePrices(selectedCity);
  }, [selectedCity, fetchLivePrices]);

  // Select fuel type from Live Cards
  const handleSelectLiveRate = (type: string, rate: number) => {
    setFuelType(type);
    const rateStr = rate.toFixed(2);
    setRatePerLiter(rateStr);

    if (liters && rate > 0) {
      setCost((parseFloat(liters) * rate).toFixed(2));
    } else if (cost && rate > 0) {
      setLiters((parseFloat(cost) / rate).toFixed(2));
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

  const filteredCities = allCities.filter((c) =>
    c.name.toLowerCase().includes(citySearchQuery.toLowerCase())
  );

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
      if (isEditing) {
        await fuelApi.update(vehicleId, record.id, {
          date: date.toISOString(),
          liters: parsedLiters,
          cost: parsedCost,
          odometerReading: parsedOdometer,
        });
        Alert.alert('Success', 'Fuel record updated & synced to Expenses! ⛽', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await fuelApi.create(vehicleId, {
          date: date.toISOString(),
          liters: parsedLiters,
          cost: parsedCost,
          odometerReading: parsedOdometer,
        });
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save fuel record');
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

          {/* 2. Real-Time Fuel Rates from fuel.indianapi.in */}
          <View style={styles.liveHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.livePulse} />
              <Text style={styles.sectionLabel}>REAL-TIME FUEL PRICES (INDIANAPI.IN)</Text>
            </View>
            <TouchableOpacity
              onPress={() => fetchLivePrices(selectedCity)}
              style={styles.refreshBtn}
            >
              {fetchingPrices ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="refresh" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* City Selection Bar + Search More Button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cityScroll}
            >
              {POPULAR_CITIES.map((c) => {
                const active = selectedCity.toLowerCase() === c.toLowerCase();
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cityChip, active && styles.cityChipActive]}
                    onPress={() => setSelectedCity(c)}
                  >
                    <Text style={[styles.cityText, active && styles.cityTextActive]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.moreCitiesBtn}
              onPress={() => setCityModalVisible(true)}
            >
              <Ionicons name="search" size={14} color={colors.primary} />
              <Text style={styles.moreCitiesText}>More</Text>
            </TouchableOpacity>
          </View>

          {/* Live Price Cards */}
          <View style={styles.priceCardsRow}>
            {/* Petrol Card */}
            <TouchableOpacity
              style={[
                styles.priceCard,
                fuelType === 'PETROL' && styles.priceCardActivePetrol,
              ]}
              onPress={() => handleSelectLiveRate('PETROL', livePrices?.petrol || 102.86)}
            >
              <View style={styles.priceCardHeader}>
                <Ionicons name="speedometer-outline" size={16} color={colors.fuel} />
                <Text style={styles.priceCardType}>PETROL</Text>
              </View>
              <Text style={styles.priceCardRate}>
                ₹{livePrices ? livePrices.petrol.toFixed(2) : '102.86'}
              </Text>
              <Text style={styles.priceCardSub}>/ Litre ({selectedCity})</Text>
              {fuelType === 'PETROL' && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#FFF" />
                  <Text style={styles.selectedBadgeText}>Selected</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Diesel Card */}
            <TouchableOpacity
              style={[
                styles.priceCard,
                fuelType === 'DIESEL' && styles.priceCardActiveDiesel,
              ]}
              onPress={() => handleSelectLiveRate('DIESEL', livePrices?.diesel || 88.94)}
            >
              <View style={styles.priceCardHeader}>
                <Ionicons name="water-outline" size={16} color={colors.primary} />
                <Text style={styles.priceCardType}>DIESEL</Text>
              </View>
              <Text style={styles.priceCardRate}>
                ₹{livePrices ? livePrices.diesel.toFixed(2) : '88.94'}
              </Text>
              <Text style={styles.priceCardSub}>/ Litre ({selectedCity})</Text>
              {fuelType === 'DIESEL' && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#FFF" />
                  <Text style={styles.selectedBadgeText}>Selected</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* CNG Card */}
            <TouchableOpacity
              style={[
                styles.priceCard,
                fuelType === 'CNG' && styles.priceCardActiveCng,
              ]}
              onPress={() => handleSelectLiveRate('CNG', livePrices?.cng || 79.50)}
            >
              <View style={styles.priceCardHeader}>
                <Ionicons name="flame-outline" size={16} color={colors.success} />
                <Text style={styles.priceCardType}>CNG</Text>
              </View>
              <Text style={styles.priceCardRate}>
                ₹{livePrices ? (livePrices.cng ? livePrices.cng.toFixed(2) : '79.50') : '79.50'}
              </Text>
              <Text style={styles.priceCardSub}>/ Kg</Text>
              {fuelType === 'CNG' && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#FFF" />
                  <Text style={styles.selectedBadgeText}>Selected</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* 3. Fuel Rate / Price Per Liter (Editable) */}
          <Input
            label="Fuel Rate (₹/L) — Auto-filled from live API or customize"
            value={ratePerLiter}
            onChangeText={handleRateChange}
            placeholder="e.g. 102.86"
            keyboardType="decimal-pad"
          />

          {/* 4. Fuel Quantity and Cost with Bidirectional Auto-Calculation */}
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
            title={isEditing ? 'Update Fuel Record' : 'Save Fuel Record'}
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* City Search Modal */}
      <Modal
        visible={cityModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Indian City / District</Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: spacing.xs }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search city (e.g. Mysore, Jaipur, Patna)..."
                placeholderTextColor={colors.textMuted}
                value={citySearchQuery}
                onChangeText={setCitySearchQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityListItem}
                  onPress={() => {
                    setSelectedCity(item.name);
                    setCityModalVisible(false);
                    setCitySearchQuery('');
                  }}
                >
                  <Text style={styles.cityListName}>{item.name}</Text>
                  {selectedCity.toLowerCase() === item.name.toLowerCase() && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  liveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refreshBtn: {
    padding: 4,
  },
  cityScroll: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  cityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cityText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  cityTextActive: {
    color: '#FFF',
  },
  moreCitiesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
    marginLeft: spacing.xs,
  },
  moreCitiesText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  priceCardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  priceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  priceCardActivePetrol: {
    borderColor: colors.fuel,
    backgroundColor: colors.fuel + '10',
  },
  priceCardActiveDiesel: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  priceCardActiveCng: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  priceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  priceCardType: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  priceCardRate: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  priceCardSub: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  selectedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.base,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  cityListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cityListName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
});
