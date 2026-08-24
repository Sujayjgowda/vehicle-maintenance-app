import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { expensesApi } from '../../api/resources';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

const categoryColors: Record<string, string> = {
  FUEL: colors.fuel, SERVICE: colors.service, REPAIR: colors.error, INSURANCE: colors.accent,
  TOLL: colors.toll, PARKING: colors.parking, OTHER: colors.other,
};

export default function ExpenseListScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [eRes, sRes] = await Promise.all([expensesApi.getAll(vehicleId), expensesApi.getSummary(vehicleId)]);
      setExpenses(eRes.data);
      setSummary(sRes.data);
    } catch (e) { console.log(e); }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await expensesApi.delete(vehicleId, id); load(); }},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddExpense', { vehicleId })}>
          <Ionicons name="add" size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.summaryBanner}>
          <Text style={styles.summaryTotal}>₹{Math.round(summary.totalExpenses).toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Expenses • {summary.count} records</Text>
        </View>
      )}

      <FlatList data={expenses} keyExtractor={(item) => item.id} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="wallet-outline" title="No expenses" subtitle="Tap + to add an expense" />}
        renderItem={({ item }) => (
          <TouchableOpacity onLongPress={() => handleDelete(item.id)}>
            <Card style={styles.card}>
              <View style={styles.cardRow}>
                <View style={[styles.cardIcon, { backgroundColor: (categoryColors[item.category] || colors.other) + '15' }]}>
                  <Ionicons name="wallet" size={18} color={categoryColors[item.category] || colors.other} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.category}</Text>
                  <Text style={styles.cardSub}>{new Date(item.date).toLocaleDateString()}</Text>
                  {item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
                </View>
                <Text style={styles.cardCost}>₹{item.amount.toLocaleString()}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  summaryBanner: { alignItems: 'center', marginHorizontal: spacing.base, marginBottom: spacing.md, backgroundColor: colors.accent, borderRadius: borderRadius.md, padding: spacing.base },
  summaryTotal: { fontSize: fontSize.xxl, fontWeight: '800', color: '#FFF' },
  summaryLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  list: { padding: spacing.base, paddingTop: 0, paddingBottom: 100 },
  card: { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  cardNotes: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  cardCost: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
});
