import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, G, Line, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

interface VehicleHealthGaugeProps {
  score?: number; // 0 to 100
  size?: number;
}

export default function VehicleHealthGauge({ score = 94, size = 126 }: VehicleHealthGaugeProps) {
  const animatedScore = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const strokeWidth = 10;
  const radius = (size - strokeWidth - 14) / 2;
  const circumference = 2 * Math.PI * radius;

  // Status computation
  const statusLabel =
    score >= 90
      ? 'EXCELLENT'
      : score >= 75
      ? 'GOOD'
      : score >= 60
      ? 'FAIR'
      : 'ATTENTION';

  const statusColor =
    score >= 90
      ? colors.neonCyan
      : score >= 75
      ? colors.neonGreen
      : score >= 60
      ? colors.neonAmber
      : colors.neonRed;

  useEffect(() => {
    Animated.timing(animatedScore, {
      toValue: score,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.95, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [score, animatedScore, pulseAnim]);

  // Tick marks array (e.g. 24 ticks around the perimeter)
  const numTicks = 24;
  const tickRadius = radius + 8;
  const ticks = Array.from({ length: numTicks }, (_, i) => {
    const angle = (i * 360) / numTicks - 90;
    const rad = (angle * Math.PI) / 180;
    const x1 = size / 2 + (tickRadius - 3) * Math.cos(rad);
    const y1 = size / 2 + (tickRadius - 3) * Math.sin(rad);
    const x2 = size / 2 + (tickRadius + 1) * Math.cos(rad);
    const y2 = size / 2 + (tickRadius + 1) * Math.sin(rad);
    const active = (i / numTicks) * 100 <= score;
    return { x1, y1, x2, y2, active };
  });

  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <View style={[styles.container, { width: size + 20 }]}>
      <View style={styles.svgWrap}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <SvgGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#00F2FE" />
              <Stop offset="100%" stopColor="#0D9488" />
            </SvgGradient>
          </Defs>

          {/* Outer futuristic tick marks */}
          {ticks.map((t, idx) => (
            <Line
              key={idx}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.active ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255,255,255,0.06)'}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          ))}

          {/* Track circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(0, 242, 254, 0.12)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Glowing active arc */}
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#healthGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </G>
        </Svg>

        {/* Center content */}
        <Animated.View style={[styles.centerWrap, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={[styles.scoreText, { color: statusColor }]}>{score}%</Text>
        </Animated.View>
      </View>

      {/* Sub status text */}
      <View style={styles.statusRow}>
        <Text style={styles.statusPrefix}>STATUS: </Text>
        <Text style={[styles.statusValue, { color: statusColor }]}>{statusLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 242, 254, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusPrefix: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.neumorphTextMuted,
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
