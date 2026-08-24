import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { expensesApi } from '../../api/resources';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

const categoryInfo: Record<string, { label: string; icon: any; color: string }> = {
  FUEL: { label: 'Fuel', icon: 'flame', color: colors.fuel },
  SERVICE: { label: 'Service', icon: 'build', color: colors.service },
  REPAIR: { label: 'Repair', icon: 'hammer', color: colors.error },
  TOLL: { label: 'Toll', icon: 'navigate-circle', color: '#0D9488' },
  PARKING: { label: 'Parking', icon: 'car', color: '#6366F1' },
  INSURANCE: { label: 'Insurance', icon: 'shield-checkmark', color: '#10B981' },
  OTHER: { label: 'Other', icon: 'receipt', color: colors.other },
};

const filterTabs = ['ALL', 'TOLL', 'PARKING', 'FUEL', 'SERVICE', 'REPAIR', 'INSURANCE', 'OTHER'];

export default function ExpenseListScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [eRes, sRes] = await Promise.all([
        expensesApi.getAll(vehicleId),
        expensesApi.getSummary(vehicleId),
      ]);
      setExpenses(eRes.data);
      setSummary(sRes.data);
    } catch (e) {
      console.log(e);
    }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filteredExpenses = useMemo(() => {
    if (selectedFilter === 'ALL') return expenses;
    return expenses.filter((e) => e.category === selectedFilter);
  }, [expenses, selectedFilter]);

  const handleEdit = (record: any) => {
    navigation.navigate('AddExpense', { vehicleId, record });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await expensesApi.delete(vehicleId, id);
            load();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete expense');
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
          <Text style={styles.title}>Expenses & Costs</Text>
          <Text style={styles.subTitle}>Auto-synced from all logs & custom entries</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddExpense', { vehicleId })}
        >
          <Ionicons name="add" size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.summaryBanner}>
          <Text style={styles.summaryTotal}>₹{Math.round(summary.totalExpenses).toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>
            Total All Expenses • {summary.count} records (Fuel + Services + Tolls + Repairs)
          </Text>
        </View>
      )}

      {/* Category Filter Horizontal Scroll */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab;
            const tabInfo = categoryInfo[tab];
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                  isActive && tabInfo && { backgroundColor: tabInfo.color, borderColor: tabInfo.color },
                ]}
                onPress={() => setSelectedFilter(tab)}
              >
                {tabInfo ? (
                  <Ionicons
                    name={tabInfo.icon}
                    size={14}
                    color={isActive ? '#FFF' : tabInfo.color}
                    style={{ marginRight: 4 }}
                  />
                ) : null}
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {tab === 'ALL' ? 'All Costs' : tabInfo?.label || tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="wallet-outline"
            title="No expenses found"
            subtitle={
              selectedFilter === 'ALL'
                ? 'Fill fuel, log services, or tap + to add parking/toll'
                : `No expenses under ${selectedFilter}. Tap + to add.`
            }
          />
        }
        renderItem={({ item }) => {
          const cat = categoryInfo[item.category] || {
            label: item.category,
            icon: 'wallet',
            color: colors.other,
          };
          const isAutoSynced = item.sourceType && item.sourceType !== 'MANUAL';

          return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => handleEdit(item)}>
              <Card style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={[styles.cardIcon, { backgroundColor: cat.color + '15' }]}>
                    <Ionicons name={cat.icon} size={20} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.cardTitle}>{cat.label}</Text>
                      {isAutoSynced && (
                        <View style={styles.autoSyncBadge}>
                          <Text style={styles.autoSyncText}>Auto-synced</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardSub}>{new Date(item.date).toLocaleDateString()}</Text>
                    {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
                  </View>
                  <Text style={styles.cardCost}>₹{item.amount.toLocaleString()}</Text>
                </View>

                {/* Action row: Edit & Delete */}
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
          );
        }}
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
  summaryBanner: {
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.base,
  },
  summaryTotal: { fontSize: fontSize.xxl, fontWeight: '800', color: '#FFF' },
  summaryLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.85)', marginTop: 2, textAlign: 'center' },
  filterContainer: {
    marginBottom: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFF',
  },
  list: { padding: spacing.base, paddingTop: 0, paddingBottom: 100 },
  card: { marginBottom: spacing.sm, padding: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  cardNotes: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  cardCost: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  autoSyncBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '15',
  },
  autoSyncText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
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
