export const colors = {
  // Primary palette
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryDark: '#0284C7',

  // Accent
  accent: '#14B8A6',
  accentLight: '#2DD4BF',
  accentDark: '#0D9488',

  // Backgrounds
  background: '#0A0E1A',
  backgroundLight: '#111827',
  backgroundCard: 'rgba(17, 24, 39, 0.8)',
  backgroundCardLight: 'rgba(30, 41, 59, 0.6)',

  // Surface / Glass
  surface: 'rgba(30, 41, 59, 0.5)',
  surfaceBorder: 'rgba(56, 189, 248, 0.15)',
  surfaceHover: 'rgba(30, 41, 59, 0.7)',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // Status
  success: '#22C55E',
  successLight: '#4ADE80',
  successDark: '#16A34A',
  successBg: 'rgba(34, 197, 94, 0.1)',

  danger: '#F43F5E',
  dangerLight: '#FB7185',
  dangerDark: '#E11D48',
  dangerBg: 'rgba(244, 63, 94, 0.1)',

  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  warningBg: 'rgba(245, 158, 11, 0.1)',

  // Water level colors
  waterHigh: '#0EA5E9',
  waterMedium: '#F59E0B',
  waterLow: '#F43F5E',
  waterFill: 'rgba(14, 165, 233, 0.3)',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  divider: 'rgba(148, 163, 184, 0.1)',
};

export const gradients = {
  primary: ['#0EA5E9', '#0284C7'] as const,
  accent: ['#14B8A6', '#0D9488'] as const,
  background: ['#0A0E1A', '#111827'] as const,
  backgroundReverse: ['#111827', '#0A0E1A'] as const,
  card: ['rgba(30, 41, 59, 0.6)', 'rgba(15, 23, 42, 0.8)'] as const,
  waterGauge: ['#0EA5E9', '#0284C7', '#0369A1'] as const,
  success: ['#22C55E', '#16A34A'] as const,
  danger: ['#F43F5E', '#E11D48'] as const,
  loginBg: ['#0A0E1A', '#0F172A', '#1E293B'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  huge: {
    fontSize: 48,
    fontWeight: '700' as const,
    letterSpacing: -1,
  },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  }),
};
