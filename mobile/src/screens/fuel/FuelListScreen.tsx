import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fuelApi } from '../../api/fuel';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

export default function FuelListScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        fuelApi.getAll(vehicleId),
        fuelApi.getSummary(vehicleId),
      ]);
      setRecords(rRes.data);
      setSummary(sRes.data);
    } catch (e) {
      console.log(e);
    }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleEdit = (record: any) => {
    navigation.navigate('AddFuel', { vehicleId, record });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Fuel Record', 'Are you sure you want to delete this fuel record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fuelApi.delete(vehicleId, id);
            load();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete fuel record');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.title}>Fuel Records</Text>
          <Text style={styles.subTitle}>Tap any record to edit details</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddFuel', { vehicleId })}
        >
          <Ionicons name="add" size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>₹{Math.round(summary.totalCost).toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Cost</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{summary.totalLiters?.toFixed(1)}L</Text>
            <Text style={styles.summaryLabel}>Total Fuel</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{summary.latestAvgKmpl ? `${summary.latestAvgKmpl}` : '—'}</Text>
            <Text style={styles.summaryLabel}>KM/L</Text>
          </View>
        </View>
      )}

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="flame-outline"
            title="No fuel records"
            subtitle="Tap + to log your first fill-up"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.8} onPress={() => handleEdit(item)}>
            <Card style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <Ionicons name="flame" size={20} color={colors.fuel} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString()}</Text>
                  <Text style={styles.cardSub}>
                    {item.liters} L • {item.odometerReading.toLocaleString()} KM
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardCost}>₹{item.cost.toLocaleString()}</Text>
                  {item.averageKmpl ? (
                    <Text style={styles.cardKmpl}>{item.averageKmpl} KM/L</Text>
                  ) : (
                    <Text style={styles.cardRate}>
                      ₹{(item.cost / item.liters).toFixed(2)}/L
                    </Text>
                  )}
                </View>
              </View>

              {/* Action row: Edit & Delete buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionEditBtn} onPress={() => handleEdit(item)}>
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                  <Text style={styles.actionEditText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionDeleteBtn} onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  subTitle: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textOnPrimary },
  summaryLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  list: { padding: spacing.base, paddingTop: 0, paddingBottom: 100 },
  card: { marginBottom: spacing.sm, padding: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.fuel + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDate: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  cardCost: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  cardKmpl: { fontSize: fontSize.xs, color: colors.success, marginTop: 2, fontWeight: '700' },
  cardRate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
  },
  actionEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary + '12',
    borderRadius: borderRadius.sm,
  },
  actionEditText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  actionDeleteBtn: {
    padding: 4,
  },
});
