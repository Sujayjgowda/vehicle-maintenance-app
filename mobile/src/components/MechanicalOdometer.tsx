import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const DIGIT_HEIGHT = 44;
const DIGIT_WIDTH = 26;
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface TumblerColumnProps {
  digit: number;
  delayIndex: number;
}

function TumblerColumn({ digit, delayIndex }: TumblerColumnProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delayIndex * 80),
      Animated.timing(animatedValue, {
        toValue: digit,
        duration: 900,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [digit, delayIndex]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 9],
    outputRange: [0, -9 * DIGIT_HEIGHT],
  });

  return (
    <View style={styles.tumblerSlot}>
      <Animated.View style={[styles.digitsStrip, { transform: [{ translateY }] }]}>
        {DIGITS.map((d) => (
          <View key={d} style={styles.digitCell}>
            <Text style={styles.digitText}>{d}</Text>
          </View>
        ))}
      </Animated.View>
      {/* Cylindrical lighting overlay for 3D barrel depth */}
      <LinearGradient
        colors={['rgba(0,0,0,0.85)', 'transparent', 'transparent', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.25, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}

interface MechanicalOdometerProps {
  odometer: number;
  label?: string;
  unit?: string;
}

export default function MechanicalOdometer({
  odometer,
  label = 'MECHANICAL ROLLING ODOMETER',
  unit = 'KM',
}: MechanicalOdometerProps) {
  // Pad with leading zeros up to 6 digits or take raw string
  const numStr = Math.max(0, Math.round(odometer || 0)).toString();
  // Format with commas, e.g. "48,274"
  const formattedStr = Number(numStr).toLocaleString('en-IN');
  const chars = formattedStr.split('');

  let digitCount = 0;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.headerLabel}>{label}</Text> : null}
      
      <View style={styles.bezelOuter}>
        <View style={styles.bezelInner}>
          <View style={styles.tumblerRow}>
            {chars.map((char, index) => {
              if (char === ',') {
                return (
                  <View key={`comma-${index}`} style={styles.commaSlot}>
                    <Text style={styles.commaText}>,</Text>
                  </View>
                );
              }

              const digit = parseInt(char, 10);
              const currentDelay = digitCount;
              digitCount += 1;

              return (
                <TumblerColumn
                  key={`digit-${index}-${char}`}
                  digit={isNaN(digit) ? 0 : digit}
                  delayIndex={currentDelay}
                />
              );
            })}

            {unit ? (
              <View style={styles.unitSlot}>
                <Text style={styles.unitText}>{unit}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <Text style={styles.subLabel}>ROLLING ODOMETER</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.neumorphTextSecondary,
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  bezelOuter: {
    backgroundColor: '#0A0F1A',
    padding: 3,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1E2B47',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },
  bezelInner: {
    backgroundColor: '#050811',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tumblerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tumblerSlot: {
    width: DIGIT_WIDTH,
    height: DIGIT_HEIGHT,
    backgroundColor: '#0E1627',
    marginHorizontal: 2,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1F2E4D',
  },
  digitsStrip: {
    width: DIGIT_WIDTH,
  },
  digitCell: {
    width: DIGIT_WIDTH,
    height: DIGIT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 0,
    textShadowColor: 'rgba(0, 242, 254, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  commaSlot: {
    width: 10,
    height: DIGIT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  commaText: {
    color: colors.neonCyan,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  unitSlot: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  unitText: {
    color: colors.neonCyan,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.neumorphTextMuted,
    letterSpacing: 1.5,
    marginTop: 6,
  },
});
