import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, shadows, spacing, typography } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const containerStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    variant === 'danger' && shadows.emergency,
    style,
  ];

  const labelStyle = [styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`], textStyle];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#fff'} size="small" />
      ) : (
        <>
          {icon}
          <Text style={labelStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  secondary: {
    backgroundColor: colors.secondary,
    ...shadows.md,
  },
  danger: {
    backgroundColor: colors.emergency,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: colors.primaryLight,
  },
  size_sm: { paddingVertical: 8, paddingHorizontal: 14 },
  size_md: { paddingVertical: 13, paddingHorizontal: 20 },
  size_lg: { paddingVertical: 16, paddingHorizontal: 28 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  label: { ...typography.body, fontWeight: '600' },
  label_primary: { color: '#fff' },
  label_secondary: { color: '#fff' },
  label_danger: { color: '#fff' },
  label_outline: { color: colors.primary },
  label_ghost: { color: colors.primary },

  labelSize_sm: { fontSize: 13 },
  labelSize_md: { fontSize: 15 },
  labelSize_lg: { fontSize: 17 },
});
