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
import { fuelApi } from '../../api/fuel';
import { confirmAction } from '../../utils/confirmAlert';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import MonthlyExpenseDonutChart, { CATEGORY_CONFIG } from '../../components/MonthlyExpenseDonutChart';
import ExpenseReportModal from '../../components/ExpenseReportModal';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';
import { format } from 'date-fns';

const filterTabs = ['ALL', 'FUEL', 'SERVICE', 'REPAIR', 'TOLL', 'PARKING', 'INSURANCE', 'PARTS', 'OTHER'];

export default function ExpenseListScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const [eRes, sRes, fRes] = await Promise.all([
        expensesApi.getAll(vehicleId),
        expensesApi.getSummary(vehicleId),
        fuelApi.getAll(vehicleId),
      ]);

      const rawExpenses = eRes.data || [];
      const rawFuel = fRes.data || [];

      // Map fuel fill-up logs into expense objects for unified monthly tracking
      const fuelExpenses = rawFuel.map((f: any) => ({
        id: `fuel-${f.id}`,
        vehicleId,
        date: f.date,
        amount: Number(f.cost) || 0,
        category: 'FUEL',
        sourceType: 'FUEL_LOG',
        notes: `Fuel Fill-up: ${f.liters} L${f.pricePerLiter ? ` @ ₹${f.pricePerLiter}/L` : ''}${f.gasStation ? ` • ${f.gasStation}` : ''}${f.notes ? ` (${f.notes})` : ''}`,
        receiptUrl: undefined,
        isFuelRecord: true,
        rawFuel: f,
      }));

      // Combine and sort by date descending
      const combined = [...rawExpenses, ...fuelExpenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setExpenses(combined);
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

  const handleEdit = (item: any) => {
    if (item.isFuelRecord) {
      navigation.navigate('AddFuel', { vehicleId, record: item.rawFuel });
    } else {
      navigation.navigate('AddExpense', { vehicleId, record: item });
    }
  };

  const handleDelete = (item: any) => {
    const isFuel = item.isFuelRecord;
    confirmAction(
      isFuel ? 'Delete Fuel Record' : 'Delete Expense',
      `Are you sure you want to delete this ${isFuel ? 'fuel fill-up log' : 'expense record'}?`,
      async () => {
        try {
          if (isFuel) {
            await fuelApi.delete(vehicleId, item.rawFuel.id);
          } else {
            await expensesApi.delete(vehicleId, item.id);
          }
          load();
        } catch (e) {
          Alert.alert('Error', `Failed to delete ${isFuel ? 'fuel record' : 'expense'}`);
        }
      }
    );
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
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => setReportModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <Text style={styles.reportBtnText}>Export PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddExpense', { vehicleId })}
          >
            <Ionicons name="add" size={22} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
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
                      {item.isFuelRecord ? (
                        <View style={[styles.autoSyncBadge, { backgroundColor: '#F9731620' }]}>
                          <Text style={[styles.autoSyncText, { color: '#F97316' }]}>Fuel Fill-Up</Text>
                        </View>
                      ) : isAutoSynced ? (
                        <View style={styles.autoSyncBadge}>
                          <Text style={styles.autoSyncText}>Auto-synced</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.cardSub}>{format(new Date(item.date), 'dd-MMM-yyyy')}</Text>
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
                  <TouchableOpacity style={styles.actionDeleteBtn} onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={15} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  reportBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
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
