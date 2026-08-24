import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { remindersApi } from '../../api/resources';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, fontSize } from '../../theme/colors';

const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  SERVICE: 'build', PUC: 'document-text', INSURANCE: 'shield-checkmark', PART_REPLACEMENT: 'cog',
};

export default function ReminderListScreen({ route, navigation }: any) {
  const vehicleId = route?.params?.vehicleId;
  const [reminders, setReminders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = vehicleId ? await remindersApi.getAll(vehicleId) : await remindersApi.getUpcoming();
      setReminders(res.data);
    } catch (e) { console.log(e); }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const getStatusVariant = (status: string) => {
    if (status === 'COMPLETED') return 'success';
    if (status === 'OVERDUE') return 'error';
    if (status === 'CANCELLED') return 'default';
    return 'warning';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>🔔 Reminders</Text>
      </View>
      <FlatList data={reminders} keyExtractor={(item) => item.id} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="notifications-off-outline" title="No reminders" subtitle="All caught up! 🎉" />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardIcon}>
                <Ionicons name={typeIcons[item.type] || 'alert'} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title || item.type.replace('_', ' ')}</Text>
                <Text style={styles.cardSub}>
                  {item.vehicle ? `${item.vehicle.make} ${item.vehicle.model} • ` : ''}
                  {item.dueDate ? `Due: ${new Date(item.dueDate).toLocaleDateString()}` : ''}
                  {item.dueKm ? `Due: ${item.dueKm.toLocaleString()} KM` : ''}
                </Text>
              </View>
              <Badge text={item.status} variant={getStatusVariant(item.status)} />
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  list: { padding: spacing.base, paddingTop: 0, paddingBottom: 100 },
  card: { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});
