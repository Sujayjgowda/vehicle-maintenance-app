import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { vehiclesApi } from '../api/vehicles';
import { expensesApi } from '../api/resources';
import { fuelApi } from '../api/fuel';
import {
  generateExpenseReportHtml,
  exportExpensePdf,
  ExpenseReportItem,
  VehicleReportMeta,
} from '../utils/expenseReportPdf';
import Button from './Button';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';

interface ExpenseReportModalProps {
  visible: boolean;
  onClose: () => void;
  defaultVehicleId?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function ExpenseReportModal({
  visible,
  onClose,
  defaultVehicleId,
}: ExpenseReportModalProps) {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth(); // 0 to 11

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    defaultVehicleId || 'ALL'
  );
  const [periodType, setPeriodType] = useState<'ANNUAL' | 'MONTHLY' | 'ALL_TIME'>(
    'ANNUAL'
  );
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(currentMonthIdx);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (visible) {
      if (defaultVehicleId) {
        setSelectedVehicleId(defaultVehicleId);
      }
      vehiclesApi
        .getAll()
        .then((res) => {
          if (Array.isArray(res.data)) {
            setVehicles(res.data);
          }
        })
        .catch(() => {});
    }
  }, [visible, defaultVehicleId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // 1. Determine target vehicles
      let targetVehicles =
        selectedVehicleId === 'ALL'
          ? vehicles
          : vehicles.filter((v) => v.id === selectedVehicleId);

      if (targetVehicles.length === 0) {
        try {
          const allRes = await vehiclesApi.getAll();
          const allV = Array.isArray(allRes.data) ? allRes.data : [];
          setVehicles(allV);
          targetVehicles =
            selectedVehicleId === 'ALL'
              ? allV
              : allV.filter((v: any) => v.id === selectedVehicleId);
        } catch {}
      }

      if (targetVehicles.length === 0 && selectedVehicleId !== 'ALL') {
        try {
          const singleRes = await vehiclesApi.getById(selectedVehicleId);
          if (singleRes.data) targetVehicles = [singleRes.data];
        } catch {}
      }

      if (targetVehicles.length === 0) {
        Alert.alert('No Vehicles Found', 'Please register a vehicle to generate a report.');
        setGenerating(false);
        return;
      }

      // 2. Fetch expenses and fuel logs for all target vehicles
      const allItems: ExpenseReportItem[] = [];

      for (const v of targetVehicles) {
        const [expRes, fuelRes] = await Promise.all([
          expensesApi.getAll(v.id).catch(() => ({ data: [] })),
          fuelApi.getAll(v.id).catch(() => ({ data: [] })),
        ]);

        const rawExpenses = Array.isArray(expRes.data) ? expRes.data : [];
        const rawFuel = Array.isArray(fuelRes.data) ? fuelRes.data : [];

        // Manual expenses
        rawExpenses.forEach((e: any) => {
          allItems.push({
            id: `exp-${e.id}`,
            date: e.date,
            category: e.category || 'OTHER',
            amount: Number(e.amount) || 0,
            notes: e.notes,
            vehicleName: `${v.make} ${v.model}`,
          });
        });

        // Fuel logs unified into expenses
        rawFuel.forEach((f: any) => {
          allItems.push({
            id: `fuel-${f.id}`,
            date: f.date,
            category: 'FUEL',
            amount: Number(f.cost) || 0,
            notes: `Fuel: ${f.liters} L${f.gasStation ? ` • ${f.gasStation}` : ''} • ${f.odometerReading ? f.odometerReading.toLocaleString() + ' KM' : ''}`,
            vehicleName: `${v.make} ${v.model}`,
          });
        });
      }

      // 3. Filter items according to period
      let filteredItems = allItems;
      let periodLabel = '';

      if (periodType === 'ANNUAL') {
        periodLabel = `Calendar Year ${selectedYear} (01-Jan-${selectedYear} to 31-Dec-${selectedYear})`;
        filteredItems = allItems.filter((it) => {
          const d = new Date(it.date);
          return !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
        });
      } else if (periodType === 'MONTHLY') {
        const monthStr = MONTH_NAMES[selectedMonthIdx];
        periodLabel = `${monthStr} ${selectedYear}`;
        filteredItems = allItems.filter((it) => {
          const d = new Date(it.date);
          return (
            !isNaN(d.getTime()) &&
            d.getFullYear() === selectedYear &&
            d.getMonth() === selectedMonthIdx
          );
        });
      } else {
        periodLabel = 'Complete All-Time History';
      }

      // 4. Vehicle metadata
      let vehicleMeta: VehicleReportMeta | null = null;
      if (selectedVehicleId !== 'ALL' && targetVehicles[0]) {
        const v = targetVehicles[0];
        vehicleMeta = {
          make: v.make,
          model: v.model,
          year: v.year,
          licensePlate: v.licensePlate,
          currentOdometer: v.currentOdometer,
          fuelType: v.fuelType,
        };
      }

      // 5. Generate HTML
      const html = generateExpenseReportHtml({
        periodType,
        periodLabel,
        vehicle: vehicleMeta,
        items: filteredItems,
      });

      // 6. Export PDF
      await exportExpensePdf(html, `GarageGrid_${periodType}_Audit.pdf`);

      // Close modal upon export trigger
      onClose();
    } catch (e: any) {
      console.log('PDF generation error:', e);
      Alert.alert('Error', e.message || 'Failed to generate PDF report.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.badge}>
                <Ionicons name="document-text" size={14} color={colors.primary} />
                <Text style={styles.badgeText}>PDF EXPORT</Text>
              </View>
              <Text style={styles.title}>Expense Audit Report</Text>
              <Text style={styles.subTitle}>
                Comprehensive financial summary with category breakdown & ledger
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            {/* 1. Vehicle Selection */}
            <Text style={styles.sectionLabel}>SELECT VEHICLE</Text>
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  selectedVehicleId === 'ALL' && styles.chipActive,
                ]}
                onPress={() => setSelectedVehicleId('ALL')}
              >
                <Ionicons
                  name="grid-outline"
                  size={14}
                  color={
                    selectedVehicleId === 'ALL'
                      ? colors.textOnPrimary
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.chipText,
                    selectedVehicleId === 'ALL' && styles.chipTextActive,
                  ]}
                >
                  All Vehicles (Consolidated)
                </Text>
              </TouchableOpacity>

              {vehicles.map((v) => {
                const active = selectedVehicleId === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedVehicleId(v.id)}
                  >
                    <Ionicons
                      name="car-sport"
                      size={14}
                      color={active ? colors.textOnPrimary : colors.primary}
                    />
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {v.make} {v.model} ({v.licensePlate})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Period Scope */}
            <Text style={styles.sectionLabel}>REPORTING PERIOD</Text>
            <View style={styles.periodTabs}>
              <TouchableOpacity
                style={[
                  styles.periodTab,
                  periodType === 'ANNUAL' && styles.periodTabActive,
                ]}
                onPress={() => setPeriodType('ANNUAL')}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    periodType === 'ANNUAL' && styles.periodTabTextActive,
                  ]}
                >
                  Annual ({selectedYear})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodTab,
                  periodType === 'MONTHLY' && styles.periodTabActive,
                ]}
                onPress={() => setPeriodType('MONTHLY')}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    periodType === 'MONTHLY' && styles.periodTabTextActive,
                  ]}
                >
                  Monthly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodTab,
                  periodType === 'ALL_TIME' && styles.periodTabActive,
                ]}
                onPress={() => setPeriodType('ALL_TIME')}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    periodType === 'ALL_TIME' && styles.periodTabTextActive,
                  ]}
                >
                  All Time
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. Year Selector */}
            {periodType !== 'ALL_TIME' && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={styles.subSectionLabel}>Select Year</Text>
                <View style={styles.yearChips}>
                  {[currentYear, currentYear - 1, currentYear - 2].map((yr) => {
                    const active = selectedYear === yr;
                    return (
                      <TouchableOpacity
                        key={yr}
                        style={[styles.yearChip, active && styles.yearChipActive]}
                        onPress={() => setSelectedYear(yr)}
                      >
                        <Text
                          style={[
                            styles.yearChipText,
                            active && styles.yearChipTextActive,
                          ]}
                        >
                          {yr}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 4. Month Selector if Monthly */}
            {periodType === 'MONTHLY' && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={styles.subSectionLabel}>Select Month</Text>
                <View style={styles.monthGrid}>
                  {MONTH_NAMES.map((m, idx) => {
                    const active = selectedMonthIdx === idx;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.monthChip,
                          active && styles.monthChipActive,
                        ]}
                        onPress={() => setSelectedMonthIdx(idx)}
                      >
                        <Text
                          style={[
                            styles.monthChipText,
                            active && styles.monthChipTextActive,
                          ]}
                        >
                          {m.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 5. Features included info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📄 Document Contents</Text>
              <Text style={styles.infoLine}>• Executive KPI statistics & total expenditure</Text>
              <Text style={styles.infoLine}>• Fuel, maintenance, and toll expense breakdown</Text>
              <Text style={styles.infoLine}>• Complete transaction ledger with DD-MMM-YYYY dates</Text>
              <Text style={styles.infoLine}>• Exportable directly to PDF (Save, Print, or Share)</Text>
            </View>

            {/* Submit Action */}
            <Button
              title={generating ? 'Generating PDF...' : 'Download & Export PDF'}
              onPress={handleGenerate}
              loading={generating}
              style={{ marginTop: spacing.md }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.base,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  subTitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
  },
  body: {
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  subSectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.md,
    gap: 4,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  periodTabActive: {
    backgroundColor: colors.primary,
  },
  periodTabText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodTabTextActive: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  yearChips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  yearChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  yearChipText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.text,
  },
  yearChipTextActive: {
    color: '#FFF',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthChip: {
    width: '23%',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthChipText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.text,
  },
  monthChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  infoTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  infoLine: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
