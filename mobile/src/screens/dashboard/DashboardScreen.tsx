import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, G } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { vehiclesApi } from '../../api/vehicles';
import { fuelApi } from '../../api/fuel';
import { expensesApi, remindersApi } from '../../api/resources';
import { getLiveCityPrice, CityPrice } from '../../api/liveFuelService';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VEHICLE_CARD_WIDTH = SCREEN_WIDTH - 64;

// ─── Category config for donut chart ───
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

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [allFuelSummaries, setAllFuelSummaries] = useState<any[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);
  const [livePrices, setLivePrices] = useState<CityPrice | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for live indicator
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

  const loadData = useCallback(async () => {
    try {
      const vRes = await vehiclesApi.getAll();
      const vehicleList = vRes.data || [];
      setVehicles(vehicleList);

      // Fetch expenses and fuel summaries for ALL vehicles
      const expensePromises = vehicleList.map((v: any) =>
        expensesApi.getAll(v.id).then((r: any) => r.data || []).catch(() => [])
      );
      const fuelPromises = vehicleList.map((v: any) =>
        fuelApi.getSummary(v.id).then((r: any) => r.data).catch(() => null)
      );

      const [allExp, allFuel] = await Promise.all([
        Promise.all(expensePromises),
        Promise.all(fuelPromises),
      ]);

      // Flatten all expenses from all vehicles
      setAllExpenses(allExp.flat());
      setAllFuelSummaries(allFuel.filter(Boolean));

      const rRes = await remindersApi.getUpcoming();
      setUpcomingReminders(rRes.data || []);
    } catch (e) {
      console.log('Dashboard load error:', e);
    }
  }, []);

  // Fetch live fuel prices
  useEffect(() => {
    getLiveCityPrice('Bengaluru')
      .then(setLivePrices)
      .catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    getLiveCityPrice('Bengaluru').then(setLivePrices).catch(() => {});
    setRefreshing(false);
  };

  // ─── Expense calculations (ALL vehicles combined) ───
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

  const thisMonthExpenses = allExpenses.filter((e) => {
    const d = new Date(e.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentMonth;
  });
  const prevMonthExpenses = allExpenses.filter((e) => {
    const d = new Date(e.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === prevMonth;
  });

  const thisMonthTotal = thisMonthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const prevMonthTotal = prevMonthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const pctChange = prevMonthTotal > 0 ? ((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0;

  // Category breakdown for donut (ALL vehicles)
  const catMap: Record<string, number> = {};
  for (const e of thisMonthExpenses) {
    const cat = e.category || 'OTHER';
    catMap[cat] = (catMap[cat] || 0) + (Number(e.amount) || 0);
  }
  const categorySlices = Object.entries(catMap)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      pct: thisMonthTotal > 0 ? (amount / thisMonthTotal) * 100 : 0,
      color: CATEGORY_COLORS[cat]?.color || '#64748B',
      label: CATEGORY_COLORS[cat]?.label || cat,
      icon: CATEGORY_COLORS[cat]?.icon || 'receipt',
    }))
    .sort((a, b) => b.amount - a.amount);

  // SVG donut slices
  const donutRadius = 50;
  const donutStroke = 14;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accAngle = 0;
  const donutSlices = categorySlices.map((s) => {
    const len = (s.pct / 100) * donutCircumference;
    const offset = -accAngle;
    accAngle += len;
    return { ...s, dasharray: `${len} ${donutCircumference - len}`, dashoffset: offset };
  });

  // Average mileage across ALL vehicles
  const validFuelSummaries = allFuelSummaries.filter((f) => f?.latestAvgKmpl && f.latestAvgKmpl > 0);
  const avgMileage = validFuelSummaries.length > 0
    ? validFuelSummaries.reduce((sum, f) => sum + f.latestAvgKmpl, 0) / validFuelSummaries.length
    : 0;

  const maxMileage = 40;
  const mileagePct = Math.min((avgMileage / maxMileage) * 100, 100);
  const mileageRadius = 38;
  const mileageStroke = 8;
  const mileageCirc = 2 * Math.PI * mileageRadius;
  const mileageDash = (mileagePct / 100) * mileageCirc;

  // Total cost per km across all vehicles
  const totalCost = allFuelSummaries.reduce((s, f) => s + (f?.totalCost || 0), 0);
  const totalLiters = allFuelSummaries.reduce((s, f) => s + (f?.totalLiters || 0), 0);
  const costPerKm = totalCost > 0 && totalLiters > 0 && avgMileage > 0
    ? (totalCost / (totalLiters * avgMileage))
    : 0;

  const selectedVehicle = vehicles[selectedIdx] || vehicles[0] || null;

  // Format current date
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── GREETING HEADER ─── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'User'} 👋</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('ProfileTab')}>
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={18} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── VEHICLE QUICK SWITCHER ─── */}
        <Text style={styles.sectionLabel}>YOUR VEHICLES</Text>
        {vehicles.length > 0 ? (
          <>
            <FlatList
              data={vehicles}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / VEHICLE_CARD_WIDTH);
                setSelectedIdx(idx);
              }}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.vehicleCard, { width: VEHICLE_CARD_WIDTH }]}
                  onPress={() => navigation.navigate('VehiclesTab', { screen: 'VehicleDetail', params: { vehicleId: item.id } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.vehicleIconWrap}>
                    <Ionicons name="bicycle" size={26} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.vehicleName}>{item.make}  {item.model}</Text>
                    <Text style={styles.vehicleSub}>{item.licensePlate} • {item.year}</Text>
                    <View style={styles.odoRow}>
                      <Ionicons name="speedometer-outline" size={12} color={colors.primary} />
                      <Text style={styles.odoText}>{item.currentOdometer?.toLocaleString()} KM</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.neumorphTextMuted} />
                </TouchableOpacity>
              )}
            />
            {vehicles.length > 1 && (
              <View style={styles.dotRow}>
                {vehicles.map((_, i) => (
                  <View key={i} style={[styles.dot, i === selectedIdx && styles.dotActive]} />
                ))}
              </View>
            )}
          </>
        ) : (
          <TouchableOpacity
            style={styles.emptyVehicleCard}
            onPress={() => navigation.navigate('VehiclesTab', { screen: 'AddVehicle' })}
          >
            <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
            <Text style={styles.emptyText}>Add your first vehicle</Text>
          </TouchableOpacity>
        )}

        {/* ─── EXPENSE OVERVIEW (ALL VEHICLES COMBINED) ─── */}
        <Text style={styles.sectionLabel}>EXPENSE OVERVIEW</Text>
        <View style={styles.neoCard}>
          <View style={styles.expenseHeaderRow}>
            <View>
              <Text style={styles.expensePeriod}>This Month</Text>
              <Text style={styles.expenseTotal}>₹{Math.round(thisMonthTotal).toLocaleString()}</Text>
              {prevMonthTotal > 0 && (
                <View style={styles.changeRow}>
                  <Ionicons
                    name={pctChange >= 0 ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={pctChange >= 0 ? colors.error : colors.success}
                  />
                  <Text style={[styles.changeText, { color: pctChange >= 0 ? colors.error : colors.success }]}>
                    {Math.abs(pctChange).toFixed(1)}% from last month
                  </Text>
                </View>
              )}
            </View>
            {/* Mini Donut */}
            <View style={styles.miniDonutWrap}>
              <Svg width={120} height={120} viewBox="0 0 120 120">
                <G rotation="-90" origin="60, 60">
                  <Circle cx={60} cy={60} r={donutRadius} stroke={colors.neumorphLight} strokeWidth={donutStroke} fill="transparent" />
                  {thisMonthTotal > 0 && donutSlices.map((sl) => (
                    <Circle
                      key={sl.category}
                      cx={60} cy={60} r={donutRadius}
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
              <View style={styles.miniDonutCenter}>
                <Ionicons name="wallet" size={16} color={colors.primary} />
              </View>
            </View>
          </View>
          {/* Category legend */}
          {categorySlices.length > 0 && (
            <View style={styles.legendGrid}>
              {categorySlices.slice(0, 4).map((sl) => (
                <View key={sl.category} style={styles.legendChip}>
                  <View style={[styles.legendDot, { backgroundColor: sl.color }]} />
                  <Text style={styles.legendText}>{sl.label}</Text>
                  <Text style={styles.legendPct}>{sl.pct.toFixed(0)}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── FUEL INSIGHTS (ALL VEHICLES) ─── */}
        <Text style={styles.sectionLabel}>FUEL INSIGHTS</Text>
        <View style={styles.neoCard}>
          <View style={styles.fuelRow}>
            {/* Mileage Gauge */}
            <View style={styles.gaugeWrap}>
              <Svg width={96} height={96} viewBox="0 0 96 96">
                <G rotation="-90" origin="48, 48">
                  <Circle cx={48} cy={48} r={mileageRadius} stroke={colors.neumorphLight} strokeWidth={mileageStroke} fill="transparent" />
                  <Circle
                    cx={48} cy={48} r={mileageRadius}
                    stroke={colors.primary}
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

            {/* Cost per KM + Live Fuel */}
            <View style={styles.fuelStatCol}>
              <View style={styles.fuelStatBox}>
                <Text style={styles.fuelStatLabel}>Cost per KM</Text>
                <Text style={styles.fuelStatValue}>₹{costPerKm > 0 ? costPerKm.toFixed(2) : '—'}</Text>
              </View>
              <View style={styles.fuelStatBox}>
                <View style={styles.liveRow}>
                  <Text style={styles.fuelStatLabel}>Live Fuel Price</Text>
                  <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                </View>
                <View style={styles.livePriceRow}>
                  <Ionicons name="flame" size={14} color="#F97316" />
                  <Text style={styles.livePriceText}>
                    ₹{livePrices?.petrol?.toFixed(2) || '—'}
                  </Text>
                </View>
                <Text style={styles.livePriceSub}>Petrol • Bengaluru</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── UPCOMING REMINDERS ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>UPCOMING REMINDERS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RemindersTab')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {upcomingReminders.length === 0 ? (
          <View style={styles.neoCardSmall}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.noRemindersText}>No upcoming reminders 🎉</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}>
            {upcomingReminders.slice(0, 5).map((r: any) => {
              const dueDate = r.dueDate ? new Date(r.dueDate) : null;
              const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
              const urgencyColor = daysLeft !== null && daysLeft <= 7 ? colors.error : daysLeft !== null && daysLeft <= 30 ? colors.warning : colors.success;
              const iconName = r.type === 'SERVICE' ? 'build' : r.type === 'INSURANCE' ? 'shield-checkmark' : r.type === 'PUC' ? 'document-text' : 'notifications';

              return (
                <View key={r.id} style={styles.reminderChip}>
                  <View style={[styles.reminderIconWrap, { backgroundColor: urgencyColor + '20' }]}>
                    <Ionicons name={iconName as any} size={18} color={urgencyColor} />
                  </View>
                  <Text style={styles.reminderTitle} numberOfLines={1}>{r.title || r.type}</Text>
                  {daysLeft !== null && (
                    <Text style={[styles.reminderDays, { color: urgencyColor }]}>
                      {daysLeft > 0 ? `${daysLeft} days` : 'Overdue'}
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* ─── QUICK ACTIONS (Matching design mockup exactly) ─── */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>QUICK ACTIONS</Text>
        <View style={styles.quickActionsRow}>
          {[
            {
              icon: 'flame' as const,
              label: 'Add Fuel',
              bgColor: '#1C2A3A',
              iconColor: '#F97316',
              onPress: () => selectedVehicle && navigation.navigate('VehiclesTab', { screen: 'AddFuel', params: { vehicleId: selectedVehicle.id } }),
            },
            {
              icon: 'wallet' as const,
              label: 'Add Expense',
              bgColor: '#1C2A3A',
              iconColor: '#8B5CF6',
              onPress: () => selectedVehicle && navigation.navigate('VehiclesTab', { screen: 'AddExpense', params: { vehicleId: selectedVehicle.id } }),
            },
            {
              icon: 'build' as const,
              label: 'Add Service',
              bgColor: '#1C2A3A',
              iconColor: '#3B82F6',
              onPress: () => selectedVehicle && navigation.navigate('VehiclesTab', { screen: 'AddService', params: { vehicleId: selectedVehicle.id } }),
            },
            {
              icon: 'notifications' as const,
              label: 'Reminder',
              bgColor: '#1C2A3A',
              iconColor: '#10B981',
              onPress: () => selectedVehicle && navigation.navigate('VehiclesTab', { screen: 'AddReminder', params: { vehicleId: selectedVehicle.id } }),
            },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickActionBtn}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionCircle, { backgroundColor: action.bgColor }]}>
                <View style={[styles.quickActionInnerGlow, { backgroundColor: action.iconColor + '20' }]}>
                  <Ionicons name={action.icon} size={24} color={action.iconColor} />
                </View>
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────── STYLES ───────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.neumorphBg,
  },
  container: {
    padding: spacing.base,
  },

  // ─── Header ───
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.neumorphTextPrimary,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.neumorphTextSecondary,
    marginTop: 2,
  },
  profileBtn: {
    padding: 4,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neumorphLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neumorphBorder,
  },

  // ─── Section Labels ───
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.neumorphTextSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  seeAllText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },

  // ─── Vehicle Card ───
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neumorphSurface,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neumorphBorder,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  vehicleIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.neumorphBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neumorphBorder,
  },
  vehicleName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.neumorphTextPrimary,
  },
  vehicleSub: {
    fontSize: fontSize.xs,
    color: colors.neumorphTextSecondary,
    marginTop: 2,
  },
  odoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  odoText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neumorphTextMuted,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 18,
    borderRadius: 3,
  },
  emptyVehicleCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neumorphSurface,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neumorphBorder,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.neumorphTextSecondary,
    fontWeight: '600',
  },

  // ─── Neo Card ───
  neoCard: {
    backgroundColor: colors.neumorphSurface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.neumorphBorder,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: spacing.xs,
  },
  neoCardSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neumorphSurface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.neumorphBorder,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },

  // ─── Expense Overview ───
  expenseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expensePeriod: {
    fontSize: fontSize.xs,
    color: colors.neumorphTextSecondary,
    fontWeight: '600',
  },
  expenseTotal: {
    fontSize: fontSize.hero,
    fontWeight: '900',
    color: colors.neumorphTextPrimary,
    marginTop: 4,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  changeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  miniDonutWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  miniDonutCenter: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.neumorphSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neumorphBg,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: colors.neumorphTextSecondary,
    fontWeight: '600',
  },
  legendPct: {
    fontSize: 10,
    color: colors.neumorphTextPrimary,
    fontWeight: '700',
  },

  // ─── Fuel Insights ───
  fuelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  gaugeWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeVal: {
    fontSize: fontSize.lg,
    fontWeight: '900',
    color: colors.primary,
  },
  gaugeSub: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.neumorphTextSecondary,
    letterSpacing: 0.5,
  },
  fuelStatCol: {
    flex: 1,
    gap: spacing.sm,
  },
  fuelStatBox: {
    backgroundColor: colors.neumorphBg,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neumorphBorder,
  },
  fuelStatLabel: {
    fontSize: 10,
    color: colors.neumorphTextSecondary,
    fontWeight: '600',
  },
  fuelStatValue: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.neumorphTextPrimary,
    marginTop: 2,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  livePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  livePriceText: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: '#F97316',
  },
  livePriceSub: {
    fontSize: 9,
    color: colors.neumorphTextMuted,
    marginTop: 2,
  },

  // ─── Reminders Strip ───
  reminderChip: {
    backgroundColor: colors.neumorphSurface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neumorphBorder,
    minWidth: 150,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.neumorphTextPrimary,
    maxWidth: 120,
  },
  reminderDays: {
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  noRemindersText: {
    fontSize: fontSize.sm,
    color: colors.neumorphTextSecondary,
  },

  // ─── Quick Actions (matching design mockup) ───
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionBtn: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neumorphBorder,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  quickActionInnerGlow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neumorphTextSecondary,
  },
});
