import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopBar from './TopBar';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/auth/token', () => ({
  logout: vi.fn(),
}));

const setPreferenceMock = vi.fn();
vi.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ preference: 'dark', setPreference: setPreferenceMock }),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function renderTopBar() {
  return render(
    <MemoryRouter>
      <TopBar />
    </MemoryRouter>,
  );
}

describe('components/TopBar (theme aria-pressed)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('theme buttons reflect preference via aria-pressed', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));

    const light = screen.getByRole('button', { name: /light/i });
    const dark = screen.getByRole('button', { name: /dark/i });
    const system = screen.getByRole('button', { name: /match system/i });

    expect(dark.getAttribute('aria-pressed')).toBe('true');
    expect(light.getAttribute('aria-pressed')).toBe('false');
    expect(system.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking a theme calls setPreference and closes menus', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));

    fireEvent.click(screen.getByRole('button', { name: /light/i }));

    expect(setPreferenceMock).toHaveBeenCalledTimes(1);
    expect(setPreferenceMock).toHaveBeenCalledWith('light');

    expect(screen.queryByRole('button', { name: /^theme$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /match system/i })).toBeNull();
  });
});
