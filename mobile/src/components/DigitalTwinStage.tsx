import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import Svg, {
  Polygon,
  Path,
  Defs,
  LinearGradient as SvgGradient,
  RadialGradient,
  Stop,
  Circle,
  G,
} from 'react-native-svg';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAGE_WIDTH = SCREEN_WIDTH - 40;
const STAGE_HEIGHT = 200;

interface DigitalTwinStageProps {
  vehicle: any;
}

export default function DigitalTwinStage({ vehicle }: DigitalTwinStageProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -5, duration: 2400, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ])
    );
    float.start();
    return () => float.stop();
  }, [floatAnim]);

  const modelLower = (vehicle?.model || '').toLowerCase();
  const makeLower = (vehicle?.make || '').toLowerCase();
  const isBike =
    makeLower.includes('royal enfield') ||
    makeLower.includes('hero') ||
    makeLower.includes('bajaj') ||
    makeLower.includes('yamaha') ||
    makeLower.includes('honda') ||
    makeLower.includes('ktm') ||
    makeLower.includes('tvs') ||
    makeLower.includes('suzuki') ||
    modelLower.includes('himalayan') ||
    modelLower.includes('meteor') ||
    modelLower.includes('classic') ||
    modelLower.includes('hunter') ||
    modelLower.includes('bullet') ||
    modelLower.includes('activa') ||
    modelLower.includes('splendor');

  return (
    <View style={[styles.container, { width: STAGE_WIDTH, height: STAGE_HEIGHT }]}>
      {/* Background Stage SVG */}
      <Svg width={STAGE_WIDTH} height={STAGE_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="stageGlow" cx="50%" cy="72%" rx="50%" ry="30%">
            <Stop offset="0%" stopColor="#00F2FE" stopOpacity="0.22" />
            <Stop offset="50%" stopColor="#0D9488" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#080C18" stopOpacity="0" />
          </RadialGradient>
          <SvgGradient id="hexTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#1A2440" />
            <Stop offset="50%" stopColor="#111B30" />
            <Stop offset="100%" stopColor="#0A1020" />
          </SvgGradient>
          <SvgGradient id="hexFrontL" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#0B1220" />
            <Stop offset="100%" stopColor="#060913" />
          </SvgGradient>
          <SvgGradient id="hexFrontR" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#142036" />
            <Stop offset="100%" stopColor="#070C16" />
          </SvgGradient>
        </Defs>

        {/* Under-glow */}
        <Circle cx={STAGE_WIDTH / 2} cy={140} r={STAGE_WIDTH * 0.42} fill="url(#stageGlow)" />

        {/* Hexagonal Pedestal */}
        {(() => {
          const cx = STAGE_WIDTH / 2;
          const cy = 132;
          const rx = STAGE_WIDTH * 0.42;
          const ry = 36;
          const h = 16;

          const p1 = `${cx},${cy - ry}`;
          const p2 = `${cx + rx},${cy - ry * 0.45}`;
          const p3 = `${cx + rx},${cy + ry * 0.45}`;
          const p4 = `${cx},${cy + ry}`;
          const p5 = `${cx - rx},${cy + ry * 0.45}`;
          const p6 = `${cx - rx},${cy - ry * 0.45}`;

          const bp3 = `${cx + rx},${cy + ry * 0.45 + h}`;
          const bp4 = `${cx},${cy + ry + h}`;
          const bp5 = `${cx - rx},${cy + ry * 0.45 + h}`;

          return (
            <G>
              <Polygon points={`${p5} ${p4} ${bp4} ${bp5}`} fill="url(#hexFrontL)" stroke="#00F2FE" strokeOpacity="0.2" strokeWidth="0.8" />
              <Polygon points={`${p4} ${p3} ${bp3} ${bp4}`} fill="url(#hexFrontR)" stroke="#00F2FE" strokeOpacity="0.2" strokeWidth="0.8" />
              <Polygon points={`${p1} ${p2} ${p3} ${p4} ${p5} ${p6}`} fill="url(#hexTopGrad)" stroke="#00F2FE" strokeWidth="1.8" strokeLinejoin="round" />
              <Polygon
                points={`${cx},${cy - ry * 0.7} ${cx + rx * 0.7},${cy - ry * 0.28} ${cx + rx * 0.7},${cy + ry * 0.28} ${cx},${cy + ry * 0.7} ${cx - rx * 0.7},${cy + ry * 0.28} ${cx - rx * 0.7},${cy - ry * 0.28}`}
                fill="none" stroke="rgba(0, 242, 254, 0.3)" strokeWidth="0.8" strokeDasharray="4,4"
              />
              <Path d={`M ${cx - rx},${cy + ry * 0.45} L ${cx},${cy + ry} L ${cx + rx},${cy + ry * 0.45}`} fill="none" stroke="#00F2FE" strokeWidth="2.2" />
            </G>
          );
        })()}
      </Svg>

      {/* Vehicle Graphic */}
      <Animated.View style={[styles.vehicleCenter, { transform: [{ translateY: floatAnim }] }]} pointerEvents="none">
        {isBike ? (
          <Svg width={170} height={105} viewBox="0 0 180 110">
            <Defs>
              <SvgGradient id="bikeMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#E2E8F0" />
                <Stop offset="40%" stopColor="#94A3B8" />
                <Stop offset="100%" stopColor="#334155" />
              </SvgGradient>
              <SvgGradient id="bikeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#00F2FE" />
                <Stop offset="100%" stopColor="#0D9488" />
              </SvgGradient>
            </Defs>
            <Circle cx="90" cy="98" r="60" fill="rgba(0,0,0,0.5)" />
            <Circle cx="40" cy="80" r="24" stroke="#475569" strokeWidth="6" fill="#0F172A" />
            <Circle cx="40" cy="80" r="14" stroke="#00F2FE" strokeWidth="1.5" fill="none" />
            <Circle cx="140" cy="80" r="24" stroke="#475569" strokeWidth="6" fill="#0F172A" />
            <Circle cx="140" cy="80" r="14" stroke="#00F2FE" strokeWidth="1.5" fill="none" />
            <Path d="M 40 80 L 80 50 L 115 48 L 140 80 M 80 50 L 105 75 L 140 80 M 65 46 L 100 46 L 90 70 Z" stroke="url(#bikeGlow)" strokeWidth="4" fill="url(#bikeMetal)" />
            <Path d="M 75 42 Q 95 32 110 44 Q 95 54 75 42 Z" fill="#00F2FE" stroke="#E2E8F0" strokeWidth="1.5" />
            <Path d="M 68 40 L 60 30 L 66 28" stroke="#E2E8F0" strokeWidth="3" fill="none" />
            <Circle cx="58" cy="34" r="4" fill="#00F2FE" />
          </Svg>
        ) : (
          <Svg width={220} height={95} viewBox="0 0 230 100">
            <Defs>
              <SvgGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="50%">
                <Stop offset="0%" stopColor="#F1F5F9" />
                <Stop offset="40%" stopColor="#94A3B8" />
                <Stop offset="80%" stopColor="#475569" />
                <Stop offset="100%" stopColor="#1E293B" />
              </SvgGradient>
              <SvgGradient id="carGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="rgba(0, 242, 254, 0.45)" />
                <Stop offset="100%" stopColor="rgba(15, 23, 42, 0.9)" />
              </SvgGradient>
            </Defs>
            <Path d="M 25 82 Q 115 94 205 82 Q 115 76 25 82 Z" fill="rgba(0,0,0,0.6)" />
            <Path d="M 20 70 Q 30 52 65 52 L 95 32 Q 145 30 170 52 L 205 60 Q 218 64 212 73 L 18 73 Z" fill="url(#carBody)" stroke="#00F2FE" strokeWidth="1.2" />
            <Path d="M 72 50 L 98 35 L 140 35 L 160 50 Z" fill="url(#carGlass)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <Path d="M 20 66 L 32 68 L 26 71 Z" fill="#00F2FE" />
            <Path d="M 208 63 L 214 65 L 210 70 Z" fill="#EF4444" />
            <Circle cx="58" cy="74" r="15" fill="#0F172A" stroke="#64748B" strokeWidth="4" />
            <Circle cx="58" cy="74" r="7" fill="#1E293B" stroke="#00F2FE" strokeWidth="1.5" />
            <Circle cx="172" cy="74" r="15" fill="#0F172A" stroke="#64748B" strokeWidth="4" />
            <Circle cx="172" cy="74" r="7" fill="#1E293B" stroke="#00F2FE" strokeWidth="1.5" />
          </Svg>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleCenter: {
    position: 'absolute',
    top: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
