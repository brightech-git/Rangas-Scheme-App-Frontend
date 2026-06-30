// src/theme/types.ts

import theme from './theme';
import lightTheme from './light';

// Derive types directly from the actual theme values
export type ThemeColors = typeof lightTheme.COLORS;
export type ThemeFonts = typeof theme.FONTS;
export type ThemeSizes = typeof theme.SIZES;
export type ThemeShadows = typeof theme.SHADOWS;
export type ThemeBreakpoints = typeof theme.BREAKPOINTS;
export type ThemeMode = 'light' | 'dark';

export type AppTheme = {
  mode: ThemeMode;
  COLORS: ThemeColors;
  FONTS: ThemeFonts;
  SIZES: ThemeSizes;
  SHADOWS: ThemeShadows;
  BREAKPOINTS: ThemeBreakpoints;
  scale: (size: number) => number;
  verticalScale: (size: number) => number;
  moderateScale: (size: number, factor?: number) => number;
  fontScale: (size: number) => number;
};

export type ThemeContextType = AppTheme & {
  isDark: boolean;
  toggleTheme: () => void;
};
