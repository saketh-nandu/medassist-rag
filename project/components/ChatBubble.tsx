import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle, Info, ChevronRight } from 'lucide-react-native';
import { ChatMessage, SeverityLevel } from '@/context/AppContext';
import { colors } from '@/constants/colors';
import { radius, shadows, spacing, typography } from '@/constants/theme';

interface ChatBubbleProps {
  message: ChatMessage;
  onViewBody?: (areas: string[]) => void;
}

const severityConfig: Record<SeverityLevel, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  low: {
    color: colors.secondary,
    bg: colors.secondaryLight,
    icon: <CheckCircle size={14} color={colors.secondary} />,
    label: 'Low Risk',
  },
  medium: {
    color: colors.warning,
    bg: colors.warningLight,
    icon: <Info size={14} color={colors.warning} />,
    label: 'Moderate',
  },
  high: {
    color: colors.emergency,
    bg: colors.emergencyLight,
    icon: <AlertCircle size={14} color={colors.emergency} />,
    label: 'High Risk',
  },
};

export default function ChatBubble({ message, onViewBody }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  const severity = message.severity;
  const cfg = severity ? severityConfig[severity] : null;

  return (
    <View style={styles.aiBubbleContainer}>
      <View style={styles.avatarDot} />
      <View style={styles.aiCard}>
        {cfg && (
          <View style={[styles.severityBadge, { backgroundColor: cfg.bg }]}>
            {cfg.icon}
            <Text style={[styles.severityLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        )}

        <Text style={styles.aiText}>{message.content}</Text>

        {message.conditions && message.conditions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Possible Conditions</Text>
            {message.conditions.map((c, i) => (
              <View key={i} style={styles.conditionRow}>
                <View style={[styles.dot, { backgroundColor: cfg?.color ?? colors.primary }]} />
                <Text style={styles.conditionText}>{c}</Text>
              </View>
            ))}
          </View>
        )}

        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Actions</Text>
            {message.suggestedActions.map((a, i) => (
              <View key={i} style={styles.actionRow}>
                <Text style={styles.actionNumber}>{i + 1}</Text>
                <Text style={styles.actionText}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        {message.affectedAreas && message.affectedAreas.length > 0 && onViewBody && (
          <View
            style={styles.viewBodyBtn}
            // @ts-ignore
            onStartShouldSetResponder={() => true}
            onResponderRelease={() => onViewBody(message.affectedAreas!)}
          >
            <Text style={styles.viewBodyText}>View on Body Map</Text>
            <ChevronRight size={14} color={colors.primary} />
          </View>
        )}

        <Text style={styles.disclaimer}>
          This is not a medical diagnosis. Please consult a healthcare professional.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.base,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    borderBottomRightRadius: 4,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    maxWidth: '80%',
    ...shadows.sm,
  },
  userText: {
    color: '#fff',
    ...typography.body,
  },
  aiBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.base,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  avatarDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    marginTop: 2,
  },
  aiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderTopLeftRadius: 4,
    padding: spacing.base,
    ...shadows.md,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  severityLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  aiText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  conditionText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  actionNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  actionText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.text,
    lineHeight: 18,
  },
  viewBodyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  viewBodyText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.md,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
