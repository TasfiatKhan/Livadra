import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { lightColors, darkColors, AppColors } from '../theme';

const THEME_KEY = 'theme_preference';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  colors: AppColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then(value => {
      if (value === 'dark') setIsDark(true);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      SecureStore.setItemAsync(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ isDark, toggleTheme, colors: isDark ? darkColors : lightColors }),
    [isDark, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
