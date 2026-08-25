import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiApi } from '../api/ai';
import Card from './Card';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';

interface VehicleHealthAiCardProps {
  vehicle: any;
  onOpenAiMechanic: () => void;
}

export default function VehicleHealthAiCard({ vehicle, onOpenAiMechanic }: VehicleHealthAiCardProps) {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicle?.id) {
      setLoading(true);
      aiApi
        .getPredictiveHealth(vehicle.id)
        .then((res) => setHealthData(res.data))
        .catch((e) => console.log('Predictive health error:', e))
        .finally(() => setLoading(false));
    }
  }, [vehicle?.id]);

  if (!vehicle) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={styles.aiPulse} />
          <Text style={styles.headerLabel}>GARAGE GRID AI HEALTH PREDICTOR</Text>
        </View>
        <TouchableOpacity style={styles.askAiBtn} onPress={onOpenAiMechanic}>
          <Ionicons name="sparkles" size={12} color="#FFF" />
          <Text style={styles.askAiBtnText}>Ask AI Mechanic</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loaderText}>Analyzing component wear cycles...</Text>
        </View>
      ) : healthData ? (
        <>
          {/* Overall Health Score Banner */}
          <View style={styles.scoreBanner}>
            <View style={styles.scoreCol}>
              <Text style={styles.scoreVal}>{healthData.overallScore}%</Text>
              <Text style={styles.scoreSub}>Health Index</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.summaryText}>{healthData.summary}</Text>
            </View>
          </View>

          {/* Component Bars */}
          <View style={styles.componentsList}>
            {healthData.components?.slice(0, 3).map((comp: any, idx: number) => (
              <View key={idx} style={styles.compRow}>
                <View style={styles.compLeft}>
                  <Ionicons name={comp.icon as any} size={14} color={comp.statusColor} />
                  <Text style={styles.compName}>{comp.name}</Text>
                </View>
                <View style={styles.compRight}>
                  <View style={styles.compBarTrack}>
                    <View
                      style={[
                        styles.compBarFill,
                        { width: `${comp.score}%`, backgroundColor: comp.statusColor },
                      ]}
                    />
                  </View>
                  <Text style={[styles.compScoreText, { color: comp.statusColor }]}>
                    {comp.score}%
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.viewDetailsRow} onPress={onOpenAiMechanic}>
            <Text style={styles.viewDetailsText}>Run Full Diagnostic or Check Symptoms</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  aiPulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#8B5CF6',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  askAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  askAiBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  loaderBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  loaderText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  scoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  scoreCol: {
    alignItems: 'center',
    paddingRight: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  scoreVal: {
    fontSize: fontSize.lg,
    fontWeight: '900',
    color: '#10B981',
  },
  scoreSub: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  summaryText: {
    fontSize: fontSize.xs,
    color: colors.text,
    lineHeight: 16,
  },
  componentsList: {
    gap: 6,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '45%',
  },
  compName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  compRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '50%',
  },
  compBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  compBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  compScoreText: {
    fontSize: 10,
    fontWeight: '700',
    width: 28,
    textAlign: 'right',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
});
