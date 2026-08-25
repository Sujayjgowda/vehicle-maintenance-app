import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { vehiclesApi } from '../../api/vehicles';
import { fuelApi } from '../../api/fuel';
import { remindersApi } from '../../api/resources';
import MetricCard from '../../components/MetricCard';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import VehicleHealthAiCard from '../../components/VehicleHealthAiCard';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [fuelSummary, setFuelSummary] = useState<any>(null);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const vRes = await vehiclesApi.getAll();
      setVehicles(vRes.data);
      const vehicle = vRes.data[0];
      if (vehicle) {
        setSelectedVehicle(vehicle);
        const fRes = await fuelApi.getSummary(vehicle.id);
        setFuelSummary(fRes.data);
      }
      const rRes = await remindersApi.getUpcoming();
      setUpcomingReminders(rRes.data);
    } catch (e) {
      console.log('Dashboard load error:', e);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const v = selectedVehicle;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'User'} 👋</Text>
            <Text style={styles.subtitle}>Garage Grid • Fleet & Expense Overview</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('ProfileTab')}>
            <Ionicons name="person-circle" size={36} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {v ? (
          <>
            <TouchableOpacity
              style={styles.vehicleBanner}
              onPress={() =>
                navigation.navigate('VehiclesTab', { screen: 'VehicleDetail', params: { vehicleId: v.id } })
              }
            >
              <View style={styles.vehicleIcon}>
                <Ionicons name="car-sport" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>{v.make} {v.model}</Text>
                <Text style={styles.vehiclePlate}>{v.licensePlate} • {v.year}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Garage Grid AI Health Predictor Card */}
            <VehicleHealthAiCard
              vehicle={v}
              onOpenAiMechanic={() =>
                navigation.navigate('VehiclesTab', { screen: 'AiMechanic', params: { vehicle: v } })
              }
            />

            <View style={styles.metricsGrid}>
              <MetricCard title="Odometer" value={`${v.currentOdometer?.toLocaleString()} KM`} icon="speedometer" highlight />
              <MetricCard title="Avg Mileage" value={fuelSummary?.latestAvgKmpl ? `${fuelSummary.latestAvgKmpl} KM/L` : '—'} icon="analytics" iconColor={colors.info} />
              <MetricCard title="Fuel Expense" value={fuelSummary?.totalCost ? `₹${fuelSummary.totalCost.toLocaleString()}` : '₹0'} icon="flame" iconColor={colors.fuel} />
              <MetricCard title="Fill-ups" value={fuelSummary?.totalRecords?.toString() || '0'} icon="water" iconColor={colors.accent} />
            </View>
          </>
        ) : (
          <Card style={styles.emptyCard}>
            <Ionicons name="car-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No vehicles yet</Text>
            <Text style={styles.emptySubtitle}>Add your first vehicle to get started</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('VehiclesTab', { screen: 'AddVehicle' })}>
              <Ionicons name="add" size={20} color={colors.textOnPrimary} />
              <Text style={styles.addBtnText}>Add Vehicle</Text>
            </TouchableOpacity>
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RemindersTab')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {upcomingReminders.length === 0 ? (
          <Card>
            <Text style={styles.noData}>No upcoming reminders 🎉</Text>
          </Card>
        ) : (
          upcomingReminders.slice(0, 5).map((r: any) => (
            <Card key={r.id} style={styles.reminderCard}>
              <View style={styles.reminderRow}>
                <View style={styles.reminderIcon}>
                  <Ionicons
                    name={r.type === 'SERVICE' ? 'build' : r.type === 'INSURANCE' ? 'shield-checkmark' : r.type === 'PUC' ? 'document-text' : 'cog'}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderTitle}>{r.title || r.type}</Text>
                  <Text style={styles.reminderSub}>
                    {r.vehicle?.make} {r.vehicle?.model} • {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : `${r.dueKm} KM`}
                  </Text>
                </View>
                <Badge text={r.status} variant={r.status === 'OVERDUE' ? 'error' : 'warning'} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.base, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  profileBtn: { padding: 4 },
  vehicleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  vehicleName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  vehiclePlate: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  seeAll: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  emptyCard: { alignItems: 'center', padding: spacing.xl, marginVertical: spacing.lg },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  addBtnText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: fontSize.sm },
  reminderCard: { marginBottom: spacing.sm, padding: spacing.md },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reminderIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  reminderTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  reminderSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  noData: { textAlign: 'center', color: colors.textSecondary, padding: spacing.md, fontSize: fontSize.sm },
});
