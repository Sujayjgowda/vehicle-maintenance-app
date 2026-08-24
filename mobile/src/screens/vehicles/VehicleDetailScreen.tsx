import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { vehiclesApi } from '../../api/vehicles';
import { fuelApi } from '../../api/fuel';
import Card from '../../components/Card';
import MetricCard from '../../components/MetricCard';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

const sections = [
  { key: 'Fuel', icon: 'flame' as const, screen: 'FuelList', color: colors.fuel },
  { key: 'Services', icon: 'build' as const, screen: 'ServiceList', color: colors.service },
  { key: 'Expenses', icon: 'wallet' as const, screen: 'ExpenseList', color: colors.accent },
  { key: 'Parts', icon: 'cog' as const, screen: 'PartList', color: colors.primary },
  { key: 'Repairs', icon: 'hammer' as const, screen: 'RepairList', color: colors.error },
  { key: 'Reminders', icon: 'notifications' as const, screen: 'ReminderList', color: colors.warning },
];

export default function VehicleDetailScreen({ route, navigation }: any) {
  const { vehicleId } = route?.params || {};
  const [vehicle, setVehicle] = useState<any>(null);
  const [fuelSummary, setFuelSummary] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!vehicleId) return;
    try {
      const [vRes, fRes] = await Promise.all([
        vehiclesApi.getById(vehicleId),
        fuelApi.getSummary(vehicleId),
      ]);
      setVehicle(vRes.data);
      setFuelSummary(fRes.data);
    } catch (e) { console.log(e); }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = () => {
    Alert.alert('Delete Vehicle', 'This will delete the vehicle and all its records. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await vehiclesApi.delete(vehicleId); navigation.goBack(); } catch (e) { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  };

  if (!vehicle) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </TouchableOpacity>
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

        <Text style={styles.sectionTitle}>Records</Text>
        <View style={styles.sectionsGrid}>
          {sections.map((s) => (
            <TouchableOpacity key={s.key} style={styles.sectionBtn} onPress={() => navigation.navigate(s.screen, { vehicleId })}>
              <View style={[styles.sectionIcon, { backgroundColor: s.color + '15' }]}>
                <Ionicons name={s.icon} size={22} color={s.color} />
              </View>
              <Text style={styles.sectionLabel}>{s.key}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.base, paddingBottom: spacing.xxl * 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  backBtn: { padding: spacing.xs },
  heroCard: { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.base, backgroundColor: colors.primary, borderRadius: borderRadius.lg },
  heroIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heroName: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textOnPrimary },
  heroSub: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: spacing.md },
  sectionsGrid: { gap: spacing.sm },
  sectionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.base, borderRadius: borderRadius.md, gap: spacing.md, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  sectionIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { flex: 1, fontSize: fontSize.base, fontWeight: '600', color: colors.text },
});
