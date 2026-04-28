import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Svg, { Path, Ellipse, Circle, G } from 'react-native-svg';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';

type BodyArea = { id: string; label: string; symptoms: string[] };

const BODY_AREAS: BodyArea[] = [
  { id: 'head',     label: 'Head',          symptoms: ['Headache', 'Dizziness', 'Nausea', 'Migraine'] },
  { id: 'throat',   label: 'Throat / Neck', symptoms: ['Sore Throat', 'Difficulty Swallowing', 'Neck Pain'] },
  { id: 'chest',    label: 'Chest / Heart', symptoms: ['Chest Pain', 'Shortness of Breath', 'Palpitations'] },
  { id: 'abdomen',  label: 'Abdomen',       symptoms: ['Stomach Pain', 'Bloating', 'Nausea', 'Cramps'] },
  { id: 'back',     label: 'Back',          symptoms: ['Back Pain', 'Stiffness', 'Muscle Spasm'] },
  { id: 'leftArm',  label: 'Left Arm',      symptoms: ['Arm Pain', 'Numbness', 'Weakness'] },
  { id: 'rightArm', label: 'Right Arm',     symptoms: ['Arm Pain', 'Joint Pain', 'Swelling'] },
  { id: 'leftLeg',  label: 'Left Leg',      symptoms: ['Leg Pain', 'Swelling', 'Cramps'] },
  { id: 'rightLeg', label: 'Right Leg',     symptoms: ['Knee Pain', 'Leg Cramps', 'Numbness'] },
];

interface Props {
  highlightedAreas?: string[];
  onAreaPress?: (area: BodyArea) => void;
  gender?: string;
  adherence?: number; // 0–1, controls red intensity
}

// ─── SVG BODY SHAPES ─────────────────────────────────────────────────────────
// Simple schematic human body — works on all platforms (no WebView needed)

const W = 160; // viewBox width
const H = 340; // viewBox height

// Each region: { id, paths/shapes }
const REGIONS: Record<string, React.ReactNode> = {
  head: (
    <G key="head">
      {/* Head */}
      <Ellipse cx="80" cy="30" rx="22" ry="26" />
      {/* Neck */}
      <Path d="M72 54 L72 68 L88 68 L88 54 Z" />
    </G>
  ),
  throat: (
    <G key="throat">
      <Path d="M72 62 L72 72 L88 72 L88 62 Z" />
    </G>
  ),
  chest: (
    <G key="chest">
      {/* Torso upper */}
      <Path d="M55 72 Q50 80 50 100 L110 100 Q110 80 105 72 Z" />
      {/* Shoulders */}
      <Path d="M55 72 Q45 70 38 80 L45 100 L55 95 Z" />
      <Path d="M105 72 Q115 70 122 80 L115 100 L105 95 Z" />
    </G>
  ),
  abdomen: (
    <G key="abdomen">
      <Path d="M50 100 L50 155 Q80 162 110 155 L110 100 Z" />
    </G>
  ),
  back: (
    <G key="back">
      {/* Represented as lower torso overlay */}
      <Path d="M55 130 L55 160 Q80 166 105 160 L105 130 Z" />
    </G>
  ),
  leftArm: (
    <G key="leftArm">
      {/* Left arm (viewer's right) */}
      <Path d="M38 80 Q28 90 24 120 Q22 140 26 160 L36 158 Q34 138 36 118 L45 100 Z" />
      {/* Left forearm */}
      <Path d="M26 160 Q22 180 24 210 L34 208 Q32 180 36 158 Z" />
      {/* Left hand */}
      <Ellipse cx="29" cy="215" rx="7" ry="10" />
    </G>
  ),
  rightArm: (
    <G key="rightArm">
      {/* Right arm */}
      <Path d="M122 80 Q132 90 136 120 Q138 140 134 160 L124 158 Q126 138 124 118 L115 100 Z" />
      {/* Right forearm */}
      <Path d="M134 160 Q138 180 136 210 L126 208 Q128 180 124 158 Z" />
      {/* Right hand */}
      <Ellipse cx="131" cy="215" rx="7" ry="10" />
    </G>
  ),
  leftLeg: (
    <G key="leftLeg">
      {/* Left thigh */}
      <Path d="M50 155 Q46 185 48 215 L68 215 Q66 185 65 155 Z" />
      {/* Left shin */}
      <Path d="M48 215 Q46 250 48 280 L64 280 Q62 250 68 215 Z" />
      {/* Left foot */}
      <Path d="M48 280 Q44 295 50 300 L68 300 Q70 295 64 280 Z" />
    </G>
  ),
  rightLeg: (
    <G key="rightLeg">
      {/* Right thigh */}
      <Path d="M110 155 Q114 185 112 215 L92 215 Q94 185 95 155 Z" />
      {/* Right shin */}
      <Path d="M112 215 Q114 250 112 280 L96 280 Q98 250 92 215 Z" />
      {/* Right foot */}
      <Path d="M112 280 Q116 295 110 300 L92 300 Q90 295 96 280 Z" />
    </G>
  ),
};

export default function AnatomyViewer({ highlightedAreas = [], onAreaPress, gender, adherence = 1 }: Props) {
  const [selected, setSelected] = useState<BodyArea | null>(null);

  function getAreaColor(id: string): string {
    if (!highlightedAreas.includes(id)) return '#E2E8F0'; // neutral grey

    // Red intensity fades as adherence improves
    const redIntensity = Math.max(0.25, 1 - adherence);
    const r = Math.round(239 * redIntensity + 16 * (1 - redIntensity));
    const g = Math.round(68  * redIntensity + 185 * (1 - redIntensity));
    const b = Math.round(68  * redIntensity + 129 * (1 - redIntensity));
    return `rgb(${r},${g},${b})`;
  }

  function getStrokeColor(id: string): string {
    if (!highlightedAreas.includes(id)) return '#CBD5E1';
    return adherence > 0.8 ? colors.secondary : colors.emergency;
  }

  function handlePress(id: string) {
    const area = BODY_AREAS.find(a => a.id === id);
    if (!area) return;
    setSelected(selected?.id === id ? null : area);
    onAreaPress?.(area);
  }

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.emergency }]} />
          <Text style={styles.legendText}>Affected area</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
          <Text style={styles.legendText}>Recovering</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E2E8F0' }]} />
          <Text style={styles.legendText}>Normal</Text>
        </View>
      </View>

      {/* SVG Body */}
      <View style={styles.svgWrap}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {BODY_AREAS.map(area => {
            const fill   = getAreaColor(area.id);
            const stroke = getStrokeColor(area.id);
            const isHighlighted = highlightedAreas.includes(area.id);
            const isSelected    = selected?.id === area.id;

            return (
              <G
                key={area.id}
                fill={fill}
                stroke={stroke}
                strokeWidth={isSelected ? 2.5 : isHighlighted ? 1.5 : 1}
                opacity={isSelected ? 1 : 0.92}
                onPress={() => handlePress(area.id)}
              >
                {REGIONS[area.id]}
              </G>
            );
          })}

          {/* Body outline — always on top */}
          {/* Spine line */}
          <Path d="M80 68 L80 155" stroke="#94A3B8" strokeWidth="0.5" fill="none" strokeDasharray="3,3" />
        </Svg>
      </View>

      {/* Tap hint */}
      {highlightedAreas.length === 0 && (
        <Text style={styles.hint}>Tap any area to see symptoms</Text>
      )}

      {/* Selected area info */}
      {selected && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{selected.label}</Text>
          <View style={styles.symptomsRow}>
            {selected.symptoms.map(s => (
              <View key={s} style={styles.symptomChip}>
                <Text style={styles.symptomText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Highlighted areas list */}
      {highlightedAreas.length > 0 && (
        <View style={styles.highlightedList}>
          <Text style={styles.highlightedTitle}>Affected Areas</Text>
          <View style={styles.areaChipsRow}>
            {highlightedAreas.map(id => {
              const area = BODY_AREAS.find(a => a.id === id);
              return area ? (
                <TouchableOpacity
                  key={id}
                  style={[styles.areaChip, { borderColor: getStrokeColor(id) }]}
                  onPress={() => handlePress(id)}
                >
                  <View style={[styles.areaChipDot, { backgroundColor: getAreaColor(id) }]} />
                  <Text style={styles.areaChipText}>{area.label}</Text>
                </TouchableOpacity>
              ) : null;
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },

  legend: {
    flexDirection: 'row',
    gap: spacing.base,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: colors.textSecondary },

  svgWrap: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },

  hint: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },

  infoCard: {
    marginTop: spacing.md,
    width: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryMid,
  },
  infoTitle: { ...typography.h4, color: colors.primary, marginBottom: spacing.sm },
  symptomsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  symptomChip: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primaryMid,
  },
  symptomText: { fontSize: 12, color: colors.primary },

  highlightedList: { width: '100%', marginTop: spacing.md },
  highlightedTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  areaChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  areaChipDot:  { width: 8, height: 8, borderRadius: 4 },
  areaChipText: { fontSize: 12, color: colors.text, fontWeight: '600' },
});
