import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { aiApi } from '../../api/ai';
import Card from '../../components/Card';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

const SAMPLE_QUERIES = [
  'Brakes squealing when slowing down',
  'Engine temperature gauge in red / overheating',
  'Clicking sound and car won’t start',
  'Check Engine light with P0420 code',
  'Steering wheel vibrating above 80 km/h',
  'AC blowing warm air in traffic',
];

export default function AiMechanicScreen({ route, navigation }: any) {
  const { vehicle } = route.params || {};
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDiagnose = async (textToUse?: string) => {
    const symptomText = textToUse || query;
    if (!symptomText.trim()) {
      Alert.alert('Empty Query', 'Please describe what you are experiencing or select a sample symptom.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await aiApi.diagnose(symptomText, {
        make: vehicle?.make,
        model: vehicle?.model,
        year: vehicle?.year,
        odometer: vehicle?.currentOdometer,
        fuelType: vehicle?.fuelType,
      });
      setResult(res.data);
    } catch (e: any) {
      Alert.alert('Diagnosis Error', e.response?.data?.error || 'Failed to complete diagnosis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.title}>Garage Grid AI Mechanic</Text>
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI 2.5</Text>
                </View>
              </View>
              <Text style={styles.subTitle}>Instant Automotive Triage & Diagnostic Assistant</Text>
            </View>
          </View>

          {/* Vehicle context badge if available */}
          {vehicle && (
            <View style={styles.vehicleContext}>
              <Ionicons name="car-sport" size={16} color={colors.primary} />
              <Text style={styles.vehicleContextText}>
                Active Vehicle: <Text style={{ fontWeight: '700' }}>{vehicle.make} {vehicle.model} ({vehicle.year || '2022'})</Text> • {vehicle.currentOdometer?.toLocaleString()} KM
              </Text>
            </View>
          )}

          {/* Input Box */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Describe Vehicle Symptoms, Sounds, or OBD Codes:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Squeaking noise when turning, engine sputtering at idle, or P0300 code..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              value={query}
              onChangeText={setQuery}
            />

            <TouchableOpacity
              style={[styles.diagnoseBtn, (!query.trim() || loading) && styles.diagnoseBtnDisabled]}
              onPress={() => handleDiagnose()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#FFF" />
                  <Text style={styles.diagnoseBtnText}>Run AI Diagnostic</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sample quick-select chips */}
          <View style={styles.samplesSection}>
            <Text style={styles.samplesLabel}>QUICK SYMPTOMS & COMMON ISSUES:</Text>
            <View style={styles.chipsWrap}>
              {SAMPLE_QUERIES.map((sample, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chip}
                  onPress={() => {
                    setQuery(sample);
                    handleDiagnose(sample);
                  }}
                >
                  <Ionicons name="help-circle-outline" size={14} color={colors.primary} />
                  <Text style={styles.chipText}>{sample}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Diagnosis Result Card */}
          {result && (
            <Card style={styles.resultCard}>
              {/* Severity & Title Header */}
              <View style={styles.resultHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle}>{result.title}</Text>
                  <Text style={styles.resultSummary}>{result.summary}</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: result.severityColor + '18', borderColor: result.severityColor }]}>
                  <Text style={[styles.severityText, { color: result.severityColor }]}>{result.severity} RISK</Text>
                </View>
              </View>

              {/* Safety & Cost Row */}
              <View style={styles.metricRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Safe to Drive?</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons
                      name={result.canDriveSafely ? 'shield-checkmark' : 'alert-circle'}
                      size={16}
                      color={result.canDriveSafely ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[styles.metricVal, { color: result.canDriveSafely ? '#10B981' : '#EF4444' }]}>
                      {result.canDriveSafely ? 'Yes (Safe to Drive)' : 'No (Stop & Tow)'}
                    </Text>
                  </View>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Est. Repair Cost (INR)</Text>
                  <Text style={[styles.metricVal, { color: colors.primary }]}>{result.estimatedCostRangeInr}</Text>
                </View>
              </View>

              {/* Possible Causes */}
              {result.possibleCauses?.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="search" size={14} color={colors.primary} /> Potential Root Causes
                  </Text>
                  {result.possibleCauses.map((cause: string, i: number) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{cause}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Recommended Actions */}
              {result.recommendedActions?.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" /> Recommended Next Steps
                  </Text>
                  {result.recommendedActions.map((action: string, i: number) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={[styles.bulletDot, { color: '#10B981' }]}>✓</Text>
                      <Text style={styles.bulletText}>{action}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Disclaimer */}
              <View style={styles.disclaimerBox}>
                <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
                <Text style={styles.disclaimerText}>{result.disclaimer}</Text>
              </View>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.base, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  subTitle: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  aiBadge: {
    backgroundColor: '#8B5CF6' + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  aiBadgeText: { fontSize: 10, fontWeight: '800', color: '#8B5CF6' },
  vehicleContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  vehicleContextText: { fontSize: fontSize.xs, color: colors.primaryDark },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  inputLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  textInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 75,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  diagnoseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  diagnoseBtnDisabled: { opacity: 0.6 },
  diagnoseBtnText: { color: '#FFF', fontSize: fontSize.sm, fontWeight: '700' },
  samplesSection: { marginBottom: spacing.md },
  samplesLabel: { fontSize: 10, fontWeight: '800', color: colors.textSecondary, marginBottom: spacing.xs, letterSpacing: 0.5 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontSize: fontSize.xs, color: colors.textSecondary },
  resultCard: {
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultTitle: { fontSize: fontSize.md + 1, fontWeight: '800', color: colors.text },
  resultSummary: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  severityText: { fontSize: 10, fontWeight: '800' },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricBox: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  metricLabel: { fontSize: 10, color: colors.textSecondary },
  metricVal: { fontSize: fontSize.xs, fontWeight: '700', marginTop: 2 },
  sectionBlock: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  bulletDot: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '700', lineHeight: 18 },
  bulletText: { flex: 1, fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 18 },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  disclaimerText: { fontSize: 10, color: colors.textMuted, flex: 1 },
});
