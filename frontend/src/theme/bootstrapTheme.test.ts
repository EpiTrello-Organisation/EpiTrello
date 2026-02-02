import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  readThemePreference,
  writeThemePreference,
  getSystemTheme,
  resolveTheme,
  applyThemeToDocument,
  bootstrapTheme,
} from './bootstrapTheme';

function mockMatchMedia(matches: boolean) {
  const mq = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => mq) as any);
  return mq;
}

describe('theme/bootstrapTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = '';
    vi.unstubAllGlobals();
  });

  it('readThemePreference returns system by default', () => {
    expect(readThemePreference()).toBe('system');
  });

  it('readThemePreference returns stored valid value', () => {
    localStorage.setItem('theme-preference', 'dark');
    expect(readThemePreference()).toBe('dark');

    localStorage.setItem('theme-preference', 'light');
    expect(readThemePreference()).toBe('light');

    localStorage.setItem('theme-preference', 'system');
    expect(readThemePreference()).toBe('system');
  });

  it('readThemePreference returns system for invalid stored value', () => {
    localStorage.setItem('theme-preference', 'banana');
    expect(readThemePreference()).toBe('system');
  });

  it('writeThemePreference stores value', () => {
    writeThemePreference('dark');
    expect(localStorage.getItem('theme-preference')).toBe('dark');
  });

  it('getSystemTheme returns dark when prefers-color-scheme: dark matches', () => {
    mockMatchMedia(true);
    expect(getSystemTheme()).toBe('dark');
  });

  it('getSystemTheme returns light when prefers-color-scheme: dark does not match', () => {
    mockMatchMedia(false);
    expect(getSystemTheme()).toBe('light');
  });

  it('resolveTheme returns preference when not system', () => {
    mockMatchMedia(true);
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('resolveTheme returns system theme when preference is system', () => {
    mockMatchMedia(true);
    expect(resolveTheme('system')).toBe('dark');

    mockMatchMedia(false);
    expect(resolveTheme('system')).toBe('light');
  });

  it('applyThemeToDocument sets document dataset', () => {
    applyThemeToDocument('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('bootstrapTheme applies resolved theme from stored preference', () => {
    localStorage.setItem('theme-preference', 'light');
    mockMatchMedia(true); // should not matter because pref is light
    bootstrapTheme();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('bootstrapTheme uses system theme when stored pref is system', () => {
    localStorage.setItem('theme-preference', 'system');
    mockMatchMedia(true);
    bootstrapTheme();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('bootstrapTheme falls back to system theme on error', () => {
    // Force readThemePreference to throw by breaking localStorage.getItem
    const originalGetItem = localStorage.getItem;
    (localStorage as any).getItem = () => {
      throw new Error('boom');
    };

    mockMatchMedia(false);
    bootstrapTheme();
    expect(document.documentElement.dataset.theme).toBe('light');

    // restore
    (localStorage as any).getItem = originalGetItem;
  });
});
