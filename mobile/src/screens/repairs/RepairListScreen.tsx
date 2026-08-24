import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { repairsApi } from '../../api/resources';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

export default function RepairListScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [repairs, setRepairs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await repairsApi.getAll(vehicleId);
      setRepairs(res.data);
    } catch (e) {
      console.log(e);
    }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleEdit = (record: any) => {
    navigation.navigate('AddRepair', { vehicleId, record });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Repair Log', 'Are you sure you want to delete this repair log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await repairsApi.delete(vehicleId, id);
            load();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete repair log');
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
          <Text style={styles.title}>Repair Log</Text>
          <Text style={styles.subTitle}>Tap any record to edit details</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddRepair', { vehicleId })}
        >
          <Ionicons name="add" size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={repairs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="hammer-outline"
            title="No repairs logged"
            subtitle="Tap + to log a breakdown or repair"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.8} onPress={() => handleEdit(item)}>
            <Card style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <Ionicons name="hammer" size={18} color={colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.description}</Text>
                  <Text style={styles.cardSub}>
                    {new Date(item.date).toLocaleDateString()} • {item.odometer.toLocaleString()} KM
                  </Text>
                  {item.cause ? <Text style={styles.cardSub}>Reason: {item.cause}</Text> : null}
                  {item.location ? <Text style={styles.cardSub}>📍 {item.location}</Text> : null}
                </View>
                <Text style={styles.cardCost}>₹{item.cost.toLocaleString()}</Text>
              </View>

              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

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
  list: { padding: spacing.base, paddingTop: 0, paddingBottom: 100 },
  card: { marginBottom: spacing.sm, padding: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  cardCost: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  notes: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, fontStyle: 'italic' },
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
