// Theme configuration for light and dark modes
export const lightTheme = {
  colors: {
    // Primary colors
    primary: '#667eea',
    primaryHover: '#5a67d8',
    primaryLight: '#e6f3ff',
    
    // Background colors
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundTertiary: '#f1f5f9',
    
    // Text colors
    text: '#2d3748',
    textSecondary: '#4a5568',
    textTertiary: '#718096',
    textInverse: '#ffffff',
    
    // Border colors
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    borderDark: '#cbd5e0',
    
    // Status colors
    success: '#48bb78',
    successLight: '#c6f6d5',
    warning: '#ed8936',
    warningLight: '#fef5e7',
    error: '#e53e3e',
    errorLight: '#fed7d7',
    info: '#4299e1',
    infoLight: '#bee3f8',
    
    // Shadow colors
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowDark: 'rgba(0, 0, 0, 0.2)',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '50%',
  },
  
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    xxl: '1.5rem',
    xxxl: '2rem',
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  transitions: {
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
};

export const darkTheme = {
  colors: {
    // Primary colors
    primary: '#7c3aed',
    primaryHover: '#8b5cf6',
    primaryLight: '#2d1b69',
    
    // Background colors
    background: '#1a202c',
    backgroundSecondary: '#2d3748',
    backgroundTertiary: '#4a5568',
    
    // Text colors
    text: '#f7fafc',
    textSecondary: '#e2e8f0',
    textTertiary: '#a0aec0',
    textInverse: '#1a202c',
    
    // Border colors
    border: '#4a5568',
    borderLight: '#2d3748',
    borderDark: '#718096',
    
    // Status colors
    success: '#68d391',
    successLight: '#22543d',
    warning: '#f6ad55',
    warningLight: '#744210',
    error: '#fc8181',
    errorLight: '#742a2a',
    info: '#63b3ed',
    infoLight: '#2a4365',
    
    // Shadow colors
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowDark: 'rgba(0, 0, 0, 0.5)',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '50%',
  },
  
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    xxl: '1.5rem',
    xxxl: '2rem',
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  transitions: {
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
};

// CSS custom properties for theme switching
export const createThemeVariables = (theme) => {
  return {
    '--color-primary': theme.colors.primary,
    '--color-primary-hover': theme.colors.primaryHover,
    '--color-primary-light': theme.colors.primaryLight,
    '--color-background': theme.colors.background,
    '--color-background-secondary': theme.colors.backgroundSecondary,
    '--color-background-tertiary': theme.colors.backgroundTertiary,
    '--color-text': theme.colors.text,
    '--color-text-secondary': theme.colors.textSecondary,
    '--color-text-tertiary': theme.colors.textTertiary,
    '--color-text-inverse': theme.colors.textInverse,
    '--color-border': theme.colors.border,
    '--color-border-light': theme.colors.borderLight,
    '--color-border-dark': theme.colors.borderDark,
    '--color-success': theme.colors.success,
    '--color-success-light': theme.colors.successLight,
    '--color-warning': theme.colors.warning,
    '--color-warning-light': theme.colors.warningLight,
    '--color-error': theme.colors.error,
    '--color-error-light': theme.colors.errorLight,
    '--color-info': theme.colors.info,
    '--color-info-light': theme.colors.infoLight,
    '--color-shadow': theme.colors.shadow,
    '--color-shadow-dark': theme.colors.shadowDark,
    '--color-overlay': theme.colors.overlay,
    '--spacing-xs': theme.spacing.xs,
    '--spacing-sm': theme.spacing.sm,
    '--spacing-md': theme.spacing.md,
    '--spacing-lg': theme.spacing.lg,
    '--spacing-xl': theme.spacing.xl,
    '--spacing-xxl': theme.spacing.xxl,
    '--border-radius-sm': theme.borderRadius.sm,
    '--border-radius-md': theme.borderRadius.md,
    '--border-radius-lg': theme.borderRadius.lg,
    '--border-radius-xl': theme.borderRadius.xl,
    '--border-radius-full': theme.borderRadius.full,
    '--font-size-xs': theme.fontSize.xs,
    '--font-size-sm': theme.fontSize.sm,
    '--font-size-md': theme.fontSize.md,
    '--font-size-lg': theme.fontSize.lg,
    '--font-size-xl': theme.fontSize.xl,
    '--font-size-xxl': theme.fontSize.xxl,
    '--font-size-xxxl': theme.fontSize.xxxl,
    '--font-weight-normal': theme.fontWeight.normal,
    '--font-weight-medium': theme.fontWeight.medium,
    '--font-weight-semibold': theme.fontWeight.semibold,
    '--font-weight-bold': theme.fontWeight.bold,
    '--transition-fast': theme.transitions.fast,
    '--transition-normal': theme.transitions.normal,
    '--transition-slow': theme.transitions.slow,
  };
};
