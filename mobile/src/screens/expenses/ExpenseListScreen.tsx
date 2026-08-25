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
import MonthlyExpenseDonutChart, { CATEGORY_CONFIG } from '../../components/MonthlyExpenseDonutChart';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

const filterTabs = ['ALL', 'FUEL', 'SERVICE', 'REPAIR', 'TOLL', 'PARKING', 'INSURANCE', 'PARTS', 'OTHER'];

export default function ExpenseListScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState('ALL');
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

  // Filter expenses by selected Month AND selected Category Filter
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Month match
      if (selectedMonth !== 'ALL') {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key !== selectedMonth) return false;
      }
      // Category match
      if (selectedFilter !== 'ALL') {
        if (e.category !== selectedFilter) return false;
      }
      return true;
    });
  }, [expenses, selectedMonth, selectedFilter]);

  const handleEdit = (record: any) => {
    navigation.navigate('AddExpense', { vehicleId, record });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense record?', [
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
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.title}>Garage Grid Expenses</Text>
          <Text style={styles.subTitle}>Monthly Breakdown & Auto-Synced Costs</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddExpense', { vehicleId })}
        >
          <Ionicons name="add" size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            {/* 1. Monthly Expense Donut Chart & Breakdown */}
            <MonthlyExpenseDonutChart
              expenses={expenses}
              selectedMonth={selectedMonth}
              onSelectMonth={(m) => {
                setSelectedMonth(m);
              }}
              onSelectCategory={(cat) => {
                setSelectedFilter(cat);
              }}
              selectedCategory={selectedFilter}
            />

            {/* 2. Category Filter Strip */}
            <View style={styles.filterContainer}>
              <View style={styles.filterHeaderRow}>
                <Text style={styles.sectionHeader}>FILTER EXPENSES</Text>
                {selectedFilter !== 'ALL' && (
                  <TouchableOpacity onPress={() => setSelectedFilter('ALL')}>
                    <Text style={styles.resetFilterText}>Reset Filter</Text>
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {filterTabs.map((tab) => {
                  const isActive = selectedFilter === tab;
                  const tabInfo = CATEGORY_CONFIG[tab];
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
                          size={13}
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

            <View style={styles.recordsHeaderRow}>
              <Text style={styles.recordsCountLabel}>
                {filteredExpenses.length} {filteredExpenses.length === 1 ? 'Transaction' : 'Transactions'}
                {selectedMonth !== 'ALL' ? ` in ${selectedMonth}` : ''}
              </Text>
            </View>
          </>
        }
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
          const cat = CATEGORY_CONFIG[item.category] || {
            label: item.category,
            icon: 'wallet' as any,
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
                    <Text style={styles.cardSub}>{new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
                  </View>
                  <Text style={styles.cardCost}>₹{Number(item.amount).toLocaleString()}</Text>
                </View>

                {/* Action row: Edit & Delete */}
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionEditBtn} onPress={() => handleEdit(item)}>
                    <Ionicons name="create-outline" size={14} color={colors.primary} />
                    <Text style={styles.actionEditText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionDeleteBtn} onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={15} color={colors.error} />
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
  filterContainer: {
    marginBottom: spacing.xs,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  resetFilterText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
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
  recordsHeaderRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs + 2,
  },
  recordsCountLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  list: { paddingBottom: 100 },
  card: { marginHorizontal: spacing.base, marginBottom: spacing.sm, padding: spacing.md },
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
