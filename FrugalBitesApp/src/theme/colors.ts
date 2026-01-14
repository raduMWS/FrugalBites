/**
 * FrugalBites Color Theme
 * 
 * Green = Eco / Food Saving / Sustainability
 * Orange/Amber = Economy / Savings / Deals
 * Neutral grays for UI elements
 */

export const colors = {
  // Primary - Green (Eco, Food Saving, Sustainability)
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Main primary
    600: '#16a34a',  // Dark primary (current accent)
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Secondary - Amber/Orange (Economy, Savings, Deals)
  secondary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',  // Deal badges
    500: '#f59e0b',  // Main secondary
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Accent - Teal (Fresh, Quality)
  accent: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },

  // Success
  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#15803d',
  },

  // Warning
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#b45309',
  },

  // Error
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#b91c1c',
  },

  // Neutral / Gray
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f5f5f5',
    tertiary: '#fafafa',
    card: '#ffffff',
    eco: '#f0fdf4',      // Light green tint for eco sections
    savings: '#fffbeb',  // Light amber tint for savings sections
  },

  // Text colors
  text: {
    primary: '#171717',
    secondary: '#525252',
    tertiary: '#737373',
    inverse: '#ffffff',
    link: '#16a34a',
    deal: '#d97706',
  },

  // Border colors
  border: {
    light: '#e5e5e5',
    medium: '#d4d4d4',
    dark: '#a3a3a3',
  },

  // Semantic colors for the app
  eco: '#16a34a',        // Green - sustainability, food saving
  savings: '#f59e0b',    // Amber - economy, deals
  fresh: '#14b8a6',      // Teal - freshness, quality
  urgent: '#ef4444',     // Red - expiring soon
  
  // Discount badge colors
  discount: {
    background: '#dc2626',
    text: '#ffffff',
  },

  // Rating star color
  rating: '#fbbf24',

  // Tab bar
  tabBar: {
    active: '#16a34a',
    inactive: '#737373',
    background: '#ffffff',
  },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  fontSizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export default {
  colors,
  shadows,
  spacing,
  borderRadius,
  typography,
};
