export const colors = {
  // Background colors
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',

  // Primary brand colors
  primary: '#1E3A8A',
  primaryLight: '#3B82F6',
  primaryDark: '#1E40AF',

  // Text colors
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',

  // Text object for nested access
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    tertiary: '#94A3B8',
  },

  // Status colors
  success: '#059669',
  successLight: '#10B981',
  error: '#DC2626',
  errorLight: '#EF4444',
  warning: '#D97706',
  warningLight: '#F59E0B',
  info: '#2563EB',

  // Border colors
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderDark: '#CBD5E1',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const shadows = {
  sm: {
    shadowColor: '#5B6B7C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#5B6B7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#5B6B7C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const typography = {
  // Typography styles
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: colors.textTertiary,
  },
  // Size tokens for direct access
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
  },
  // Weight tokens for direct access
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const inputStyles = {
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600' as const,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    ...shadows.sm,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1,
  },
};

export const buttonStyles = {
  primary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.md,
  },
  primaryDisabled: {
    backgroundColor: colors.border,
    ...shadows.sm,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  text: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  textSecondary: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
};

export const cardStyles = {
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
};