import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

import { ThemeProvider, useTheme } from './ThemeProvider';

function makeMatchMedia({ matches, modern }: { matches: boolean; modern: boolean }) {
  let current = matches;

  const mq: any = {
    get matches() {
      return current;
    },
    set matches(v: boolean) {
      current = v;
    },
  };

  const changeHandlers: Array<() => void> = [];

  if (modern) {
    mq.addEventListener = vi.fn((_evt: string, cb: () => void) => changeHandlers.push(cb));
    mq.removeEventListener = vi.fn((_evt: string, cb: () => void) => {
      const i = changeHandlers.indexOf(cb);
      if (i >= 0) changeHandlers.splice(i, 1);
    });
  } else {
    mq.addListener = vi.fn((cb: () => void) => changeHandlers.push(cb));
    mq.removeListener = vi.fn((cb: () => void) => {
      const i = changeHandlers.indexOf(cb);
      if (i >= 0) changeHandlers.splice(i, 1);
    });
  }

  const triggerChange = (nextMatches: boolean) => {
    mq.matches = nextMatches;
    changeHandlers.forEach((cb) => cb());
  };

  vi.stubGlobal('matchMedia', vi.fn(() => mq) as any);

  return { mq, triggerChange };
}

function TestConsumer() {
  const { preference, resolvedTheme, setPreference } = useTheme();

  return (
    <div>
      <div data-testid="pref">{preference}</div>
      <div data-testid="resolved">{resolvedTheme}</div>

      <button onClick={() => setPreference('dark')}>set-dark</button>
      <button onClick={() => setPreference('light')}>set-light</button>
      <button onClick={() => setPreference('system')}>set-system</button>
    </div>
  );
}

describe('theme/ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = '';
    vi.unstubAllGlobals();
  });

  it('useTheme throws if used outside ThemeProvider', () => {
    function Bad() {
      useTheme();
      return null;
    }

    expect(() => render(<Bad />)).toThrow('useTheme must be used within ThemeProvider');
  });

  it('initializes from stored preference and applies theme', () => {
    localStorage.setItem('theme-preference', 'dark');
    makeMatchMedia({ matches: false, modern: true });

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('pref').textContent).toBe('dark');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('setPreference writes to storage and updates document theme', async () => {
    makeMatchMedia({ matches: false, modern: true });

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(localStorage.getItem('theme-preference')).toBe('system'); // default
    expect(document.documentElement.dataset.theme).toMatch(/light|dark/);

    await act(async () => {
      screen.getByText('set-dark').click();
    });

    expect(screen.getByTestId('pref').textContent).toBe('dark');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(localStorage.getItem('theme-preference')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('in system mode (modern addEventListener): reacts to matchMedia changes', async () => {
    const { triggerChange } = makeMatchMedia({ matches: false, modern: true });

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    // Ensure we are in system
    expect(screen.getByTestId('pref').textContent).toBe('system');

    // Initially light (matches false)
    expect(screen.getByTestId('resolved').textContent).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');

    // Switch system to dark (matches true)
    await act(async () => {
      triggerChange(true);
    });

    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('in system mode (old Safari addListener): reacts to matchMedia changes', async () => {
    const { triggerChange } = makeMatchMedia({ matches: false, modern: false });

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('pref').textContent).toBe('system');
    expect(screen.getByTestId('resolved').textContent).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');

    await act(async () => {
      triggerChange(true);
    });

    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('does not subscribe to matchMedia changes when preference is not system', async () => {
    const { mq, triggerChange } = makeMatchMedia({ matches: false, modern: true });

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    // switch away from system
    await act(async () => {
      screen.getByText('set-dark').click();
    });

    expect(screen.getByTestId('pref').textContent).toBe('dark');

    // trigger change shouldn't affect resolvedTheme (stays dark)
    await act(async () => {
      triggerChange(true);
    });

    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    // In modern mode, we should have subscribed once initially (system),
    // then removed subscription when leaving system.
    expect(mq.addEventListener).toHaveBeenCalled();
    expect(mq.removeEventListener).toHaveBeenCalled();
  });
});
