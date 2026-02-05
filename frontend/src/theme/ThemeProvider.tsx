import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ThemePreference } from './bootstrapTheme';
import {
  applyThemeToDocument,
  getSystemTheme,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
} from './bootstrapTheme';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setPreference: (pref: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readThemePreference());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(readThemePreference()),
  );

  useEffect(() => {
    writeThemePreference(preference);
    const t = resolveTheme(preference);
    setResolvedTheme(t);
    applyThemeToDocument(t);
  }, [preference]);

  useEffect(() => {
    if (preference !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const t = getSystemTheme();
      setResolvedTheme(t);
      applyThemeToDocument(t);
    };

    onChange();

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }

    // Old Safari
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [preference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedTheme,
      setPreference: setPreferenceState,
    }),
    [preference, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
