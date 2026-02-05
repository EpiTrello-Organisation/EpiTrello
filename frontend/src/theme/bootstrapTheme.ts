export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme-preference';

export function readThemePreference(): ThemePreference {
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return 'system';
}

export function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  return pref === 'system' ? getSystemTheme() : pref;
}

export function applyThemeToDocument(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
}

// Called before React to prevent flashbang effect
export function bootstrapTheme() {
  try {
    const pref = readThemePreference();
    const theme = resolveTheme(pref);
    applyThemeToDocument(theme);
  } catch {
    applyThemeToDocument(getSystemTheme());
  }
}

export function writeThemePreference(pref: ThemePreference) {
  localStorage.setItem(STORAGE_KEY, pref);
}
