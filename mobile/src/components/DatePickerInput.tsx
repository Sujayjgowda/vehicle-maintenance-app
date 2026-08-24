import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isAfter, startOfDay, subDays, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, isSameDay } from 'date-fns';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';

interface DatePickerInputProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  maxDate?: Date;
  minDate?: Date;
  helperText?: string;
}

export default function DatePickerInput({
  label = 'Transaction Date',
  value,
  onChange,
  maxDate = new Date(),
  minDate,
  helperText,
}: DatePickerInputProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [viewingMonth, setViewingMonth] = useState(new Date(value));
  const [tempDate, setTempDate] = useState(new Date(value));

  const today = startOfDay(new Date());
  const maxDay = maxDate ? startOfDay(maxDate) : today;

  const openPicker = () => {
    setTempDate(new Date(value));
    setViewingMonth(new Date(value));
    setModalVisible(true);
  };

  const handleSelectDay = (dayDate: Date) => {
    if (isAfter(startOfDay(dayDate), maxDay)) {
      Alert.alert('Invalid Date', 'Future dates cannot be selected for transactions.');
      return;
    }
    setTempDate(dayDate);
  };

  const handleQuickSelect = (daysAgo: number) => {
    const selected = subDays(today, daysAgo);
    if (isAfter(startOfDay(selected), maxDay)) return;
    setTempDate(selected);
  };

  const handleConfirm = () => {
    if (isAfter(startOfDay(tempDate), maxDay)) {
      Alert.alert('Invalid Date', 'Future dates cannot be selected for transactions.');
      return;
    }
    onChange(tempDate);
    setModalVisible(false);
  };

  const nextMonth = () => {
    const next = addMonths(viewingMonth, 1);
    // Allow viewing next month only if it doesn't start completely beyond maxDate
    if (startOfMonth(next) > startOfMonth(maxDay)) return;
    setViewingMonth(next);
  };

  const prevMonth = () => {
    setViewingMonth(subMonths(viewingMonth, 1));
  };

  // Generate calendar grid
  const daysInMonth = getDaysInMonth(viewingMonth);
  const monthStartDay = getDay(startOfMonth(viewingMonth)); // 0 = Sun, 1 = Mon ...
  const monthYearStr = format(viewingMonth, 'MMMM yyyy');

  const days: Array<{ dayNum: number; fullDate: Date; isCurrentMonth: boolean; disabled: boolean }> = [];

  // Blank slots before first day of month
  for (let i = 0; i < monthStartDay; i++) {
    days.push({ dayNum: 0, fullDate: new Date(), isCurrentMonth: false, disabled: true });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(viewingMonth.getFullYear(), viewingMonth.getMonth(), d);
    const disabled = isAfter(startOfDay(dayDate), maxDay);
    days.push({
      dayNum: d,
      fullDate: dayDate,
      isCurrentMonth: true,
      disabled,
    });
  }

  const isSelectedToday = isSameDay(value, today);
  const isSelectedYesterday = isSameDay(value, subDays(today, 1));

  let displayLabel = format(value, 'dd MMM yyyy');
  if (isSelectedToday) {
    displayLabel = `Today (${format(value, 'dd MMM')})`;
  } else if (isSelectedYesterday) {
    displayLabel = `Yesterday (${format(value, 'dd MMM')})`;
  }

  const isNextMonthDisabled = startOfMonth(addMonths(viewingMonth, 1)) > startOfMonth(maxDay);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity style={styles.inputBox} activeOpacity={0.7} onPress={openPicker}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.dateText}>{displayLabel}</Text>
          <Text style={styles.subText}>{format(value, 'EEEE, yyyy-MM-dd')}</Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick selection chips */}
            <View style={styles.quickChips}>
              <TouchableOpacity
                style={[styles.quickChip, isSameDay(tempDate, today) && styles.quickChipActive]}
                onPress={() => handleQuickSelect(0)}
              >
                <Text style={[styles.quickChipText, isSameDay(tempDate, today) && styles.quickChipTextActive]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickChip, isSameDay(tempDate, subDays(today, 1)) && styles.quickChipActive]}
                onPress={() => handleQuickSelect(1)}
              >
                <Text style={[styles.quickChipText, isSameDay(tempDate, subDays(today, 1)) && styles.quickChipTextActive]}>Yesterday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickChip, isSameDay(tempDate, subDays(today, 2)) && styles.quickChipActive]}
                onPress={() => handleQuickSelect(2)}
              >
                <Text style={[styles.quickChipText, isSameDay(tempDate, subDays(today, 2)) && styles.quickChipTextActive]}>2 Days Ago</Text>
              </TouchableOpacity>
            </View>

            {/* Month Navigator */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthYearStr}</Text>
              <TouchableOpacity
                onPress={nextMonth}
                style={[styles.navBtn, isNextMonthDisabled && styles.navBtnDisabled]}
                disabled={isNextMonthDisabled}
              >
                <Ionicons name="chevron-forward" size={20} color={isNextMonthDisabled ? colors.textMuted : colors.text} />
              </TouchableOpacity>
            </View>

            {/* Weekday headers */}
            <View style={styles.weekdaysRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd, i) => (
                <Text key={i} style={styles.weekdayText}>{wd}</Text>
              ))}
            </View>

            {/* Day grid */}
            <View style={styles.daysGrid}>
              {days.map((item, index) => {
                if (!item.isCurrentMonth) {
                  return <View key={index} style={styles.dayCell} />;
                }

                const isSelected = isSameDay(item.fullDate, tempDate);
                const isCurrentDay = isSameDay(item.fullDate, today);

                return (
                  <TouchableOpacity
                    key={index}
                    disabled={item.disabled}
                    onPress={() => handleSelectDay(item.fullDate)}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      isCurrentDay && !isSelected && styles.dayCellToday,
                      item.disabled && styles.dayCellDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        item.disabled && styles.dayTextDisabled,
                        isCurrentDay && !isSelected && styles.dayTextToday,
                      ]}
                    >
                      {item.dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Future dates notice */}
            <View style={styles.noticeContainer}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.noticeText}>Future dates cannot be selected</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>Confirm Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  subText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  helperText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  quickChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  quickChipText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  quickChipTextActive: {
    color: colors.textOnPrimary,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  monthTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  weekdayText: {
    width: 36,
    textAlign: 'center',
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    marginVertical: 3,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: colors.textMuted,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  noticeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
});
