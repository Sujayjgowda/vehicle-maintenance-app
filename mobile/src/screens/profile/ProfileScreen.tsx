import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { vehiclesApi } from '../../api/vehicles';
import { expensesApi } from '../../api/resources';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [vehicleCount, setVehicleCount] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const vRes = await vehiclesApi.getAll();
      setVehicleCount(vRes.data.length);
      const eRes = await expensesApi.getUserSummary();
      setTotalExpenses(eRes.data.total || 0);
    } catch (e) { console.log(e); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="car" size={24} color={colors.primary} />
            <Text style={styles.statVal}>{vehicleCount}</Text>
            <Text style={styles.statLabel}>Vehicles</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="wallet" size={24} color={colors.accent} />
            <Text style={styles.statVal}>₹{Math.round(totalExpenses).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </Card>
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoVal}>{user?.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoVal}>{user?.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoVal}>{user?.role}</Text>
          </View>
        </Card>

        <View style={{ alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xs }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary }}>Garage Grid v1.0.0</Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>Real-time Fleet & Maintenance Ecosystem</Text>
        </View>

        <Button title="Sign Out" onPress={logout} variant="danger" style={{ marginTop: spacing.md }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.base, paddingBottom: spacing.xxl * 2 },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 32, fontWeight: '800', color: colors.textOnPrimary },
  name: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  email: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  roleBadge: { backgroundColor: colors.primary + '15', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginTop: spacing.sm },
  roleText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  statVal: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  infoCard: { gap: 0 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  infoLabel: { fontSize: fontSize.sm, color: colors.textSecondary, width: 80 },
  infoVal: { flex: 1, fontSize: fontSize.md, color: colors.text, fontWeight: '500', textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.borderLight },
});
