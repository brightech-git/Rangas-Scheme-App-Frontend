// src/providers/ThemeProvider.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import lightTheme from '../theme/light';
import darkTheme from '../theme/dark';
import type { ThemeContextType, ThemeMode, ThemePreference } from '../theme/types';
import { AsyncStorageHelper } from '../utils/AsyncStorageHelper';

const ThemeContext = createContext<ThemeContextType | null>(null);

const resolveIsDark = (pref: ThemePreference): boolean => {
  if (pref === 'dark') return true;
  if (pref === 'light') return false;
  return Appearance.getColorScheme() === 'dark';
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Start from the current system scheme so first paint matches the OS,
  // then hydrate the persisted preference (if any) once storage resolves.
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [isDark, setIsDark] = useState<boolean>(resolveIsDark('system'));

  // Hydrate persisted preference on mount
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorageHelper.getThemePreference();
      setPreference(stored);
      setIsDark(resolveIsDark(stored));
    })();
  }, []);

  // Keep in sync with OS changes while preference === 'system'
  useEffect(() => {
    if (preference !== 'system') return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });
    return () => sub.remove();
  }, [preference]);

  const setTheme = (pref: ThemePreference) => {
    setPreference(pref);
    setIsDark(resolveIsDark(pref));
    AsyncStorageHelper.setThemePreference(pref);
  };

  // Toggle flips to the opposite explicit mode and persists it
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const theme = isDark ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    ...theme,
    mode: theme.mode as ThemeMode,
    isDark,
    toggleTheme,
    preference,
    setTheme,
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
