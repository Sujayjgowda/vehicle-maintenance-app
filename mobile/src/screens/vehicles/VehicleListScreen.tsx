import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { vehiclesApi } from '../../api/vehicles';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

export default function VehicleListScreen({ navigation }: any) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await vehiclesApi.getAll();
      setVehicles(res.data);
    } catch (e) { console.log(e); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = (v: any) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${v.make} ${v.model}? All associated records (fuel, expenses, services) will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await vehiclesApi.delete(v.id);
              load();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || 'Failed to delete vehicle');
            }
          },
        },
      ]
    );
  };

  const renderVehicle = ({ item }: any) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="car-sport" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.make} {item.model}</Text>
            <Text style={styles.sub}>{item.licensePlate} • {item.year}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{item.currentOdometer?.toLocaleString()}</Text>
            <Text style={styles.statLabel}>KM</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{item._count?.fuelRecords || 0}</Text>
            <Text style={styles.statLabel}>Fill-ups</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{item._count?.serviceRecords || 0}</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{item._count?.reminders || 0}</Text>
            <Text style={styles.statLabel}>Reminders</Text>
          </View>
        </View>

        {/* ─── Edit & Delete Card Actions ─── */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('AddVehicle', { vehicle: item });
            }}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.cardActionText}>Edit Vehicle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cardActionBtn, styles.cardActionDeleteBtn]}
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error || '#EF4444'} />
            <Text style={[styles.cardActionText, { color: colors.error || '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Vehicles</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddVehicle')}>
          <Ionicons name="add" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderVehicle}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="car-outline" title="No vehicles yet" subtitle="Tap + to add your first vehicle" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.base, paddingTop: 0, paddingBottom: 100 },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginTop: spacing.base, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: fontSize.base, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '10',
  },
  cardActionDeleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  cardActionText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
});
