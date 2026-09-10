import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { vehiclesApi } from '../../api/vehicles';
import { fuelApi } from '../../api/fuel';
import { confirmAction } from '../../utils/confirmAlert';
import Card from '../../components/Card';
import MetricCard from '../../components/MetricCard';
import ExpenseReportModal from '../../components/ExpenseReportModal';

import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

export default function VehicleDetailScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<any>(null);
  const [fuelSummary, setFuelSummary] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [vRes, fRes] = await Promise.all([
        vehiclesApi.getById(vehicleId),
        fuelApi.getSummary(vehicleId).catch(() => ({ data: null })),
      ]);
      setVehicle(vRes.data);
      setFuelSummary(fRes.data);
    } catch (e) {
      console.log(e);
    }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = () => {
    if (!vehicle) return;
    confirmAction(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.make} ${vehicle.model}? All associated records (fuel, expenses, services) will be permanently deleted.`,
      async () => {
        try {
          await vehiclesApi.delete(vehicleId);
          navigation.navigate('VehicleList');
        } catch (e: any) {
          Alert.alert('Error', e.response?.data?.message || 'Failed to delete vehicle');
        }
      }
    );
  };

  if (!vehicle) return null;

  const sections = [
    { key: 'Expenses & Monthly Chart', icon: 'wallet', color: colors.accent, screen: 'ExpenseList' },
    { key: 'Fuel Logs', icon: 'flame', color: colors.fuel, screen: 'FuelList' },
    { key: 'Services & Maintenance', icon: 'build', color: colors.service, screen: 'ServiceList' },
    { key: 'Repairs & Breakdowns', icon: 'hammer', color: colors.error, screen: 'RepairList' },
    { key: 'Spare Parts Inventory', icon: 'cube', color: colors.info, screen: 'PartList' },
    { key: 'Reminders & Schedules', icon: 'notifications', color: '#10B981', screen: 'ReminderList' },
    { key: 'Audit & Expense Report (PDF)', icon: 'document-text', color: colors.primary, isReport: true },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setReportModalVisible(true)}
              accessibilityLabel="Export PDF Report"
            >
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('AddVehicle', { vehicle })}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, styles.headerDeleteBtn]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error || '#EF4444'} />
            </TouchableOpacity>
          </View>
        </View>

        <Card style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="car-sport" size={32} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.heroName}>{vehicle.make} {vehicle.model}</Text>
          <Text style={styles.heroSub}>{vehicle.licensePlate} • {vehicle.year}</Text>
        </Card>

        <View style={styles.metricsGrid}>
          <MetricCard title="Odometer" value={`${vehicle.currentOdometer?.toLocaleString()} KM`} icon="speedometer" highlight />
          <MetricCard title="Avg Mileage" value={fuelSummary?.latestAvgKmpl ? `${fuelSummary.latestAvgKmpl} KM/L` : '—'} icon="analytics" iconColor={colors.info} />
          <MetricCard title="Fuel Cost" value={fuelSummary?.totalCost ? `₹${Math.round(fuelSummary.totalCost).toLocaleString()}` : '₹0'} icon="flame" iconColor={colors.fuel} />
          <MetricCard title="Total Liters" value={fuelSummary?.totalLiters ? `${fuelSummary.totalLiters.toFixed(1)} L` : '0 L'} icon="water" iconColor={colors.accent} />
        </View>

        <Text style={styles.sectionTitle}>Records & Management</Text>
        <View style={styles.sectionsGrid}>
          {sections.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={styles.sectionBtn}
              onPress={() => {
                if ((s as any).isReport) {
                  setReportModalVisible(true);
                } else {
                  navigation.navigate(s.screen, { vehicleId });
                }
              }}
            >
              <View style={[styles.sectionIcon, { backgroundColor: s.color + '15' }]}>
                <Ionicons name={s.icon as any} size={22} color={s.color} />
              </View>
              <Text style={styles.sectionLabel}>{s.key}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Bottom Delete Button ─── */}
        <TouchableOpacity
          style={styles.bottomDeleteBtn}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error || '#EF4444'} />
          <Text style={styles.bottomDeleteText}>Delete This Vehicle</Text>
        </TouchableOpacity>
      </ScrollView>

      <ExpenseReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        defaultVehicleId={vehicleId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.base, paddingBottom: spacing.xxl * 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  backBtn: { padding: spacing.xs },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDeleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  heroCard: { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.base, backgroundColor: colors.primary, borderRadius: borderRadius.lg },
  heroIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heroName: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textOnPrimary },
  heroSub: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginTop: spacing.xs, marginBottom: spacing.sm },
  sectionsGrid: { gap: spacing.sm },
  sectionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.base, borderRadius: borderRadius.md, gap: spacing.md, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  sectionIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { flex: 1, fontSize: fontSize.base, fontWeight: '600', color: colors.text },
  bottomDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.xl,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  bottomDeleteText: {
    color: colors.error || '#EF4444',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
