export const spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20,
  xl: 24, xxl: 32, xxxl: 48,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 9999,
};

export const shadows = {
  sm:        { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,  elevation: 2 },
  md:        { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,  elevation: 4 },
  lg:        { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  emergency: { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
};

export const typography = {
  h1:        { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2:        { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3:        { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  h4:        { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  body:      { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption:   { fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
  label:     { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
};

// ─── THEME COLORS ─────────────────────────────────────────────────────────────

export interface ThemeColors {
  primary: string; primaryLight: string; primaryDark: string; primaryMid: string;
  secondary: string; secondaryLight: string; secondaryDark: string;
  emergency: string; emergencyLight: string; emergencyDark: string;
  warning: string; warningLight: string;
  background: string; surface: string; surfaceElevated: string;
  text: string; textSecondary: string; textTertiary: string; textInverse: string;
  border: string; borderLight: string;
  overlay: string;
  severityLow: string; severityMedium: string; severityHigh: string;
}

export const lightColors: ThemeColors = {
  primary: '#0D9488', primaryLight: '#F0FDFA', primaryDark: '#0F766E', primaryMid: '#99F6E4',
  secondary: '#10B981', secondaryLight: '#ECFDF5', secondaryDark: '#059669',
  emergency: '#EF4444', emergencyLight: '#FEF2F2', emergencyDark: '#DC2626',
  warning: '#F59E0B', warningLight: '#FFFBEB',
  background: '#F8FAFC', surface: '#FFFFFF', surfaceElevated: '#FFFFFF',
  text: '#0F172A', textSecondary: '#64748B', textTertiary: '#94A3B8', textInverse: '#FFFFFF',
  border: '#E2E8F0', borderLight: '#F1F5F9',
  overlay: 'rgba(0,0,0,0.5)',
  severityLow: '#10B981', severityMedium: '#F59E0B', severityHigh: '#EF4444',
};

export const darkColors: ThemeColors = {
  primary: '#3B82F6', primaryLight: '#1E3A5F', primaryDark: '#2563EB', primaryMid: '#1E3A5F',
  secondary: '#10B981', secondaryLight: '#064E3B', secondaryDark: '#059669',
  emergency: '#EF4444', emergencyLight: '#450A0A', emergencyDark: '#DC2626',
  warning: '#F59E0B', warningLight: '#451A03',
  background: '#0F172A', surface: '#1E293B', surfaceElevated: '#334155',
  text: '#F1F5F9', textSecondary: '#94A3B8', textTertiary: '#64748B', textInverse: '#0F172A',
  border: '#334155', borderLight: '#1E293B',
  overlay: 'rgba(0,0,0,0.7)',
  severityLow: '#10B981', severityMedium: '#F59E0B', severityHigh: '#EF4444',
};
