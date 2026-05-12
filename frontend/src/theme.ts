export const lightColors = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceSecondary: '#F4F3F0',
  accent: '#C4956A',
  accentSoft: '#F5EDE3',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#ABABAB',
  border: '#E8E6E1',
  success: '#5C9B6E',
  error: '#C0392B',
  safe: '#5B8DB8',
  playful: '#C4956A',
  bold: '#8B5E6B',
} as const;

export const darkColors = {
  background: '#1A1A1A',
  surface: '#242424',
  surfaceSecondary: '#2A2A2A',
  accent: '#C4956A',
  accentSoft: '#2C1F0F',
  textPrimary: '#F0EEE9',
  textSecondary: '#ABABAB',
  textTertiary: '#555555',
  border: '#333333',
  success: '#5C9B6E',
  error: '#C0392B',
  safe: '#5B8DB8',
  playful: '#C4956A',
  bold: '#8B5E6B',
} as const;

export type AppColors = typeof lightColors;

export const colors = lightColors;

export const typography = {
  sizes: {
    small: 12,
    label: 13,
    base: 15,
    heading: 18,
    title: 22,
  },
  lineHeights: {
    small: 18,
    label: 19,
    base: 23,
    heading: 26,
    title: 30,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
