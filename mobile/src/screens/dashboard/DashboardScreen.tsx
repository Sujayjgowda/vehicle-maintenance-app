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
            <Text style={styles.subtitle}>Your vehicle overview</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('ProfileTab')}>
            <Ionicons name="person-circle" size={36} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {v ? (
          <>
            <TouchableOpacity style={styles.vehicleBanner} onPress={() => navigation.navigate('VehiclesTab', { screen: 'VehicleDetail', params: { vehicleId: v.id } })}>
              <View style={styles.vehicleIcon}>
                <Ionicons name="car-sport" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>{v.make} {v.model}</Text>
                <Text style={styles.vehiclePlate}>{v.licensePlate} • {v.year}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

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

        {vehicles.length > 1 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Your Vehicles</Text>
            {vehicles.map((veh: any) => (
              <TouchableOpacity
                key={veh.id}
                style={styles.vehicleItem}
                onPress={() => navigation.navigate('VehiclesTab', { screen: 'VehicleDetail', params: { vehicleId: veh.id } })}
              >
                <Ionicons name="car" size={20} color={colors.primary} />
                <Text style={styles.vehicleItemText}>{veh.make} {veh.model} — {veh.licensePlate}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.base, paddingBottom: spacing.xxl * 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  profileBtn: { padding: spacing.xs },
  vehicleBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base, marginBottom: spacing.base, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  vehicleIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  vehicleName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  vehiclePlate: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  seeAll: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
  reminderCard: { marginBottom: spacing.sm },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reminderIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  reminderTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  reminderSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.md },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.base },
  addBtnText: { color: colors.textOnPrimary, fontWeight: '600', fontSize: fontSize.md },
  noData: { textAlign: 'center', color: colors.textSecondary, fontSize: fontSize.md, paddingVertical: spacing.sm },
  vehicleItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, padding: spacing.base, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  vehicleItemText: { flex: 1, fontSize: fontSize.md, color: colors.text, fontWeight: '500' },
});
