import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BoardPage from './BoardPage';

import type { CardModel } from '@/components/BoardCard/BoardCard';
import type { ListModel } from '@/components/BoardList/BoardList';

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
  board: { id: 'b1', title: 'My Board' } as any,
  loadingBoard: false,
  renameBoard: vi.fn(),
  deleteBoard: vi.fn(async () => true),

  lists: [{ id: 'l1', title: 'L1' }] as ListModel[],
  loadingLists: false,
  addList: vi.fn(),
  renameList: vi.fn(),
  deleteList: vi.fn(),
  reorderLists: vi.fn(),

  cardsByListId: { l1: [] as CardModel[] } as Record<string, CardModel[]>,
  loadingCards: false,
  addCard: vi.fn(),
  renameCard: vi.fn(),
  editDescription: vi.fn(),
  deleteCard: vi.fn(async () => {}),
  setCardLabelsLocal: vi.fn(),
  updateCardLabels: vi.fn(),
  moveCardBetweenListsPreview: vi.fn(),
  commitCardsMove: vi.fn(),
  reorderCards: vi.fn(),

  sensors: [] as any[],
  onDragEnd: vi.fn(),
}));

vi.mock('@/hooks/useBoard', () => ({
  useBoard: (_boardId?: string) => ({
    board: hooks.board,
    loadingBoard: hooks.loadingBoard,
    actions: {
      renameBoard: hooks.renameBoard,
      deleteBoard: hooks.deleteBoard,
    },
  }),
}));

vi.mock('@/hooks/useList', () => ({
  useList: (_boardId?: string) => ({
    lists: hooks.lists,
    loadingLists: hooks.loadingLists,
    actions: {
      addList: hooks.addList,
      renameList: hooks.renameList,
      deleteList: hooks.deleteList,
    },
    dnd: {
      reorderLists: hooks.reorderLists,
    },
  }),
}));

vi.mock('@/hooks/useCard', () => ({
  useCard: (_boardId?: string, _lists?: ListModel[]) => ({
    cardsByListId: hooks.cardsByListId,
    loadingCards: hooks.loadingCards,
    actions: {
      addCard: hooks.addCard,
      renameCard: hooks.renameCard,
      editDescription: hooks.editDescription,
      deleteCard: hooks.deleteCard,
      setCardLabelsLocal: hooks.setCardLabelsLocal,
      updateCardLabels: hooks.updateCardLabels,
    },
    dnd: {
      moveCardBetweenListsPreview: hooks.moveCardBetweenListsPreview,
      commitCardsMove: hooks.commitCardsMove,
      reorderCards: hooks.reorderCards,
    },
  }),
}));

vi.mock('@/hooks/useSortableLists', () => ({
  useSortableLists: (_args: any) => ({
    sensors: hooks.sensors,
    onDragEnd: hooks.onDragEnd,
  }),
}));

const children = vi.hoisted(() => ({
  lastBoardTopBarProps: null as any,
  lastKanbanProps: null as any,
  lastModalProps: null as any,
}));

vi.mock('@/components/TopBar/TopBar', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return { default: () => React.createElement('div', { 'data-testid': 'TopBar' }, 'TopBar') };
});

vi.mock('@/components/BoardTopBar/BoardTopBar', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: (props: any) => {
      children.lastBoardTopBarProps = props;
      return React.createElement(
        'div',
        { 'data-testid': 'BoardTopBar' },
        React.createElement('div', { 'data-testid': 'btb-title' }, props.title),
        React.createElement('button', { onClick: () => props.onRename('X') }, 'RENAME'),
        React.createElement('button', { onClick: props.onDeleteBoard }, 'DELETE_BOARD'),
      );
    },
  };
});

vi.mock('@/components/BoardKanban/BoardKanban', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: (props: any) => {
      children.lastKanbanProps = props;

      const cardFromState = props.cardsByListId?.l1?.[0];

      return React.createElement(
        'div',
        { 'data-testid': 'BoardKanban' },
        React.createElement('div', { 'data-testid': 'kanban-loading' }, String(props.loading)),
        React.createElement(
          'button',
          {
            onClick: () => props.onOpenCard(cardFromState),
          },
          'OPEN_CARD',
        ),
      );
    },
  };
});

vi.mock('@/components/CardModal/CardModal', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: (props: any) => {
      children.lastModalProps = props;
      return React.createElement(
        'div',
        { 'data-testid': 'CardModal' },
        React.createElement('div', { 'data-testid': 'modal-card-id' }, props.card.id),
        React.createElement(
          'div',
          { 'data-testid': 'modal-labels' },
          (props.card.label_ids ?? []).join(','),
        ),
        React.createElement('button', { onClick: props.onClose }, 'CLOSE_MODAL'),
        React.createElement('button', { onClick: () => props.onRename(' New ') }, 'RENAME_CARD'),
        React.createElement('button', { onClick: props.onDeleteCard }, 'DELETE_CARD'),
        React.createElement(
          'button',
          { onClick: () => props.onUpdateLabels([0, 2]) },
          'UPDATE_LABELS',
        ),
        React.createElement(
          'button',
          { onClick: () => props.onEditDescription('<p>Hello</p>') },
          'EDIT_DESC',
        ),
      );
    },
  };
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/boards/:boardId" element={<BoardPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function getPageEl(container: HTMLElement): HTMLDivElement {
  const el = container.querySelector('div[class*="page"]') as HTMLDivElement | null;
  expect(el).toBeTruthy();
  return el!;
}

describe('pages/BoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.navigate = vi.fn();

    hooks.board = { id: 'b1', title: 'My Board' } as any;
    hooks.loadingBoard = false;
    hooks.loadingLists = false;
    hooks.loadingCards = false;
    hooks.deleteBoard = vi.fn(async () => true);

    hooks.lists = [{ id: 'l1', title: 'L1' }] as any;
    hooks.cardsByListId = {
      l1: [
        {
          id: 'c1',
          title: 'Card 1',
          description: null,
          position: 0,
          list_id: 'l1',
          creator_id: 'u',
          created_at: new Date().toISOString(),
          label_ids: [1],
        },
      ],
    };

    children.lastBoardTopBarProps = null;
    children.lastKanbanProps = null;
    children.lastModalProps = null;
  });

  it('renders TopBar, BoardTopBar, BoardKanban', () => {
    renderAt('/boards/b1');
    expect(screen.getByTestId('TopBar')).toBeTruthy();
    expect(screen.getByTestId('BoardTopBar')).toBeTruthy();
    expect(screen.getByTestId('BoardKanban')).toBeTruthy();
  });

  it('passes board.title to BoardTopBar when board exists', () => {
    hooks.board = { id: 'b1', title: 'Hello' } as any;
    renderAt('/boards/b1');
    expect(screen.getByTestId('btb-title')).toHaveTextContent('Hello');
  });

  it('falls back to "Board" when board is null', () => {
    hooks.board = null as any;
    const { container } = renderAt('/boards/b1');
    expect(screen.getByTestId('btb-title')).toHaveTextContent('Board');

    const page = getPageEl(container);
    expect(page.style.backgroundImage).toBe('');
  });

  it('computes loading as OR of loadingBoard/loadingLists/loadingCards', () => {
    hooks.loadingBoard = false;
    hooks.loadingLists = true;
    hooks.loadingCards = false;

    renderAt('/boards/b1');
    expect(screen.getByTestId('kanban-loading')).toHaveTextContent('true');
  });

  it('delete board: when ok=true navigates to /boards', async () => {
    hooks.deleteBoard = vi.fn(async () => true);

    renderAt('/boards/b1');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'DELETE_BOARD' }));
    });

    expect(hooks.deleteBoard).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('/boards');
  });

  it('delete board: when ok=false does not navigate', async () => {
    hooks.deleteBoard = vi.fn(async () => false);

    renderAt('/boards/b1');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'DELETE_BOARD' }));
    });

    expect(hooks.deleteBoard).toHaveBeenCalledTimes(1);
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('opens CardModal when BoardKanban calls onOpenCard', () => {
    renderAt('/boards/b1');

    expect(screen.queryByTestId('CardModal')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'OPEN_CARD' }));
    expect(screen.getByTestId('CardModal')).toBeTruthy();
    expect(screen.getByTestId('modal-card-id')).toHaveTextContent('c1');
  });

  it('CardModal onClose closes modal', () => {
    renderAt('/boards/b1');
    fireEvent.click(screen.getByRole('button', { name: 'OPEN_CARD' }));

    fireEvent.click(screen.getByRole('button', { name: 'CLOSE_MODAL' }));
    expect(screen.queryByTestId('CardModal')).toBeNull();
  });

  it('CardModal onRename calls cardActions.renameCard(selectedCard.id, selectedCard.list_id, nextTitle)', () => {
    renderAt('/boards/b1');
    fireEvent.click(screen.getByRole('button', { name: 'OPEN_CARD' }));

    fireEvent.click(screen.getByRole('button', { name: 'RENAME_CARD' }));

    expect(hooks.renameCard).toHaveBeenCalledTimes(1);
    expect(hooks.renameCard).toHaveBeenCalledWith('c1', 'l1', ' New ');
  });

  it('CardModal onDeleteCard calls deleteCard and closes modal', async () => {
    hooks.deleteCard = vi.fn(async () => {});
    renderAt('/boards/b1');

    fireEvent.click(screen.getByRole('button', { name: 'OPEN_CARD' }));
    expect(screen.getByTestId('CardModal')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'DELETE_CARD' }));
    });

    expect(hooks.deleteCard).toHaveBeenCalledTimes(1);
    expect(hooks.deleteCard).toHaveBeenCalledWith('c1', 'l1');
    expect(screen.queryByTestId('CardModal')).toBeNull();
  });

  it('CardModal onUpdateLabels calls updateCardLabels(selectedCard.id, selectedCard.list_id, nextLabelIds)', () => {
    renderAt('/boards/b1');
    fireEvent.click(screen.getByRole('button', { name: 'OPEN_CARD' }));

    expect(screen.getByTestId('modal-labels')).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('button', { name: 'UPDATE_LABELS' }));

    expect(hooks.updateCardLabels).toHaveBeenCalledTimes(1);
    expect(hooks.updateCardLabels).toHaveBeenCalledWith('c1', 'l1', [0, 2]);
  });

  it('wires list + card callbacks into BoardKanban props', () => {
    renderAt('/boards/b1');

    const p = children.lastKanbanProps;
    expect(p).toBeTruthy();

    expect(p.onRenameList).toBe(hooks.renameList);
    expect(p.onDeleteList).toBe(hooks.deleteList);
    expect(p.onAddList).toBe(hooks.addList);

    expect(p.onAddCard).toBe(hooks.addCard);
    expect(p.onMoveCardBetweenLists).toBe(hooks.moveCardBetweenListsPreview);
    expect(p.onCommitCards).toBe(hooks.commitCardsMove);

    expect(p.sensors).toBe(hooks.sensors);
    expect(p.onDragEnd).toBe(hooks.onDragEnd);
  });

  it('applies unsplash backgroundImage when board.background_kind="unsplash" and has thumb url', () => {
    hooks.board = {
      id: 'b1',
      title: 'My Board',
      background_kind: 'unsplash',
      background_thumb_url:
        'https://images.unsplash.com/photo-abc?auto=format&fit=crop&w=2400&q=60',
      background_value: 'img-1',
    } as any;

    const { container } = renderAt('/boards/b1');
    const page = getPageEl(container);

    expect(page.style.backgroundImage).toContain('url(');
    expect(page.style.backgroundImage).toContain('images.unsplash.com');
  });

  it('does not apply unsplash backgroundImage when thumb url is missing', () => {
    hooks.board = {
      id: 'b1',
      title: 'My Board',
      background_kind: 'unsplash',
      background_thumb_url: null,
      background_value: 'img-1',
    } as any;

    const { container } = renderAt('/boards/b1');
    const page = getPageEl(container);

    expect(page.style.backgroundImage).toBe('');
  });

  it('applies gradient backgroundImage when board.background_kind="gradient" and key is known', () => {
    hooks.board = {
      id: 'b1',
      title: 'My Board',
      background_kind: 'gradient',
      background_value: 'g-2',
    } as any;

    const { container } = renderAt('/boards/b1');
    const page = getPageEl(container);

    expect(page.style.backgroundImage).toContain('linear-gradient');
  });

  it('does not apply gradient backgroundImage when gradient key is unknown', () => {
    hooks.board = {
      id: 'b1',
      title: 'My Board',
      background_kind: 'gradient',
      background_value: 'g-999',
    } as any;

    const { container } = renderAt('/boards/b1');
    const page = getPageEl(container);

    expect(page.style.backgroundImage).toBe('');
  });

  it('does not apply backgroundImage when background_kind is unknown', () => {
    hooks.board = {
      id: 'b1',
      title: 'My Board',
      background_kind: 'weird',
      background_value: 'x',
    } as any;

    const { container } = renderAt('/boards/b1');
    const page = getPageEl(container);

    expect(page.style.backgroundImage).toBe('');
  });

  it('BoardTopBar onRename calls boardActions.renameBoard', () => {
    renderAt('/boards/b1');

    fireEvent.click(screen.getByRole('button', { name: 'RENAME' }));

    expect(hooks.renameBoard).toHaveBeenCalledTimes(1);
    expect(hooks.renameBoard).toHaveBeenCalledWith('X');
  });

  it('CardModal onEditDescription calls cardActions.editDescription(selectedCard.id, selectedCard.list_id, nextDescription)', () => {
    renderAt('/boards/b1');
    fireEvent.click(screen.getByRole('button', { name: 'OPEN_CARD' }));

    fireEvent.click(screen.getByRole('button', { name: 'EDIT_DESC' }));

    expect(hooks.editDescription).toHaveBeenCalledTimes(1);
    expect(hooks.editDescription).toHaveBeenCalledWith('c1', 'l1', '<p>Hello</p>');
  });

  it('does not open CardModal if selectedCardId is set but card is not found in cardsByListId', () => {
    renderAt('/boards/b1');

    act(() => {
      children.lastKanbanProps.onOpenCard({ id: 'missing-card' });
    });

    expect(screen.queryByTestId('CardModal')).toBeNull();
  });

  it.each(['g-1', 'g-3', 'g-4', 'g-5', 'g-6'])(
    'applies gradient backgroundImage for known key %s',
    (key) => {
      hooks.board = {
        id: 'b1',
        title: 'My Board',
        background_kind: 'gradient',
        background_value: key,
      } as any;

      const { container } = renderAt('/boards/b1');
      const page = getPageEl(container);

      expect(page.style.backgroundImage).toContain('linear-gradient');
    },
  );
});
