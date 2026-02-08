import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BoardsPage from './BoardsPage';

import type { BoardModel } from '@/hooks/useBoards';

const nav = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => nav.navigate,
  };
});

const hooks = vi.hoisted(() => ({
  boards: [] as BoardModel[],
  loading: false,
  createBoard: vi.fn(async (payload: any) => ({
    id: 'new-id',
    title: payload.title,
  })),
  getBoardBackgroundStyle: vi.fn((_b: BoardModel) => undefined as React.CSSProperties | undefined),
}));

vi.mock('@/hooks/useBoards', () => ({
  useBoards: () => ({
    boards: hooks.boards,
    loading: hooks.loading,
    createBoard: hooks.createBoard,
  }),
  getBoardBackgroundStyle: (b: BoardModel) => hooks.getBoardBackgroundStyle(b),
}));

vi.mock('../../components/TopBar/TopBar', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return { default: () => React.createElement('div', { 'data-testid': 'TopBar' }, 'TopBar') };
});

vi.mock('../../components/SideMenu/SideMenu', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return { default: () => React.createElement('div', { 'data-testid': 'SideMenu' }, 'SideMenu') };
});

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
                background_thumb_url: 'https://images.unsplash.com/photo-xxx?auto=format&fit=crop&w=2400&q=60',
              }),
          },
          'CBM_CREATE',
        ),
      );
    },
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <BoardsPage />
    </MemoryRouter>,
  );
}

describe('pages/BoardsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.navigate = vi.fn();

    hooks.loading = false;
    hooks.boards = [];

    hooks.createBoard = vi.fn(async (payload: any) => ({
      id: 'new-id',
      title: payload.title,
    }));

    hooks.getBoardBackgroundStyle = vi.fn((_b: BoardModel) => undefined);

    modal.lastProps = null;
  });

  it('renders TopBar + SideMenu', () => {
    renderPage();
    expect(screen.getByTestId('TopBar')).toBeTruthy();
    expect(screen.getByTestId('SideMenu')).toBeTruthy();
  });

  it('sets aria-busy based on loading', () => {
    hooks.loading = true;
    renderPage();

    const grid = screen.getByRole('main').querySelector('[aria-busy]') as HTMLElement;
    expect(grid).toBeTruthy();
    expect(grid.getAttribute('aria-busy')).toBe('true');
  });

  it('renders boards and navigates when clicking a board card', () => {
    hooks.boards = [
      { id: 'b1', title: 'Board 1' },
      { id: 'b2', title: 'Board 2' },
    ] as any;

    renderPage();

    fireEvent.click(screen.getByText('Board 2'));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('/boards/b2');
  });

  it('applies preview backgroundImage when getBoardBackgroundStyle returns a value', () => {
    hooks.boards = [{ id: 'b1', title: 'Board 1' }] as any;

    hooks.getBoardBackgroundStyle = vi.fn(() => ({
      backgroundImage: 'url(https://img.test/x.png)',
    }));

    renderPage();

    expect(hooks.getBoardBackgroundStyle).toHaveBeenCalledTimes(1);

    const btn = screen.getByRole('button', { name: /board 1/i });
    const preview = btn.querySelector('div') as HTMLDivElement;
    expect(preview).toBeTruthy();

    expect(preview.style.backgroundImage).toContain('url(');
    expect(preview.style.backgroundImage).toContain('https://img.test/x.png');
  });

  it('opens CreateBoardModal when clicking "Create new board"', () => {
    renderPage();

    expect(screen.getByTestId('cbm-open')).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: /create new board/i }));
    expect(screen.getByTestId('cbm-open')).toHaveTextContent('true');
  });

  it('CreateBoardModal onClose closes modal', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /create new board/i }));
    expect(screen.getByTestId('cbm-open')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'CBM_CLOSE' }));
    expect(screen.getByTestId('cbm-open')).toHaveTextContent('false');
  });

  it('CreateBoardModal onCreate calls createBoard, closes modal and navigates to created board', async () => {
    hooks.createBoard = vi.fn(async (payload: any) => ({
      id: 'created-123',
      title: payload.title,
    }));

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /create new board/i }));
    expect(screen.getByTestId('cbm-open')).toHaveTextContent('true');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'CBM_CREATE' }));
    });

    expect(hooks.createBoard).toHaveBeenCalledTimes(1);

    expect(hooks.createBoard).toHaveBeenCalledWith({
      title: '  New Board  ',
      background_kind: 'unsplash',
      background_value: 'img-1',
      background_thumb_url: 'https://images.unsplash.com/photo-xxx?auto=format&fit=crop&w=2400&q=60',
    });

    expect(screen.getByTestId('cbm-open')).toHaveTextContent('false');

    expect(nav.navigate).toHaveBeenCalledWith('/boards/created-123');
  });
});
