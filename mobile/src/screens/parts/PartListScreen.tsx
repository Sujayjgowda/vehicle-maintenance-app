import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { partsApi } from '../../api/resources';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, fontSize } from '../../theme/colors';

export default function PartListScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [parts, setParts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const res = await partsApi.getAll(vehicleId); setParts(res.data); } catch (e) { console.log(e); }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Delete this part record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await partsApi.delete(vehicleId, id); load(); }},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={styles.title}>Spare Parts</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddPart', { vehicleId })}>
          <Ionicons name="add" size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>
      <FlatList data={parts} keyExtractor={(item) => item.id} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="cog-outline" title="No parts tracked" subtitle="Tap + to add a part" />}
        renderItem={({ item }) => (
          <TouchableOpacity onLongPress={() => handleDelete(item.id)}>
            <Card style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}><Ionicons name="cog" size={18} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.componentName}</Text>
                  <Text style={styles.cardSub}>Installed: {new Date(item.installDate).toLocaleDateString()} • {item.installOdometer.toLocaleString()} KM</Text>
                  {item.nextDueDate && <Text style={styles.due}>Next due: {new Date(item.nextDueDate).toLocaleDateString()}</Text>}
                  {item.nextDueKm && <Text style={styles.due}>Next due: {item.nextDueKm.toLocaleString()} KM</Text>}
                </View>
                {item.cost && <Text style={styles.cardCost}>₹{item.cost.toLocaleString()}</Text>}
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
  list: { padding: spacing.base, paddingTop: 0, paddingBottom: 100 },
  card: { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  due: { fontSize: fontSize.xs, color: colors.warning, marginTop: 2, fontWeight: '600' },
  cardCost: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
});
