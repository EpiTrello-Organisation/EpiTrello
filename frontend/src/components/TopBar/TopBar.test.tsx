import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopBar from './TopBar';
import { ThemeProvider } from '@/theme/ThemeProvider';

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

const navigateMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/auth/token', () => ({
  logout: () => logoutMock(),
}));

import type { BoardModel } from '@/hooks/useBoards';

const hooks = vi.hoisted(() => ({
  boards: [] as BoardModel[],
  createBoard: vi.fn(async (payload: any) => ({ id: 'created-1', title: payload.title })),
  getBoardBackgroundStyle: vi.fn((_b: BoardModel) => undefined as React.CSSProperties | undefined),
}));

vi.mock('@/hooks/useBoards', () => ({
  useBoards: () => ({
    boards: hooks.boards,
    loading: false,
    createBoard: hooks.createBoard,
  }),
  getBoardBackgroundStyle: (b: BoardModel) => hooks.getBoardBackgroundStyle(b),
}));

const modal = vi.hoisted(() => ({
  lastProps: null as any,
}));

vi.mock('@/components/CreateBoardModal/CreateBoardModal', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: (props: any) => {
      modal.lastProps = props;

      return React.createElement(
        'div',
        { 'data-testid': 'CreateBoardModal' },
        React.createElement('div', { 'data-testid': 'cbm-open' }, String(props.open)),
        React.createElement('button', { onClick: props.onClose }, 'CBM_CLOSE'),
        React.createElement(
          'button',
          {
            onClick: () =>
              props.onCreate({
                title: '  New Board  ',
                background_kind: 'unsplash',
                background_value: 'img-1',
                background_thumb_url:
                  'https://images.unsplash.com/photo-xxx?auto=format&fit=crop&w=2400&q=60',
              }),
          },
          'CBM_CREATE',
        ),
      );
    },
  };
});

function renderTopBar() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <TopBar />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

function firePointerDown(target: EventTarget) {
  const ev = new PointerEvent('pointerdown', { bubbles: true });
  Object.defineProperty(ev, 'target', { value: target });
  window.dispatchEvent(ev);
}

function firePointerDownOn(el: Element) {
  fireEvent.pointerDown(el);
}

describe('components/TopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    localStorage.clear();

    hooks.boards = [];
    hooks.createBoard = vi.fn(async (payload: any) => ({ id: 'created-1', title: payload.title }));
    hooks.getBoardBackgroundStyle = vi.fn((_b: BoardModel) => undefined);

    modal.lastProps = null;
  });

  it('renders base UI: link to boards, search input, Create button', () => {
    renderTopBar();

    expect(screen.getByRole('link', { name: /go to boards/i })).toBeTruthy();
    expect(screen.getByRole('searchbox', { name: /search boards/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^create$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /profile/i })).toBeTruthy();
  });

  it('toggles profile menu when clicking Profile', () => {
    renderTopBar();

    expect(screen.queryByRole('button', { name: /^theme$/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(screen.getByRole('button', { name: /^theme$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /log out/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(screen.queryByRole('button', { name: /^theme$/i })).toBeNull();
  });

  it('Theme button toggles theme submenu', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));

    expect(screen.queryByRole('button', { name: /match system/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));

    expect(screen.getByRole('button', { name: /light/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /dark/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /match system/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));
    expect(screen.queryByRole('button', { name: /match system/i })).toBeNull();
  });

  it('clicking Profile closes theme submenu (setThemeOpen(false))', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));
    expect(screen.getByRole('button', { name: /match system/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(screen.queryByRole('button', { name: /match system/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(screen.queryByRole('button', { name: /match system/i })).toBeNull();
  });

  it('clicking inside wrapper does not close menu', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(screen.getByRole('button', { name: /^theme$/i })).toBeTruthy();

    firePointerDown(screen.getByRole('button', { name: /profile/i }));

    expect(screen.getByRole('button', { name: /^theme$/i })).toBeTruthy();
  });

  it('clicking inside theme menu does not close menu', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));

    const darkBtn = screen.getByRole('button', { name: /dark/i });
    firePointerDown(darkBtn);

    expect(screen.getByRole('button', { name: /^theme$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /match system/i })).toBeTruthy();
  });

  it('Log Out calls logout() and navigates to /login', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('clicking outside closes menu and theme when menuOpen is true', () => {
    const { container } = renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));
    expect(screen.getByRole('button', { name: /match system/i })).toBeTruthy();

    const outside = document.createElement('div');
    document.body.appendChild(outside);

    firePointerDownOn(document.body);

    expect(screen.queryByRole('button', { name: /^theme$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /match system/i })).toBeNull();

    expect(container.querySelector('header')).toBeTruthy();
  });

  it('selecting Dark calls theme change and closes theme + profile menus', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));

    fireEvent.click(screen.getByRole('button', { name: /dark/i }));

    expect(screen.queryByRole('button', { name: /^theme$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /match system/i })).toBeNull();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('theme buttons update aria-pressed after selecting a theme', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));

    fireEvent.click(screen.getByRole('button', { name: /dark/i }));

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));

    const light = screen.getByRole('button', { name: /light/i });
    const dark = screen.getByRole('button', { name: /dark/i });
    const system = screen.getByRole('button', { name: /match system/i });

    expect(dark.getAttribute('aria-pressed')).toBe('true');
    expect(light.getAttribute('aria-pressed')).toBe('false');
    expect(system.getAttribute('aria-pressed')).toBe('false');
  });

  it('Search shows matching boards with thumb + name', () => {
    hooks.boards = [
      {
        id: 'b1',
        title: 'Alpha Board',
        owner_id: 'u1',
        background_kind: 'gradient',
        background_value: 'g-1',
      },
      {
        id: 'b2',
        title: 'Beta Project',
        owner_id: 'u1',
        background_kind: 'unsplash',
        background_thumb_url: 'https://img.test/beta.png',
      },
      { id: 'b3', title: 'Gamma', owner_id: 'u1' },
    ] as any;

    hooks.getBoardBackgroundStyle = vi.fn((b: any) =>
      b.id === 'b2' ? ({ backgroundImage: 'url(https://img.test/beta.png)' } as any) : undefined,
    );

    renderTopBar();

    const input = screen.getByRole('searchbox', { name: /search boards/i });
    fireEvent.change(input, { target: { value: 'be' } });

    expect(screen.getByRole('button', { name: /beta project/i })).toBeTruthy();

    expect(hooks.getBoardBackgroundStyle).toHaveBeenCalled();
  });

  it('Clicking a search result navigates to the board and clears search', () => {
    hooks.boards = [{ id: 'b2', title: 'Beta Project', owner_id: 'u1' }] as any;

    renderTopBar();

    const input = screen.getByRole('searchbox', { name: /search boards/i });
    fireEvent.change(input, { target: { value: 'beta' } });

    fireEvent.click(screen.getByRole('button', { name: /beta project/i }));

    expect(navigateMock).toHaveBeenCalledWith('/boards/b2');
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('Pressing Enter in search opens the first result', () => {
    hooks.boards = [
      { id: 'b1', title: 'Board 1', owner_id: 'u1' },
      { id: 'b2', title: 'Board 2', owner_id: 'u1' },
    ] as any;

    renderTopBar();

    const input = screen.getByRole('searchbox', { name: /search boards/i });
    fireEvent.change(input, { target: { value: 'board' } });

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(navigateMock).toHaveBeenCalledWith('/boards/b1');
  });

  it('Clicking Create opens CreateBoardModal', () => {
    renderTopBar();

    expect(screen.getByTestId('cbm-open')).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
    expect(screen.getByTestId('cbm-open')).toHaveTextContent('true');
  });

  it('CreateBoardModal onCreate calls createBoard and navigates to created board', async () => {
    hooks.createBoard = vi.fn(async (payload: any) => ({
      id: 'created-123',
      title: payload.title,
    }));

    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
    expect(screen.getByTestId('cbm-open')).toHaveTextContent('true');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'CBM_CREATE' }));
    });

    expect(hooks.createBoard).toHaveBeenCalledTimes(1);
    expect(hooks.createBoard).toHaveBeenCalledWith({
      title: '  New Board  ',
      background_kind: 'unsplash',
      background_value: 'img-1',
      background_thumb_url:
        'https://images.unsplash.com/photo-xxx?auto=format&fit=crop&w=2400&q=60',
    });

    expect(navigateMock).toHaveBeenCalledWith('/boards/created-123');
    expect(screen.getByTestId('cbm-open')).toHaveTextContent('false');
  });
});
