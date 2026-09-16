import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { remindersApi } from '../../api/resources';
import { confirmAction } from '../../utils/confirmAlert';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import ExpenseReportModal from '../../components/ExpenseReportModal';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';
import { format } from 'date-fns';

const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  SERVICE: 'build',
  PUC: 'document-text',
  INSURANCE: 'shield-checkmark',
  PART_REPLACEMENT: 'cog',
};

export default function ReminderListScreen({ route, navigation }: any) {
  const vehicleId = route?.params?.vehicleId;
  const [reminders, setReminders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = vehicleId ? await remindersApi.getAll(vehicleId) : await remindersApi.getUpcoming();
      setReminders(res.data);
    } catch (e) {
      console.log(e);
    }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleMarkComplete = (item: any) => {
    confirmAction(
      'Complete Reminder',
      `Mark "${item.title || item.type}" as completed?`,
      async () => {
        try {
          await remindersApi.update(item.vehicleId, item.id, { status: 'COMPLETED' });
          load();
        } catch (e) {
          Alert.alert('Error', 'Failed to update reminder');
        }
      },
      'Mark Complete'
    );
  };

  const handleDelete = (target: any) => {
    const item = typeof target === 'object' && target !== null 
      ? target 
      : reminders.find((r) => r.id === target) || { id: target, vehicleId };
    const targetVehicleId = item.vehicleId || vehicleId;
    const targetId = item.id || target;

    confirmAction(
      'Delete Reminder',
      'Are you sure you want to remove this reminder?',
      async () => {
        try {
          await remindersApi.delete(targetVehicleId, targetId);
          load();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete reminder');
        }
      },
      'Delete'
    );
  };

  const getStatusVariant = (status: string) => {
    if (status === 'COMPLETED') return 'success';
    if (status === 'OVERDUE') return 'error';
    if (status === 'CANCELLED') return 'default';
    return 'warning';
  };

  const goToAdd = () => {
    navigation.navigate('AddReminder', { vehicleId });
  };

  const handleEdit = (item: any) => {
    navigation.navigate('AddReminder', {
      vehicleId: item.vehicleId || vehicleId,
      record: item,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, marginLeft: navigation.canGoBack() ? spacing.sm : 0 }}>
          <Text style={styles.title}>🔔 Reminders</Text>
          <Text style={styles.subTitle}>Insurance, PUC, Service & Maintenance Alerts</Text>
        </View>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => setReportModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={15} color={colors.primary} />
            <Text style={styles.reportBtnText}>Export PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={goToAdd}>
            <Ionicons name="add" size={18} color={colors.textOnPrimary} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
            <EmptyState
              icon="notifications-off-outline"
              title="No reminders set"
              subtitle="Keep track of Insurance renewals, PUC, and oil change services"
            />
          </View>
        }
        renderItem={({ item }) => {
          const isDone = item.status === 'COMPLETED';

          return (
            <Card style={[styles.card, isDone && styles.cardDone]}>
              <View style={styles.cardRow}>
                <View
                  style={[
                    styles.cardIcon,
                    { backgroundColor: (typeIcons[item.type] ? colors.primary : colors.textSecondary) + '15' },
                  ]}
                >
                  <Ionicons
                    name={typeIcons[item.type] || 'alarm'}
                    size={20}
                    color={typeIcons[item.type] ? colors.primary : colors.textSecondary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, isDone && styles.cardTitleDone]}>
                    {item.title || item.type.replace('_', ' ')}
                  </Text>
                  <Text style={styles.cardSub}>
                    {item.vehicle ? `${item.vehicle.make} ${item.vehicle.model} • ` : ''}
                    {item.dueDate ? `Due: ${format(new Date(item.dueDate), 'dd-MMM-yyyy')} ` : ''}
                    {item.dueKm ? `• At ${item.dueKm.toLocaleString()} KM` : ''}
                  </Text>
                </View>

                <Badge text={item.status} variant={getStatusVariant(item.status)} />
              </View>

              {/* Action Buttons: Mark Done, Edit & Delete */}
              <View style={styles.cardActions}>
                {!isDone ? (
                  <TouchableOpacity style={styles.actionDoneBtn} onPress={() => handleMarkComplete(item)}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                    <Text style={styles.actionDoneText}>Mark as Done</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={styles.actionEditBtn} onPress={() => handleEdit(item)}>
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                  <Text style={styles.actionEditText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionDeleteBtn} onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  reportBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  subTitle: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  addBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  list: { padding: spacing.base, paddingTop: 0, paddingBottom: 100 },
  card: { marginBottom: spacing.md, padding: spacing.md },
  cardDone: { opacity: 0.75, backgroundColor: colors.surfaceAlt },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconDone: {
    backgroundColor: colors.success + '15',
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  cardTitleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  cardSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 3 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
  },
  actionDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.success + '12',
    borderRadius: borderRadius.sm,
  },
  actionDoneText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.success,
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
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  emptyAddBtnText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
});
