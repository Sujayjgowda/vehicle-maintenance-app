import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';

export const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  FUEL: { label: 'Fuel', icon: 'flame', color: '#F97316' },
  SERVICE: { label: 'Service', icon: 'build', color: '#3B82F6' },
  REPAIR: { label: 'Repairs', icon: 'hammer', color: '#EF4444' },
  TOLL: { label: 'Toll (FASTag)', icon: 'navigate-circle', color: '#0D9488' },
  PARKING: { label: 'Parking', icon: 'car', color: '#8B5CF6' },
  INSURANCE: { label: 'Insurance', icon: 'shield-checkmark', color: '#10B981' },
  PARTS: { label: 'Spare Parts', icon: 'cube', color: '#F59E0B' },
  OTHER: { label: 'Other', icon: 'receipt', color: '#64748B' },
};

interface MonthlyExpenseDonutChartProps {
  expenses: any[];
  selectedMonth: string; // 'ALL' or 'YYYY-MM' (e.g. '2026-08')
  onSelectMonth: (month: string) => void;
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string;
}

export default function MonthlyExpenseDonutChart({
  expenses,
  selectedMonth,
  onSelectMonth,
  onSelectCategory,
  selectedCategory = 'ALL',
}: MonthlyExpenseDonutChartProps) {
  // 1. Extract unique months sorted descending
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    for (const e of expenses) {
      if (e.date) {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthsSet.add(key);
      }
    }
    const sorted = Array.from(monthsSet).sort().reverse();
    return ['ALL', ...sorted];
  }, [expenses]);

  // 2. Filter expenses by selected month
  const monthExpenses = useMemo(() => {
    if (selectedMonth === 'ALL') return expenses;
    return expenses.filter((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [expenses, selectedMonth]);

  // 3. Aggregate totals and calculate category slices
  const { totalSpent, categoryBreakdown, slices } = useMemo(() => {
    const total = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const catMap: Record<string, { amount: number; count: number }> = {};

    for (const e of monthExpenses) {
      const cat = e.category || 'OTHER';
      if (!catMap[cat]) catMap[cat] = { amount: 0, count: 0 };
      catMap[cat].amount += Number(e.amount) || 0;
      catMap[cat].count += 1;
    }

    const breakdown = Object.entries(catMap)
      .map(([cat, data]) => {
        const pct = total > 0 ? (data.amount / total) * 100 : 0;
        const config = CATEGORY_CONFIG[cat] || {
          label: cat,
          icon: 'wallet' as any,
          color: colors.other,
        };
        return {
          category: cat,
          label: config.label,
          icon: config.icon,
          color: config.color,
          amount: data.amount,
          count: data.count,
          percentage: pct,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // SVG Donut Slices calculation
    const radius = 70;
    const strokeWidth = 22;
    const circumference = 2 * Math.PI * radius;
    let accumulatedAngle = 0;

    const sliceData = breakdown.map((item) => {
      const sliceLength = (item.percentage / 100) * circumference;
      const strokeDashoffset = -accumulatedAngle;
      accumulatedAngle += sliceLength;
      return {
        ...item,
        strokeDasharray: `${sliceLength} ${circumference - sliceLength}`,
        strokeDashoffset,
      };
    });

    return { totalSpent: total, categoryBreakdown: breakdown, slices: sliceData };
  }, [monthExpenses]);

  // Format month name for display
  const monthDisplayLabel = useMemo(() => {
    if (selectedMonth === 'ALL') return 'All Time';
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const size = 180;
  const center = size / 2;
  const radius = 70;
  const strokeWidth = 22;

  return (
    <View style={styles.container}>
      {/* ─── Month Selection Horizontal Scroll Bar ─── */}
      <View style={styles.monthSelectorRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthScroll}
        >
          {availableMonths.map((m) => {
            const isActive = selectedMonth === m;
            let label = 'All Months';
            if (m !== 'ALL') {
              const [year, month] = m.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1, 1);
              label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            }
            return (
              <TouchableOpacity
                key={m}
                style={[styles.monthChip, isActive && styles.monthChipActive]}
                onPress={() => onSelectMonth(m)}
              >
                <Ionicons
                  name={isActive ? 'calendar' : 'calendar-outline'}
                  size={12}
                  color={isActive ? '#FFF' : colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.monthText, isActive && styles.monthTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Circular Donut Chart & Total Spent Card ─── */}
      <View style={styles.chartCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.chartHeaderTitle}>MONTHLY EXPENSE BREAKDOWN</Text>
            <Text style={styles.chartHeaderSub}>{monthDisplayLabel} Overview</Text>
          </View>
          <View style={styles.recordCountBadge}>
            <Text style={styles.recordCountText}>{monthExpenses.length} Records</Text>
          </View>
        </View>

        <View style={styles.donutRow}>
          {/* SVG Donut Chart */}
          <View style={styles.svgWrapper}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <G rotation="-90" origin={`${center}, ${center}`}>
                {/* Background Ring */}
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={colors.borderLight}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Category Slices */}
                {totalSpent > 0 &&
                  slices.map((slice) => (
                    <Circle
                      key={slice.category}
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke={slice.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="butt"
                      fill="transparent"
                    />
                  ))}
              </G>
            </Svg>

            {/* Inner Center Text */}
            <View style={styles.donutCenter}>
              <Text style={styles.centerSub}>TOTAL SPENT</Text>
              <Text style={styles.centerAmount}>₹{Math.round(totalSpent).toLocaleString()}</Text>
              <Text style={styles.centerMonth}>{selectedMonth === 'ALL' ? 'Overall' : monthDisplayLabel.split(' ')[0]}</Text>
            </View>
          </View>

          {/* Quick Stats Column */}
          <View style={styles.quickStatsCol}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Total Expense</Text>
              <Text style={styles.statBoxValue}>₹{Math.round(totalSpent).toLocaleString()}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Top Expense</Text>
              <Text style={styles.statBoxValueTop} numberOfLines={1}>
                {categoryBreakdown[0] ? `${categoryBreakdown[0].label}` : 'None'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Avg / Transaction</Text>
              <Text style={styles.statBoxValue}>
                ₹{monthExpenses.length > 0 ? Math.round(totalSpent / monthExpenses.length).toLocaleString() : '0'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Category Breakdown Legend List ─── */}
        {categoryBreakdown.length > 0 ? (
          <View style={styles.legendContainer}>
            <Text style={styles.legendHeader}>Category Breakdown</Text>
            {categoryBreakdown.map((item) => {
              const isSelected = selectedCategory === item.category;
              return (
                <TouchableOpacity
                  key={item.category}
                  style={[styles.legendItem, isSelected && styles.legendItemSelected]}
                  onPress={() => onSelectCategory && onSelectCategory(isSelected ? 'ALL' : item.category)}
                  activeOpacity={0.7}
                >
                  <View style={styles.legendLeft}>
                    <View style={[styles.categoryDot, { backgroundColor: item.color }]}>
                      <Ionicons name={item.icon} size={14} color="#FFF" />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.categoryName}>{item.label}</Text>
                        <Text style={styles.categoryAmount}>₹{Math.round(item.amount).toLocaleString()}</Text>
                      </View>
                      {/* Visual progress bar */}
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { backgroundColor: item.color, width: `${Math.max(item.percentage, 4)}%` },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={[styles.pctBadge, { backgroundColor: item.color + '15' }]}>
                    <Text style={[styles.pctText, { color: item.color }]}>{item.percentage.toFixed(1)}%</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  monthSelectorRow: {
    marginBottom: spacing.sm,
  },
  monthScroll: {
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
  },
  monthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  monthTextActive: {
    color: '#FFF',
  },
  chartCard: {
    marginHorizontal: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  chartHeaderSub: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  recordCountBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  recordCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  svgWrapper: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.surface,
  },
  centerSub: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  centerAmount: {
    fontSize: fontSize.md + 1,
    fontWeight: '800',
    color: colors.text,
    marginVertical: 2,
  },
  centerMonth: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  quickStatsCol: {
    flex: 1,
    marginLeft: spacing.md,
    gap: spacing.xs,
  },
  statBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  statBoxLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  statBoxValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
  },
  statBoxValueTop: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 1,
  },
  legendContainer: {
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  legendHeader: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  legendItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.text,
  },
  categoryAmount: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.text,
    marginRight: spacing.sm,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
    width: '95%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  pctBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  pctText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
