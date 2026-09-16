import React, { useState, useEffect, useRef } from 'react';
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
import { vehiclesApi } from '../../api/vehicles';
import { getLiveCityPrice } from '../../api/liveFuelService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import DatePickerInput from '../../components/DatePickerInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, fontSize } from '../../theme/colors';

const POPULAR_CITIES = [
  'Bengaluru',
  'Hassan',
  'Mysore',
  'Mangalore',
  'Mandya',
  'Shivamogga',
  'Belagavi',
  'Hubli',
  'Delhi',
  'Mumbai',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Kolkata',
  'Kochi',
];

const LOCAL_INDIAN_CITIES: Array<{ name: string; value: string }> = [
  // Karnataka Districts
  { name: 'Hassan', value: 'hassan' },
  { name: 'Bengaluru', value: 'bengaluru' },
  { name: 'Mysuru (Mysore)', value: 'mysore' },
  { name: 'Mangaluru (Mangalore)', value: 'mangalore' },
  { name: 'Mandya', value: 'mandya' },
  { name: 'Shivamogga (Shimoga)', value: 'shivamogga' },
  { name: 'Udupi', value: 'udupi' },
  { name: 'Belagavi (Belgaum)', value: 'belagavi' },
  { name: 'Hubballi-Dharwad', value: 'hubli' },
  { name: 'Tumakuru (Tumkur)', value: 'tumakuru' },
  { name: 'Davanagere', value: 'davanagere' },
  { name: 'Ballari (Bellary)', value: 'ballari' },
  { name: 'Chikkamagaluru', value: 'chikkamagaluru' },
  { name: 'Kodagu (Madikeri)', value: 'kodagu' },
  { name: 'Kolar', value: 'kolar' },
  { name: 'Ramanagara', value: 'ramanagara' },
  { name: 'Chamarajanagar', value: 'chamarajanagar' },
  { name: 'Chikkaballapura', value: 'chikkaballapura' },
  { name: 'Chitradurga', value: 'chitradurga' },
  { name: 'Bagalkote', value: 'bagalkote' },
  { name: 'Vijayapura (Bijapur)', value: 'vijayapura' },
  { name: 'Kalaburagi (Gulbarga)', value: 'kalaburagi' },
  { name: 'Raichur', value: 'raichur' },
  { name: 'Koppal', value: 'koppal' },
  { name: 'Gadag', value: 'gadag' },
  { name: 'Haveri', value: 'haveri' },
  { name: 'Bidar', value: 'bidar' },
  { name: 'Yadgir', value: 'yadgir' },
  { name: 'Uttara Kannada (Karwar)', value: 'karwar' },

  // Top Indian Metros & State Capitals
  { name: 'Delhi', value: 'delhi' },
  { name: 'Mumbai', value: 'mumbai' },
  { name: 'Hyderabad', value: 'hyderabad' },
  { name: 'Chennai', value: 'chennai' },
  { name: 'Kolkata', value: 'kolkata' },
  { name: 'Pune', value: 'pune' },
  { name: 'Ahmedabad', value: 'ahmedabad' },
  { name: 'Jaipur', value: 'jaipur' },
  { name: 'Lucknow', value: 'lucknow' },
  { name: 'Chandigarh', value: 'chandigarh' },
  { name: 'Kochi', value: 'kochi' },
  { name: 'Coimbatore', value: 'coimbatore' },
  { name: 'Madurai', value: 'madurai' },
  { name: 'Surat', value: 'surat' },
  { name: 'Vadodara', value: 'vadodara' },
  { name: 'Indore', value: 'indore' },
  { name: 'Nagpur', value: 'nagpur' },
  { name: 'Nashik', value: 'nashik' },
  { name: 'Patna', value: 'patna' },
  { name: 'Bhopal', value: 'bhopal' },
  { name: 'Bhubaneswar', value: 'bhubaneswar' },
  { name: 'Guwahati', value: 'guwahati' },
  { name: 'Thiruvananthapuram', value: 'thiruvananthapuram' },
  { name: 'Visakhapatnam', value: 'visakhapatnam' },
  { name: 'Agra', value: 'agra' },
  { name: 'Varanasi', value: 'varanasi' },
  { name: 'Kanpur', value: 'kanpur' },
  { name: 'Amritsar', value: 'amritsar' },
  { name: 'Ludhiana', value: 'ludhiana' },
  { name: 'Dehradun', value: 'dehradun' },
  { name: 'Ranchi', value: 'ranchi' },
  { name: 'Raipur', value: 'raipur' },
  { name: 'Goa (Panaji)', value: 'goa' },
];

export default function AddFuelScreen({ route, navigation }: any) {
  const { vehicleId, record } = route.params || {};
  const isEditing = Boolean(record);

  const [date, setDate] = useState<Date>(record ? new Date(record.date) : new Date());
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [chipCities, setChipCities] = useState<string[]>(POPULAR_CITIES);
  const [livePrices, setLivePrices] = useState<{ petrol: number; diesel: number; cng: number; city: string }>({
    city: 'Bengaluru',
    petrol: 111.68,
    diesel: 98.80,
    cng: 79.50,
  });
  const [fetchingPrices, setFetchingPrices] = useState(false);

  // City Search Modal State
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [allCities, setAllCities] = useState<Array<{ name: string; value: string }>>(LOCAL_INDIAN_CITIES);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  const [fuelType, setFuelType] = useState('PETROL');
  const [ratePerLiter, setRatePerLiter] = useState(
    record && record.liters > 0 ? (record.cost / record.liters).toFixed(2) : '111.68'
  );
  const [liters, setLiters] = useState(record ? String(record.liters) : '');
  const [cost, setCost] = useState(record ? String(record.cost) : '');
  const [odometer, setOdometer] = useState(record ? String(record.odometerReading) : '');
  const [loading, setLoading] = useState(false);
  const vehicleFuelLoaded = useRef(false);

  // Set navigation header title dynamically + override back button when launched from Dashboard
  useEffect(() => {
    const returnTo = route.params?.returnTo;
    navigation.setOptions({
      title: isEditing ? 'Edit Fuel Record' : 'Add Fuel Record',
      ...(returnTo ? {
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.navigate(returnTo)} style={{ paddingRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        ),
      } : {}),
    });
  }, [isEditing, navigation, route.params?.returnTo]);

  // Select a city / district, add to chip bar if missing, and persist
  const selectCity = (cityName: string) => {
    const trimmed = cityName.trim();
    if (!trimmed) return;
    setSelectedCity(trimmed);

    setChipCities((prev) => {
      const exists = prev.some((c) => c.toLowerCase() === trimmed.toLowerCase());
      if (!exists) {
        return [trimmed, ...prev];
      }
      return prev;
    });

    AsyncStorage.setItem('@preferred_fuel_city', trimmed).catch(() => {});
  };

  // Load user's saved fuel city on mount
  useEffect(() => {
    AsyncStorage.getItem('@preferred_fuel_city').then((saved) => {
      if (saved && saved.trim()) {
        selectCity(saved.trim());
      }
    }).catch(() => {});
  }, []);

  // Load all available cities for modal from backend, merge with local list
  useEffect(() => {
    fuelApi.getCities().then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        // Merge without duplicates
        const existingNames = new Set(LOCAL_INDIAN_CITIES.map((c) => c.name.toLowerCase()));
        const merged = [...LOCAL_INDIAN_CITIES];
        for (const item of res.data) {
          if (item && item.name && !existingNames.has(item.name.toLowerCase())) {
            merged.push(item);
            existingNames.add(item.name.toLowerCase());
          }
        }
        setAllCities(merged);
      }
    }).catch(() => {});
  }, []);

  // Preselect vehicle fuel type
  useEffect(() => {
    if (!record && vehicleId) {
      vehiclesApi.getById(vehicleId).then((res) => {
        if (res.data?.fuelType) {
          const ft = String(res.data.fuelType).toUpperCase();
          setFuelType(ft);
        }
        vehicleFuelLoaded.current = true;
      }).catch(() => {
        vehicleFuelLoaded.current = true;
      });
    } else {
      vehicleFuelLoaded.current = true;
    }
  }, [vehicleId, record]);

  // Fetch real-time live daily fuel rates
  const loadPricesForCity = async (city: string) => {
    setFetchingPrices(true);
    try {
      const priceData = await getLiveCityPrice(city);
      setLivePrices(priceData);
      // Auto update current rate only if vehicle fuel type is already loaded and not in edit mode
      if (!isEditing && vehicleFuelLoaded.current) {
        const activeRate = fuelType === 'DIESEL' ? priceData.diesel
          : fuelType === 'CNG' ? priceData.cng
          : priceData.petrol;
        if (activeRate > 0) {
          const rateStr = activeRate.toFixed(2);
          setRatePerLiter(rateStr);
          setLiters((prevLiters) => {
            if (prevLiters && parseFloat(prevLiters) > 0) {
              setCost((parseFloat(prevLiters) * activeRate).toFixed(2));
            }
            return prevLiters;
          });
        }
      }
    } catch (e) {
      console.log('Error loading prices for city:', e);
    } finally {
      setFetchingPrices(false);
    }
  };

  useEffect(() => {
    loadPricesForCity(selectedCity);
  }, [selectedCity]);

  // Auto-sync rate when vehicle fuelType changes (and reload prices for correct type)
  useEffect(() => {
    if (livePrices && !isEditing && vehicleFuelLoaded.current) {
      const activeRate = fuelType === 'DIESEL' ? livePrices.diesel
        : fuelType === 'CNG' ? livePrices.cng
        : livePrices.petrol;
      if (activeRate > 0) {
        const rateStr = activeRate.toFixed(2);
        setRatePerLiter(rateStr);
        if (liters && parseFloat(liters) > 0) {
          setCost((parseFloat(liters) * activeRate).toFixed(2));
        }
      }
    }
  }, [fuelType, isEditing]);

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
      // Check for duplicate fuel log on the same date with same odometer or cost
      const existingRes = await fuelApi.getAll(vehicleId).catch(() => ({ data: [] }));
      const allFuel: any[] = existingRes.data || [];
      const targetDateStr = date.toISOString().slice(0, 10);

      const isDuplicate = allFuel.some((f) => {
        if (isEditing && f.id === record.id) return false;
        const fDateStr = new Date(f.date).toISOString().slice(0, 10);
        if (fDateStr !== targetDateStr) return false;

        const odoMatch = f.odometer && Math.abs(Number(f.odometer) - parsedOdometer) === 0;
        const costMatch = f.cost && Math.abs(Number(f.cost) - parsedCost) < 0.5 && Math.abs(Number(f.liters) - parsedLiters) < 0.1;
        return odoMatch || costMatch;
      });

      if (isDuplicate) {
        Alert.alert(
          'Duplicate Fuel Record Detected',
          `A fuel fill-up record for this date (${targetDateStr}) with odometer ${parsedOdometer} KM already exists.`
        );
        setLoading(false);
        return;
      }

      const payload = {
        date: date.toISOString(),
        liters: parsedLiters,
        cost: parsedCost,
        odometerReading: parsedOdometer,
      };

      if (isEditing) {
        await fuelApi.update(vehicleId, record.id, payload);
      } else {
        await fuelApi.create(vehicleId, payload);
      }

      if (route.params?.returnTo) {
        navigation.navigate(route.params.returnTo);
      } else {
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
              <Text style={styles.sectionLabel}>LIVE FUEL PRICES (INDIANAPI.IN)</Text>
            </View>
            <TouchableOpacity
              onPress={() => loadPricesForCity(selectedCity)}
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
              {chipCities.map((c) => {
                const active = selectedCity.toLowerCase() === c.toLowerCase();
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cityChip, active && styles.cityChipActive]}
                    onPress={() => selectCity(c)}
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
              onPress={() => handleSelectLiveRate('PETROL', livePrices.petrol)}
            >
              <View style={styles.priceCardHeader}>
                <Ionicons name="speedometer-outline" size={16} color={colors.fuel} />
                <Text style={styles.priceCardType}>PETROL</Text>
              </View>
              <Text style={styles.priceCardRate}>
                ₹{livePrices.petrol.toFixed(2)}
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
              onPress={() => handleSelectLiveRate('DIESEL', livePrices.diesel)}
            >
              <View style={styles.priceCardHeader}>
                <Ionicons name="water-outline" size={16} color={colors.primary} />
                <Text style={styles.priceCardType}>DIESEL</Text>
              </View>
              <Text style={styles.priceCardRate}>
                ₹{livePrices.diesel.toFixed(2)}
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
              onPress={() => handleSelectLiveRate('CNG', livePrices.cng)}
            >
              <View style={styles.priceCardHeader}>
                <Ionicons name="flame-outline" size={16} color={colors.success} />
                <Text style={styles.priceCardType}>CNG</Text>
              </View>
              <Text style={styles.priceCardRate}>
                ₹{livePrices.cng.toFixed(2)}
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

          {/* Rate Per Liter Field */}
          <Input
            label="Rate Per Litre (₹) *"
            value={ratePerLiter}
            onChangeText={handleRateChange}
            placeholder="e.g. 111.12"
            keyboardType="numeric"
          />

          {/* Fuel Quantity (Liters) */}
          <Input
            label="Fuel Quantity (Liters) *"
            value={liters}
            onChangeText={handleLitersChange}
            placeholder="e.g. 35.5"
            keyboardType="numeric"
          />

          {/* Total Cost */}
          <Input
            label="Total Cost (₹) *"
            value={cost}
            onChangeText={handleCostChange}
            placeholder="e.g. 3500"
            keyboardType="numeric"
          />

          {/* Calculation Summary Card */}
          {parseFloat(liters) > 0 && parseFloat(cost) > 0 ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Fuel Filled</Text>
                <Text style={styles.summaryValue}>{parseFloat(liters).toFixed(2)} L</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Effective Rate</Text>
                <Text style={styles.summaryValue}>₹{computedRate}/L</Text>
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
                placeholder="Search district/city (e.g. Hassan, Mysuru)..."
                placeholderTextColor={colors.textMuted}
                value={citySearchQuery}
                onChangeText={setCitySearchQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item.value || item.name}
              ListHeaderComponent={
                citySearchQuery.trim() &&
                !filteredCities.some((c) => c.name.toLowerCase() === citySearchQuery.trim().toLowerCase()) ? (
                  <TouchableOpacity
                    style={[
                      styles.cityListItem,
                      {
                        backgroundColor: colors.primary + '15',
                        borderRadius: borderRadius.md,
                        marginBottom: spacing.xs,
                      },
                    ]}
                    onPress={() => {
                      selectCity(citySearchQuery.trim());
                      setCityModalVisible(false);
                      setCitySearchQuery('');
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="location" size={18} color={colors.primary} />
                      <Text style={[styles.cityListName, { color: colors.primary, fontWeight: '700' }]}>
                        Use "{citySearchQuery.trim()}"
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                  </TouchableOpacity>
                ) : null
              }
              renderItem={({ item }) => {
                const isSelected =
                  selectedCity.toLowerCase() === item.name.toLowerCase() ||
                  selectedCity.toLowerCase() === (item.value || '').toLowerCase();
                return (
                  <TouchableOpacity
                    style={styles.cityListItem}
                    onPress={() => {
                      selectCity(item.name);
                      setCityModalVisible(false);
                      setCitySearchQuery('');
                    }}
                  >
                    <Text style={[styles.cityListName, isSelected && { color: colors.primary, fontWeight: '700' }]}>
                      {item.name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
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
