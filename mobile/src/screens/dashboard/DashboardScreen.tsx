import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { vehiclesApi } from '../../api/vehicles';
import { fuelApi } from '../../api/fuel';
import { expensesApi, remindersApi } from '../../api/resources';
import { getLiveCityPrice, CityPrice } from '../../api/liveFuelService';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

import MechanicalOdometer from '../../components/MechanicalOdometer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Vehicle images (Local authentic assets with web fallbacks) ───
const VEHICLE_IMAGES: Record<string, string> = {
  // Hyundai
  creta: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/106815/creta-exterior-right-front-three-quarter-2.jpeg',
  venue: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/141867/venue-exterior-right-front-three-quarter.jpeg',
  i20: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/150601/i20-exterior-right-front-three-quarter.jpeg',
  verna: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/144999/verna-exterior-right-front-three-quarter.jpeg',
  // Royal Enfield
  himalayan: 'https://imgd.aeplcdn.com/1056x594/n/cw/ec/124017/himalayan-450-right-front-three-quarter.jpeg',
  'himalayan 450': 'https://imgd.aeplcdn.com/1056x594/n/cw/ec/124017/himalayan-450-right-front-three-quarter.jpeg',
  meteor: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/153697/meteor-350-right-front-three-quarter.jpeg',
  classic: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/151861/classic-350-right-front-three-quarter.jpeg',
  bullet: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/162149/bullet-350-right-front-three-quarter.jpeg',
  hunter: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/105909/hunter-350-right-front-three-quarter.jpeg',
  // Others
  nexon: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/169563/nexon-exterior-right-front-three-quarter.jpeg',
  seltos: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/174943/seltos-exterior-right-front-three-quarter.jpeg',
  swift: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/159099/swift-exterior-right-front-three-quarter.jpeg',
  baleno: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/167861/baleno-exterior-right-front-three-quarter.jpeg',
  thar: 'https://imgd.aeplcdn.com/664x374/n/cw/ec/149497/thar-roxx-exterior-right-front-three-quarter.jpeg',
};

function getVehicleImageSource(vehicle: any): any {
  if (!vehicle) return null;
  const model = (vehicle.model || '').toLowerCase();
  const make = (vehicle.make || '').toLowerCase();

  // 1. Check direct match for Creta
  if (model.includes('creta') || make.includes('hyundai')) {
    return require('../../../assets/vehicles/creta.jpg');
  }
  // 2. Check direct match for Himalayan / bike
  if (model.includes('himalayan') || make.includes('enfield') || model.includes('bullet') || model.includes('hunter')) {
    return require('../../../assets/vehicles/himalayan.jpg');
  }

  // 3. Check model remote URL
  for (const [key, url] of Object.entries(VEHICLE_IMAGES)) {
    if (model.includes(key)) return { uri: url };
  }

  // 4. Default fallback by category
  return isCar(vehicle)
    ? require('../../../assets/vehicles/creta.jpg')
    : require('../../../assets/vehicles/himalayan.jpg');
}

// ─── Category config for donut ───
const CATEGORY_COLORS: Record<string, { label: string; icon: string; color: string }> = {
  FUEL: { label: 'Fuel', icon: 'flame', color: '#F97316' },
  SERVICE: { label: 'Service', icon: 'build', color: '#3B82F6' },
  REPAIR: { label: 'Repairs', icon: 'hammer', color: '#EF4444' },
  TOLL: { label: 'Toll', icon: 'navigate-circle', color: '#0D9488' },
  PARKING: { label: 'Parking', icon: 'car', color: '#8B5CF6' },
  INSURANCE: { label: 'Insurance', icon: 'shield-checkmark', color: '#10B981' },
  PARTS: { label: 'Parts', icon: 'cube', color: '#F59E0B' },
  OTHER: { label: 'Other', icon: 'receipt', color: '#64748B' },
};

// ─── Fuel type detection ───
function isCar(vehicle: any): boolean {
  if (!vehicle) return false;
  const model = (vehicle.model || '').toLowerCase();
  const make = (vehicle.make || '').toLowerCase();
  return (
    /creta|seltos|xuv|nexon|hector|fortuner|innova|brezza|safari|venue|sonet|thar|scorpio|harrier|altroz|punch|i20|verna|city|civic|polo|swift|baleno|dzire|ertiga|bolero/.test(model) ||
    /hyundai|kia|mahindra|tata|mg|toyota|maruti|volkswagen|skoda|ford/.test(make)
  );
}

function getFuelType(vehicle: any): 'diesel' | 'petrol' {
  return isCar(vehicle) ? 'diesel' : 'petrol';
}

function getFuelBadgeColor(type: 'diesel' | 'petrol'): string {
  return type === 'diesel' ? '#F97316' : colors.neonCyan;
}

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Per-vehicle data
  const [vehExpenses, setVehExpenses] = useState<any[]>([]);
  const [vehFuelLogs, setVehFuelLogs] = useState<any[]>([]);
  const [vehFuelSummary, setVehFuelSummary] = useState<any>(null);
  const [vehReminders, setVehReminders] = useState<any[]>([]);
  const [livePrices, setLivePrices] = useState<CityPrice | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const serviceBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const selectedVehicle = vehicles[selectedIdx] || null;
  const fuelType = selectedVehicle ? getFuelType(selectedVehicle) : 'petrol';
  const fuelBadgeColor = getFuelBadgeColor(fuelType);

  // ─── Load vehicle list ───
  const loadVehicles = useCallback(async () => {
    try {
      const res = await vehiclesApi.getAll();
      setVehicles(res.data || []);
    } catch (e) {
      console.log('Vehicle load error:', e);
    }
  }, []);

  // ─── Load per-vehicle data ───
  const loadVehicleData = useCallback(async (vehicleId: string) => {
    Animated.timing(fadeAnim, { toValue: 0.3, duration: 150, useNativeDriver: true }).start();

    try {
      const [expRes, fuelAllRes, fuelSumRes, remRes] = await Promise.all([
        expensesApi.getAll(vehicleId).catch(() => ({ data: [] })),
        fuelApi.getAll(vehicleId).catch(() => ({ data: [] })),
        fuelApi.getSummary(vehicleId).catch(() => ({ data: null })),
        remindersApi.getAll(vehicleId).catch(() => ({ data: [] })),
      ]);

      setVehExpenses(Array.isArray(expRes.data) ? expRes.data : []);
      setVehFuelLogs(Array.isArray(fuelAllRes.data) ? fuelAllRes.data : []);
      setVehFuelSummary(fuelSumRes.data || null);
      setVehReminders(
        (Array.isArray(remRes.data) ? remRes.data : []).filter(
          (r: any) => r.status === 'PENDING' || r.status === 'OVERDUE'
        )
      );
    } catch (e) {
      console.log('Vehicle data load error:', e);
    } finally {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [fadeAnim]);

  useEffect(() => {
    if (selectedVehicle?.id) {
      loadVehicleData(selectedVehicle.id);
    }
  }, [selectedVehicle?.id, loadVehicleData]);

  useEffect(() => {
    getLiveCityPrice('Bengaluru').then(setLivePrices).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { loadVehicles(); }, [loadVehicles]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    if (selectedVehicle?.id) await loadVehicleData(selectedVehicle.id);
    getLiveCityPrice('Bengaluru').then(setLivePrices).catch(() => {});
    setRefreshing(false);
  };

  // ─── Computed: This month's date keys ───
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

  const getMonthKey = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // ─── Per-vehicle expense data ───
  const thisMonthExpenses = vehExpenses.filter((e) => getMonthKey(e.date) === currentMonth);
  const prevMonthExpenses = vehExpenses.filter((e) => getMonthKey(e.date) === prevMonth);

  const thisMonthTotal = thisMonthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const prevMonthTotal = prevMonthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const pctChange = prevMonthTotal > 0 ? ((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0;

  // Category breakdown for donut — combine expenses + fuel into categories
  const catMap: Record<string, number> = {};
  for (const e of thisMonthExpenses) {
    const cat = (e.category || 'OTHER').toUpperCase();
    catMap[cat] = (catMap[cat] || 0) + (Number(e.amount) || 0);
  }
  // Also add fuel records as "FUEL" category
  const thisMonthFuelLogs = vehFuelLogs.filter((f) => getMonthKey(f.date) === currentMonth);
  const thisMonthFuelCost = thisMonthFuelLogs.reduce((s, f) => s + (Number(f.cost) || 0), 0);
  if (thisMonthFuelCost > 0) {
    catMap['FUEL'] = (catMap['FUEL'] || 0) + thisMonthFuelCost;
  }

  const totalWithFuel = thisMonthTotal + thisMonthFuelCost;

  const categorySlices = Object.entries(catMap)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      pct: totalWithFuel > 0 ? (amount / totalWithFuel) * 100 : 0,
      color: CATEGORY_COLORS[cat]?.color || '#64748B',
      label: CATEGORY_COLORS[cat]?.label || cat,
      icon: CATEGORY_COLORS[cat]?.icon || 'receipt',
    }))
    .sort((a, b) => b.amount - a.amount);

  // SVG donut slices
  const donutRadius = 52;
  const donutStroke = 14;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accAngle = 0;
  const donutSlices = categorySlices.map((s) => {
    const len = (s.pct / 100) * donutCircumference;
    const offset = -accAngle;
    accAngle += len;
    return { ...s, dasharray: `${len} ${donutCircumference - len}`, dashoffset: offset };
  });

  // Per-vehicle mileage from fuel summary
  const avgMileage = vehFuelSummary?.latestAvgKmpl || 0;

  // Fuel cost from monthly totals in summary
  const fuelMonthlyCost = vehFuelSummary?.monthlyTotals?.[currentMonth]?.totalCost || thisMonthFuelCost;

  // Mileage gauge
  const maxMileage = fuelType === 'diesel' ? 25 : 50;
  const mileagePct = Math.min((avgMileage / maxMileage) * 100, 100);
  const mileageRadius = 44;
  const mileageStroke = 9;
  const mileageCirc = 2 * Math.PI * mileageRadius;
  const mileageDash = (mileagePct / 100) * mileageCirc;

  // Live fuel price for the correct type
  const livePrice = fuelType === 'diesel' ? livePrices?.diesel : livePrices?.petrol;

  // Next service estimation
  const odo = selectedVehicle?.currentOdometer || 0;
  const serviceInterval = fuelType === 'diesel' ? 10000 : 5000;
  const nextServiceKm = Math.ceil(odo / serviceInterval) * serviceInterval;
  const kmToService = nextServiceKm - odo;
  const serviceProgress = Math.max(0, Math.min(1, 1 - kmToService / serviceInterval));

  useEffect(() => {
    serviceBarAnim.setValue(0);
    Animated.timing(serviceBarAnim, {
      toValue: serviceProgress,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [serviceProgress, serviceBarAnim]);

  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const sortedReminders = [...vehReminders].sort((a, b) => {
    const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return da - db;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonCyan} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════ 1. HEADER ═══════════════════ */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'User'} 👋</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('RemindersTab')}>
              <Ionicons name="notifications-outline" size={20} color={colors.neumorphTextPrimary} />
              {vehReminders.length > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{vehReminders.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('ProfileTab')}>
              <Ionicons name="person" size={16} color={colors.neonCyan} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══════════════════ 2. VEHICLE SELECTOR (Mockup V2 Image Style) ═══════════════════ */}
        {vehicles.length > 0 && (
          vehicles.length <= 2 ? (
            <View style={styles.vehicleRowFit}>
              {vehicles.map((v, idx) => {
                const active = idx === selectedIdx;
                const vFuel = getFuelType(v);
                const isDiesel = vFuel === 'diesel';
                const badgeColor = isDiesel ? '#F97316' : '#00F2FE';
                const imgSrc = getVehicleImageSource(v);
                const displayName = v.model?.toLowerCase().includes('creta')
                  ? 'Hyundai Creta'
                  : v.model?.toLowerCase().includes('himalayan')
                  ? 'RE Himalayan 450'
                  : `${v.make} ${v.model}`;
                const isACar = isCar(v);

                return (
                  <TouchableOpacity
                    key={v.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedIdx(idx)}
                    style={[
                      styles.vehicleCard,
                      styles.vehicleCardFit,
                      active && styles.vehicleCardActive,
                      !isACar && styles.bikeVehicleCard,
                    ]}
                  >
                    {/* Glossy specular reflection */}
                    <View style={styles.glassReflection} pointerEvents="none" />

                    {/* Vehicle Photo (Cars only) */}
                    {isACar && (
                      <View style={styles.vehicleCardImageWrap}>
                        <Image
                          source={imgSrc}
                          style={styles.vehicleCardImage}
                          resizeMode="contain"
                        />
                      </View>
                    )}

                    {/* Vehicle Name */}
                    <Text
                      style={[
                        styles.vehicleCardName,
                        !isACar && styles.bikeName,
                        active && styles.vehicleCardNameActive,
                      ]}
                      numberOfLines={2}
                    >
                      {displayName}
                    </Text>

                    {/* Fuel Type Badge (DIESEL / PETROL) */}
                    <View
                      style={[
                        styles.fuelBadge,
                        {
                          backgroundColor: isDiesel ? 'rgba(249, 115, 22, 0.12)' : 'rgba(0, 242, 254, 0.12)',
                          borderColor: badgeColor,
                          marginTop: !isACar ? 6 : 8,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.fuelBadgeText,
                          {
                            color: badgeColor,
                            textShadowColor: isDiesel ? 'rgba(249, 115, 22, 0.6)' : 'rgba(0, 242, 254, 0.6)',
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 6,
                          },
                        ]}
                      >
                        {vFuel.toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vehicleScrollContent}
            >
              {vehicles.map((v, idx) => {
                const active = idx === selectedIdx;
                const vFuel = getFuelType(v);
                const isDiesel = vFuel === 'diesel';
                const badgeColor = isDiesel ? '#F97316' : '#00F2FE';
                const imgSrc = getVehicleImageSource(v);
                const displayName = v.model?.toLowerCase().includes('creta')
                  ? 'Hyundai Creta'
                  : v.model?.toLowerCase().includes('himalayan')
                  ? 'RE Himalayan 450'
                  : `${v.make} ${v.model}`;
                const isACar = isCar(v);

                return (
                  <TouchableOpacity
                    key={v.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedIdx(idx)}
                    style={[
                      styles.vehicleCard,
                      styles.vehicleCardScroll,
                      active && styles.vehicleCardActive,
                      !isACar && styles.bikeVehicleCard,
                    ]}
                  >
                    <View style={styles.glassReflection} pointerEvents="none" />
                    {isACar && (
                      <View style={styles.vehicleCardImageWrap}>
                        <Image
                          source={imgSrc}
                          style={styles.vehicleCardImage}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                    <Text
                      style={[
                        styles.vehicleCardName,
                        !isACar && styles.bikeName,
                        active && styles.vehicleCardNameActive,
                      ]}
                      numberOfLines={2}
                    >
                      {displayName}
                    </Text>
                    <View
                      style={[
                        styles.fuelBadge,
                        {
                          backgroundColor: isDiesel ? 'rgba(249, 115, 22, 0.12)' : 'rgba(0, 242, 254, 0.12)',
                          borderColor: badgeColor,
                          marginTop: !isACar ? 6 : 8,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.fuelBadgeText,
                          {
                            color: badgeColor,
                            textShadowColor: isDiesel ? 'rgba(249, 115, 22, 0.6)' : 'rgba(0, 242, 254, 0.6)',
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 6,
                          },
                        ]}
                      >
                        {vFuel.toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )
        )}

        {vehicles.length === 0 && (
          <TouchableOpacity
            style={styles.emptyAddCard}
            onPress={() => navigation.navigate('VehiclesTab', { screen: 'AddVehicle' })}
          >
            <Ionicons name="add-circle-outline" size={36} color={colors.neonCyan} />
            <Text style={styles.emptyAddText}>Add your first vehicle</Text>
          </TouchableOpacity>
        )}

        {/* ═══════════════════ 3. SELECTED VEHICLE TELEMETRY ═══════════════════ */}
        {selectedVehicle && (
          <Animated.View style={[styles.telemetryCard, { opacity: fadeAnim }]}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={{ width: '100%', alignItems: 'center' }}
              onPress={() =>
                navigation.navigate('VehiclesTab', {
                  screen: 'VehicleDetail',
                  params: { vehicleId: selectedVehicle.id },
                })
              }
            >
              {/* 1. Vehicle Name */}
              <Text style={styles.telemetryTitle}>
                {selectedVehicle.make} {selectedVehicle.model}
              </Text>

              {/* 2. Vehicle Number & Make */}
              <View style={styles.plateRow}>
                <View style={styles.plateBadge}>
                  <Text style={styles.plateText}>{selectedVehicle.licensePlate}</Text>
                </View>
                <Text style={styles.makeYearText}>
                  {selectedVehicle.make} • {selectedVehicle.year}
                </Text>
              </View>

              {/* 3. Rolling Odometer */}
              <View style={styles.odometerRow}>
                <MechanicalOdometer
                  odometer={selectedVehicle.currentOdometer || 0}
                  label=""
                  unit="KM"
                />
              </View>

              {/* 4. Next Service */}
              <View style={styles.serviceBarWrap}>
                <View style={styles.serviceBarTrack}>
                  <Animated.View
                    style={[
                      styles.serviceBarFill,
                      {
                        width: serviceBarAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor:
                          serviceProgress > 0.85
                            ? colors.neonRed
                            : serviceProgress > 0.6
                            ? colors.neonAmber
                            : colors.neonCyan,
                      },
                    ]}
                  />
                </View>
                <View style={styles.serviceBarFooter}>
                  <View style={styles.serviceLabelRow}>
                    <Ionicons name="speedometer-outline" size={13} color={colors.neumorphTextSecondary} />
                    <Text style={styles.serviceBarLabel}>Next Service</Text>
                  </View>
                  <Text style={styles.serviceBarValue}>{kmToService.toLocaleString()} KM away</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ═══════════════════ 4. FUEL INSIGHTS (PER VEHICLE) ═══════════════════ */}
        {selectedVehicle && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.sectionTitle}>FUEL INSIGHTS</Text>
            <View style={styles.fuelCard}>
              <View style={styles.fuelCardInner}>
                {/* Mileage Gauge */}
                <View style={styles.gaugeWrap}>
                  <Svg width={108} height={108} viewBox="0 0 108 108">
                    <Defs>
                      <SvgGradient id="mileageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={colors.neonCyan} />
                        <Stop offset="100%" stopColor={colors.primary} />
                      </SvgGradient>
                    </Defs>
                    <G rotation="-90" origin="54, 54">
                      <Circle cx={54} cy={54} r={mileageRadius} stroke="rgba(0,242,254,0.12)" strokeWidth={mileageStroke} fill="transparent" />
                      <Circle
                        cx={54} cy={54} r={mileageRadius}
                        stroke="url(#mileageGrad)"
                        strokeWidth={mileageStroke}
                        strokeDasharray={`${mileageDash} ${mileageCirc - mileageDash}`}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </G>
                  </Svg>
                  <View style={styles.gaugeCenter}>
                    <Text style={styles.gaugeVal}>{avgMileage > 0 ? avgMileage.toFixed(1) : '—'}</Text>
                    <Text style={styles.gaugeSub}>KM/L</Text>
                  </View>
                </View>

                {/* Right Side: Live Price + Month Cost */}
                <View style={styles.fuelRightCol}>
                  {/* Live Fuel Price */}
                  <View style={styles.fuelStatCard}>
                    <View style={styles.liveLabelRow}>
                      <Text style={styles.fuelStatLabel}>
                        Live {fuelType === 'diesel' ? 'Diesel' : 'Petrol'}
                      </Text>
                      <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                      <Text style={styles.liveTag}>LIVE</Text>
                    </View>
                    <Text style={[styles.fuelPriceValue, { color: fuelBadgeColor }]}>
                      ₹{livePrice?.toFixed(2) || '—'}/L
                    </Text>
                    <Text style={styles.fuelCityText}>
                      {fuelType.toUpperCase()} • Bengaluru
                    </Text>
                  </View>

                  {/* Monthly Fuel Cost — uses both summary.monthlyTotals AND fuel logs */}
                  <View style={styles.fuelStatCard}>
                    <Text style={styles.fuelStatLabel}>Fuel Cost This Month</Text>
                    <Text style={styles.fuelCostValue}>
                      ₹{fuelMonthlyCost > 0 ? Math.round(fuelMonthlyCost).toLocaleString() : '0'}
                    </Text>
                    {thisMonthFuelLogs.length > 0 && (
                      <Text style={styles.fuelCityText}>
                        {thisMonthFuelLogs.length} fill-up{thisMonthFuelLogs.length > 1 ? 's' : ''} •{' '}
                        {thisMonthFuelLogs.reduce((s, f) => s + (Number(f.liters) || 0), 0).toFixed(1)}L
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ═══════════════════ 5. EXPENSE BREAKDOWN (PER VEHICLE) ═══════════════════ */}
        {selectedVehicle && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>EXPENSE BREAKDOWN</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('VehiclesTab', {
                    screen: 'ExpenseList',
                    params: { vehicleId: selectedVehicle.id },
                  })
                }
              >
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.expenseCard}>
              <View style={styles.expenseCardInner}>
                {/* Donut */}
                <View style={styles.donutWrap}>
                  <Svg width={130} height={130} viewBox="0 0 130 130">
                    <G rotation="-90" origin="65, 65">
                      <Circle cx={65} cy={65} r={donutRadius} stroke="rgba(255,255,255,0.06)" strokeWidth={donutStroke} fill="transparent" />
                      {totalWithFuel > 0 &&
                        donutSlices.map((sl) => (
                          <Circle
                            key={sl.category}
                            cx={65} cy={65} r={donutRadius}
                            stroke={sl.color}
                            strokeWidth={donutStroke}
                            strokeDasharray={sl.dasharray}
                            strokeDashoffset={sl.dashoffset}
                            strokeLinecap="butt"
                            fill="transparent"
                          />
                        ))}
                    </G>
                  </Svg>
                  <View style={styles.donutCenter}>
                    <Text style={styles.donutTotal}>
                      ₹{totalWithFuel > 0 ? Math.round(totalWithFuel).toLocaleString() : '0'}
                    </Text>
                    <Text style={styles.donutLabel}>This Month</Text>
                  </View>
                </View>

                {/* Category Legend + Comparison */}
                <View style={styles.expenseRightCol}>
                  {prevMonthTotal > 0 && (
                    <View style={styles.changeChip}>
                      <Ionicons
                        name={pctChange >= 0 ? 'trending-up' : 'trending-down'}
                        size={14}
                        color={pctChange >= 0 ? colors.error : colors.success}
                      />
                      <Text style={[styles.changeChipText, { color: pctChange >= 0 ? colors.error : colors.success }]}>
                        {Math.abs(pctChange).toFixed(1)}% vs last month
                      </Text>
                    </View>
                  )}
                  {categorySlices.slice(0, 5).map((sl) => (
                    <View key={sl.category} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: sl.color }]} />
                      <Text style={styles.legendLabel}>{sl.label}</Text>
                      <Text style={styles.legendAmt}>₹{Math.round(sl.amount).toLocaleString()}</Text>
                      <Text style={styles.legendPct}>{sl.pct.toFixed(0)}%</Text>
                    </View>
                  ))}
                  {categorySlices.length === 0 && (
                    <View style={styles.noDataCol}>
                      <Ionicons name="pie-chart-outline" size={24} color={colors.neumorphTextMuted} />
                      <Text style={styles.emptyHint}>No expenses this month</Text>
                      <TouchableOpacity
                        style={styles.addFirstBtn}
                        onPress={() =>
                          navigation.navigate('VehiclesTab', {
                            screen: 'AddExpense',
                            params: { vehicleId: selectedVehicle.id },
                          })
                        }
                      >
                        <Text style={styles.addFirstBtnText}>+ Add Expense</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ═══════════════════ 6. UPCOMING REMINDERS (PER VEHICLE) ═══════════════════ */}
        {selectedVehicle && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>UPCOMING REMINDERS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('RemindersTab')}>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>

            {sortedReminders.length === 0 ? (
              <View style={styles.noRemindersCard}>
                <Ionicons name="checkmark-circle" size={28} color={colors.neonGreen} />
                <Text style={styles.noRemindersTitle}>All clear!</Text>
                <Text style={styles.noRemindersSub}>No pending reminders for this vehicle 🎉</Text>
              </View>
            ) : (
              <View style={styles.remindersList}>
                {sortedReminders.slice(0, 4).map((r: any) => {
                  const dueDate = r.dueDate ? new Date(r.dueDate) : null;
                  const daysLeft = dueDate
                    ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  let urgencyColor = colors.neonGreen;
                  let urgencyLabel = 'On Track';
                  if (daysLeft !== null) {
                    if (daysLeft <= 0) { urgencyColor = colors.neonRed; urgencyLabel = 'OVERDUE'; }
                    else if (daysLeft <= 7) { urgencyColor = colors.neonRed; urgencyLabel = `${daysLeft}d left`; }
                    else if (daysLeft <= 30) { urgencyColor = colors.neonAmber; urgencyLabel = `${daysLeft}d left`; }
                    else { urgencyColor = colors.neonGreen; urgencyLabel = `${daysLeft}d left`; }
                  }

                  const iconName =
                    r.type === 'SERVICE' ? 'build' :
                    r.type === 'INSURANCE' ? 'shield-checkmark' :
                    r.type === 'PUC' ? 'document-text' :
                    r.type === 'PART_REPLACEMENT' ? 'cube' :
                    'notifications';

                  return (
                    <View key={r.id} style={[styles.reminderCard, { borderLeftColor: urgencyColor }]}>
                      <View style={[styles.reminderIconWrap, { backgroundColor: `${urgencyColor}18` }]}>
                        <Ionicons name={iconName as any} size={20} color={urgencyColor} />
                      </View>
                      <View style={styles.reminderBody}>
                        <Text style={styles.reminderTitle} numberOfLines={1}>
                          {r.title || r.type?.replace('_', ' ')}
                        </Text>
                        {dueDate && (
                          <Text style={styles.reminderDate}>
                            Due: {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.urgencyBadge, { backgroundColor: `${urgencyColor}20`, borderColor: `${urgencyColor}50` }]}>
                        <Text style={[styles.urgencyBadgeText, { color: urgencyColor }]}>{urgencyLabel}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {/* ═══════════════════ 7. QUICK ACTION LAUNCHPAD ═══════════════════ */}
        {selectedVehicle && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>QUICK ACTIONS</Text>
            <View style={styles.quickRow}>
              {[
                { icon: 'flame' as const, label: 'Add Fuel', color: '#F97316', screen: 'AddFuel' },
                { icon: 'wallet' as const, label: 'Expense', color: '#8B5CF6', screen: 'AddExpense' },
                { icon: 'build' as const, label: 'Service', color: '#3B82F6', screen: 'AddService' },
                { icon: 'notifications' as const, label: 'Reminder', color: '#10B981', screen: 'AddReminder' },
              ].map((a) => (
                <TouchableOpacity
                  key={a.label}
                  style={styles.quickBtn}
                  activeOpacity={0.75}
                  onPress={() =>
                    navigation.navigate('VehiclesTab', {
                      screen: a.screen,
                      params: { vehicleId: selectedVehicle.id },
                    })
                  }
                >
                  <View style={[styles.quickOuter, { shadowColor: a.color }]}>
                    <View style={[styles.quickInner, { backgroundColor: `${a.color}22` }]}>
                      <Ionicons name={a.icon} size={22} color={a.color} />
                    </View>
                  </View>
                  <Text style={styles.quickLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080C18' },
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },

  // ─── Header ───
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10,
  },
  greeting: { fontSize: 24, fontWeight: '900', color: '#F8FAFC' },
  dateText: { fontSize: 12, color: colors.neumorphTextSecondary, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellBtn: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: '#111827',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute', top: -3, right: -3, backgroundColor: colors.neonRed,
    width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  bellBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#111827',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(0, 242, 254, 0.4)',
  },

  // ─── Vehicle Selector Cards (Mockup V2 Image 2 exact match) ───
  vehicleRowFit: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
    paddingVertical: 10,
  },
  vehicleScrollContent: {
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  vehicleCard: {
    backgroundColor: '#0F1626',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 195,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  vehicleCardFit: {
    flex: 1,
  },
  vehicleCardScroll: {
    width: 175,
  },
  bikeVehicleCard: {
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  bikeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F1F5F9',
    marginTop: 0,
    lineHeight: 20,
  },
  vehicleCardActive: {
    borderColor: '#00F2FE',
    borderWidth: 2.5,
    backgroundColor: '#111C2E',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 16,
    elevation: 12,
  },
  glassReflection: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  vehicleCardImageWrap: {
    width: '100%',
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  vehicleCardImage: {
    width: '100%',
    height: '100%',
  },
  vehicleCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neumorphTextSecondary,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  vehicleCardNameActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  fuelBadge: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    alignSelf: 'center',
  },
  fuelBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  // ─── Empty State ───
  emptyAddCard: {
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827',
    borderRadius: 18, padding: 40, gap: 10, borderWidth: 1, borderColor: 'rgba(0,242,254,0.2)',
    marginVertical: 10,
  },
  emptyAddText: { fontSize: 14, color: colors.neumorphTextSecondary, fontWeight: '600' },

  // ─── Selected Vehicle Telemetry ───
  telemetryCard: {
    backgroundColor: '#0D1324',
    borderRadius: 22,
    padding: 18,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
  },
  telemetryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  plateBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  plateText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.neonCyan,
    fontFamily: 'monospace',
    letterSpacing: 0.8,
  },
  makeYearText: {
    fontSize: 12,
    color: colors.neumorphTextSecondary,
    fontWeight: '600',
  },
  odometerRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  serviceBarWrap: {
    width: '100%',
    marginTop: 10,
  },
  serviceBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  serviceBarFill: {
    height: 6,
    borderRadius: 3,
  },
  serviceBarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  serviceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  serviceBarLabel: {
    fontSize: 11,
    color: colors.neumorphTextSecondary,
    fontWeight: '600',
  },
  serviceBarValue: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '800',
  },

  // ─── Section ───
  sectionTitle: {
    fontSize: 10, fontWeight: '800', color: colors.neumorphTextSecondary, letterSpacing: 1.4,
    marginTop: 18, marginBottom: 8, textTransform: 'uppercase',
  },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 18, marginBottom: 8,
  },
  seeAllText: { fontSize: 11, fontWeight: '700', color: colors.neonCyan },

  // ─── Fuel Insights ───
  fuelCard: {
    backgroundColor: '#0D1324', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  fuelCardInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  gaugeWrap: {
    width: 108, height: 108, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  gaugeCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  gaugeVal: {
    fontSize: 22, fontWeight: '900', color: colors.neonCyan,
    textShadowColor: 'rgba(0,242,254,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6,
  },
  gaugeSub: { fontSize: 9, fontWeight: '800', color: colors.neumorphTextSecondary, letterSpacing: 0.5 },
  fuelRightCol: { flex: 1, gap: 8 },
  fuelStatCard: {
    backgroundColor: '#0A0F1E', borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  liveLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fuelStatLabel: { fontSize: 9, fontWeight: '800', color: colors.neumorphTextMuted, letterSpacing: 0.8 },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.neonGreen },
  liveTag: {
    fontSize: 8, fontWeight: '900', color: colors.neonGreen, letterSpacing: 1,
    backgroundColor: 'rgba(0,230,118,0.12)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
  },
  fuelPriceValue: { fontSize: 18, fontWeight: '900', marginTop: 3 },
  fuelCityText: { fontSize: 9, color: colors.neumorphTextMuted, marginTop: 2, letterSpacing: 0.5 },
  fuelCostValue: { fontSize: 16, fontWeight: '900', color: '#F8FAFC', marginTop: 3 },

  // ─── Expense Breakdown ───
  expenseCard: {
    backgroundColor: '#0D1324', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  expenseCardInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  donutWrap: {
    width: 130, height: 130, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  donutCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutTotal: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  donutLabel: { fontSize: 9, fontWeight: '700', color: colors.neumorphTextMuted, marginTop: 1 },
  expenseRightCol: { flex: 1, gap: 4 },
  changeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    alignSelf: 'flex-start',
  },
  changeChipText: { fontSize: 10, fontWeight: '700' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: colors.neumorphTextSecondary, fontWeight: '600', flex: 1 },
  legendAmt: { fontSize: 10, fontWeight: '700', color: '#CBD5E1', marginRight: 4 },
  legendPct: { fontSize: 11, fontWeight: '800', color: '#F8FAFC', width: 30, textAlign: 'right' },
  noDataCol: { alignItems: 'center', gap: 6, paddingVertical: 10 },
  emptyHint: { fontSize: 11, color: colors.neumorphTextMuted, fontStyle: 'italic' },
  addFirstBtn: {
    marginTop: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
    backgroundColor: 'rgba(0, 242, 254, 0.1)', borderWidth: 1, borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  addFirstBtnText: { fontSize: 11, fontWeight: '700', color: colors.neonCyan },

  // ─── Reminders ───
  noRemindersCard: {
    backgroundColor: '#0D1324', borderRadius: 18, padding: 24, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(0, 230, 118, 0.15)',
  },
  noRemindersTitle: { fontSize: 15, fontWeight: '800', color: '#F8FAFC' },
  noRemindersSub: { fontSize: 12, color: colors.neumorphTextSecondary },
  remindersList: { gap: 8 },
  reminderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0D1324', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
  },
  reminderIconWrap: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  reminderBody: { flex: 1 },
  reminderTitle: { fontSize: 13, fontWeight: '700', color: '#F8FAFC' },
  reminderDate: { fontSize: 10, color: colors.neumorphTextSecondary, marginTop: 2 },
  urgencyBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  urgencyBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  // ─── Quick Actions ───
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickBtn: { alignItems: 'center', gap: 6 },
  quickOuter: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#111827',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 5,
  },
  quickInner: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 10, fontWeight: '700', color: colors.neumorphTextSecondary },
});
