import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSize } from '../theme/colors';

interface MetricCardProps {
  title: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  highlight?: boolean;
  style?: ViewStyle;
}

export default function MetricCard({ title, value, icon, iconColor, highlight, style }: MetricCardProps) {
  return (
    <View style={[styles.card, highlight && styles.highlightCard, style]}>
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: highlight ? 'rgba(255,255,255,0.2)' : (iconColor || colors.primary) + '15' }]}>
          <Ionicons name={icon} size={20} color={highlight ? '#FFF' : (iconColor || colors.primary)} />
        </View>
      )}
      <Text style={[styles.title, highlight && styles.highlightText]}>{title}</Text>
      <Text style={[styles.value, highlight && styles.highlightText]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    width: '48%',
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  highlightCard: {
    backgroundColor: colors.primary,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  highlightText: {
    color: colors.textOnPrimary,
  },
});
