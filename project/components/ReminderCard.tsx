import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Check, X, Pill, Bell } from 'lucide-react-native';
import { Reminder } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { radius, shadows, spacing, typography } from '@/constants/theme';
import { sendTestNotification } from '@/lib/notifications';

interface Props {
  reminder: Reminder;
  onToggleTaken: () => void;
  onDelete: () => void;
}

export default function ReminderCard({ reminder, onToggleTaken, onDelete }: Props) {
  const { colors } = useTheme();

  // Adherence progress: 0 → 1
  const progress   = reminder.totalDoses > 0
    ? Math.min(reminder.takenDoses / reminder.totalDoses, 1)
    : 0;

  // Redness fades as adherence improves
  // 0% taken → full red tint, 100% taken → green
  const redOpacity   = Math.max(0, 1 - progress);
  const cardBorderColor = reminder.takenToday
    ? colors.secondary
    : redOpacity > 0.5
      ? `rgba(239,68,68,${redOpacity * 0.6})`
      : colors.border;

  const progressPct = Math.round(progress * 100);

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.surface,
        borderLeftWidth: 3,
        borderLeftColor: cardBorderColor,
      },
    ]}>
      {/* Icon */}
      <View style={[styles.iconWrap, {
        backgroundColor: reminder.takenToday ? colors.secondaryLight : colors.primaryLight,
      }]}>
        <Pill size={20} color={reminder.takenToday ? colors.secondary : colors.primary} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{reminder.medicineName}</Text>
        <Text style={[styles.dosage, { color: colors.textSecondary }]}>
          {reminder.dosage} · {reminder.frequency}
        </Text>
        <View style={styles.timeRow}>
          {reminder.timeSlots.map((t, i) => (
            <View key={i} style={[styles.timeChip, { backgroundColor: colors.borderLight }]}>
              <Clock size={10} color={colors.textSecondary} />
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>{t}</Text>
            </View>
          ))}
        </View>

        {/* Adherence progress bar */}
        <View style={styles.progressWrap}>
          <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
            <View style={[
              styles.progressFill,
              {
                width: `${progressPct}%` as any,
                backgroundColor: progressPct >= 80
                  ? colors.secondary
                  : progressPct >= 40
                    ? colors.warning
                    : colors.emergency,
              },
            ]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textTertiary }]}>
            {reminder.takenDoses}/{reminder.totalDoses} doses · {progressPct}%
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.checkBtn,
            { backgroundColor: reminder.takenToday ? colors.secondary : colors.borderLight },
          ]}
          onPress={onToggleTaken}
        >
          <Check size={16} color={reminder.takenToday ? '#fff' : colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => sendTestNotification(reminder.medicineName, reminder.dosage)}
        >
          <Bell size={13} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <X size={14} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.md,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  name:   { ...typography.h4 },
  dosage: { ...typography.bodySmall, marginTop: 2 },
  timeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  timeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full,
  },
  timeText: { ...typography.caption },
  progressWrap: { marginTop: spacing.sm, gap: 3 },
  progressBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 10 },
  actions: { gap: spacing.sm, alignItems: 'center' },
  checkBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bellBtn:  { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
