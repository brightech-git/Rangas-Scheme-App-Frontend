// src/providers/ThemeProvider.tsx

import React, { createContext, useContext, useState } from 'react';
import lightTheme from '../theme/light';
import darkTheme from '../theme/dark';
import type { ThemeContextType, ThemeMode } from '../theme/types';

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => setIsDark(prev => !prev);

  const value: ThemeContextType = {
    ...theme,
    mode: theme.mode as ThemeMode,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
