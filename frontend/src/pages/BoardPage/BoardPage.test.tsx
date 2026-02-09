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

const fetcher = vi.hoisted(() => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/api/fetcher', () => ({
  apiFetch: (path: string, options?: RequestInit) => fetcher.apiFetch(path, options),
}));

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

const memberMock = vi.hoisted(() => ({
  actions: {
    getBoardMembers: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/hooks/useMember', () => ({
  useMember: () => ({
    loading: false,
    error: null,
    actions: memberMock.actions,
  }),
}));

async function renderAt(path: string) {
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/boards/:boardId" element={<BoardPage />} />
      </Routes>
    </MemoryRouter>,
  );

  await act(async () => {
    await Promise.resolve();
  });

  return utils;
}

function getPageEl(container: HTMLElement): HTMLDivElement {
  const el = container.querySelector('div[class*="page"]') as HTMLDivElement | null;
  expect(el).toBeTruthy();
  return el!;
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mockRes({ ok, json }: { ok: boolean; json: unknown }) {
  return {
    ok,
    json: async () => json,
  } as any;
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('pages/BoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetcher.apiFetch.mockResolvedValue(mockRes({ ok: true, json: [] }));
    memberMock.actions.getBoardMembers.mockResolvedValue([]);
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

  it('renders TopBar, BoardTopBar, BoardKanban', async () => {
    await renderAt('/boards/b1');
    await flushEffects();
    expect(screen.getByTestId('TopBar')).toBeTruthy();
    expect(screen.getByTestId('BoardTopBar')).toBeTruthy();
    expect(screen.getByTestId('BoardKanban')).toBeTruthy();
  });

  it('passes board.title to BoardTopBar when board exists', async () => {
    hooks.board = { id: 'b1', title: 'Hello' } as any;
    await renderAt('/boards/b1');
    await flushEffects();
    expect(screen.getByTestId('btb-title')).toHaveTextContent('Hello');
  });

  it('falls back to "Board" when board is null', async () => {
    hooks.board = null as any;
    const { container } = await renderAt('/boards/b1');
    await flushEffects();
    expect(screen.getByTestId('btb-title')).toHaveTextContent('Board');

    const page = getPageEl(container);
    expect(page.style.backgroundImage).toBe('');
  });

  it('computes loading as OR of loadingBoard/loadingLists/loadingCards', async () => {
    hooks.loadingBoard = false;
    hooks.loadingLists = true;
    hooks.loadingCards = false;

    await renderAt('/boards/b1');
    await flushEffects();
    expect(screen.getByTestId('kanban-loading')).toHaveTextContent('true');
  });

  it('delete board: when ok=true navigates to /boards', async () => {
    hooks.deleteBoard = vi.fn(async () => true);

    await renderAt('/boards/b1');
    await flushEffects();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'DELETE_BOARD' }));
    });

    expect(hooks.deleteBoard).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('/boards');
  });

  it('delete board: when ok=false does not navigate', async () => {
    hooks.deleteBoard = vi.fn(async () => false);

    await renderAt('/boards/b1');
    await flushEffects();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'DELETE_BOARD' }));
    });

    expect(hooks.deleteBoard).toHaveBeenCalledTimes(1);
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('opens CardModal when BoardKanban calls onOpenCard', async () => {
    await renderAt('/boards/b1');
    await flushEffects();

    expect(screen.queryByTestId('CardModal')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'OPEN_CARD' }));
    expect(screen.getByTestId('CardModal')).toBeTruthy();
    expect(screen.getByTestId('modal-card-id')).toHaveTextContent('c1');
  });

  it('CardModal onClose closes modal', async () => {
    await renderAt('/boards/b1');
    await flushEffects();
    fireEvent.click(screen.getByRole('button', { name: 'OPEN_CARD' }));

    fireEvent.click(screen.getByRole('button', { name: 'CLOSE_MODAL' }));
    expect(screen.queryByTestId('CardModal')).toBeNull();
  });

  it('CardModal onRename calls cardActions.renameCard(selectedCard.id, selectedCard.list_id, nextTitle)', async () => {
    await renderAt('/boards/b1');
    await flushEffects();
    fireEvent.click(screen.getByRole('button', { name: 'OPEN_CARD' }));

    fireEvent.click(screen.getByRole('button', { name: 'RENAME_CARD' }));

    expect(hooks.renameCard).toHaveBeenCalledTimes(1);
    expect(hooks.renameCard).toHaveBeenCalledWith('c1', 'l1', ' New ');
  });

  it('CardModal onDeleteCard calls deleteCard and closes modal', async () => {
    hooks.deleteCard = vi.fn(async () => {});
    await renderAt('/boards/b1');
    await flushEffects();

    fireEvent.click(screen.getByRole('button', { name: 'OPEN_CARD' }));
    expect(screen.getByTestId('CardModal')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'DELETE_CARD' }));
    });

    expect(hooks.deleteCard).toHaveBeenCalledTimes(1);
    expect(hooks.deleteCard).toHaveBeenCalledWith('c1', 'l1');
    expect(screen.queryByTestId('CardModal')).toBeNull();
  });

  it('CardModal onUpdateLabels calls updateCardLabels(selectedCard.id, selectedCard.list_id, nextLabelIds)', async () => {
    await renderAt('/boards/b1');
    await flushEffects();
    fireEvent.click(screen.getByRole('button', { name: 'OPEN_CARD' }));

    expect(screen.getByTestId('modal-labels')).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('button', { name: 'UPDATE_LABELS' }));

    expect(hooks.updateCardLabels).toHaveBeenCalledTimes(1);
    expect(hooks.updateCardLabels).toHaveBeenCalledWith('c1', 'l1', [0, 2]);
  });

  it('wires list + card callbacks into BoardKanban props', async () => {
    await renderAt('/boards/b1');
    await flushEffects();

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

  it('applies unsplash backgroundImage when board.background_kind="unsplash" and has thumb url', async () => {
    hooks.board = {
      id: 'b1',
      title: 'My Board',
      background_kind: 'unsplash',
      background_thumb_url:
        'https://images.unsplash.com/photo-abc?auto=format&fit=crop&w=2400&q=60',
      background_value: 'img-1',
    } as any;

    const { container } = await renderAt('/boards/b1');
    await flushEffects();
    const page = getPageEl(container);

    expect(page.style.backgroundImage).toContain('url(');
    expect(page.style.backgroundImage).toContain('images.unsplash.com');
  });

  it('does not apply unsplash backgroundImage when thumb url is missing', async () => {
    hooks.board = {
      id: 'b1',
      title: 'My Board',
      background_kind: 'unsplash',
      background_thumb_url: null,
      background_value: 'img-1',
    } as any;

    const { container } = await renderAt('/boards/b1');
    await flushEffects();
    const page = getPageEl(container);

    expect(page.style.backgroundImage).toBe('');
  });

  it('applies gradient backgroundImage when board.background_kind="gradient" and key is known', async () => {
    hooks.board = {
      id: 'b1',
      title: 'My Board',
      background_kind: 'gradient',
      background_value: 'g-2',
    } as any;

    const { container } = await renderAt('/boards/b1');
    await flushEffects();
    const page = getPageEl(container);

    expect(page.style.backgroundImage).toContain('linear-gradient');
  });

  it('does not apply gradient backgroundImage when gradient key is unknown', async () => {
    hooks.board = {
      id: 'b1',
      title: 'My Board',
      background_kind: 'gradient',
      background_value: 'g-999',
    } as any;

    const { container } = await renderAt('/boards/b1');
    await flushEffects();
    const page = getPageEl(container);

    expect(page.style.backgroundImage).toBe('');
  });

  it('does not apply backgroundImage when background_kind is unknown', async () => {
    hooks.board = {
      id: 'b1',
      title: 'My Board',
      background_kind: 'weird',
      background_value: 'x',
    } as any;

    const { container } = await renderAt('/boards/b1');
    await flushEffects();
    const page = getPageEl(container);

    expect(page.style.backgroundImage).toBe('');
  });

  it('BoardTopBar onRename calls boardActions.renameBoard', async () => {
    await renderAt('/boards/b1');
    await flushEffects();

    fireEvent.click(screen.getByRole('button', { name: 'RENAME' }));

    expect(hooks.renameBoard).toHaveBeenCalledTimes(1);
    expect(hooks.renameBoard).toHaveBeenCalledWith('X');
  });

  it('CardModal onEditDescription calls cardActions.editDescription(selectedCard.id, selectedCard.list_id, nextDescription)', async () => {
    await renderAt('/boards/b1');
    await flushEffects();
    fireEvent.click(screen.getByRole('button', { name: 'OPEN_CARD' }));

    fireEvent.click(screen.getByRole('button', { name: 'EDIT_DESC' }));

    expect(hooks.editDescription).toHaveBeenCalledTimes(1);
    expect(hooks.editDescription).toHaveBeenCalledWith('c1', 'l1', '<p>Hello</p>');
  });

  it('does not open CardModal if selectedCardId is set but card is not found in cardsByListId', async () => {
    await renderAt('/boards/b1');
    await flushEffects();

    act(() => {
      children.lastKanbanProps.onOpenCard({ id: 'missing-card' });
    });
    await flushEffects();
    await flushEffects();

    expect(screen.queryByTestId('CardModal')).toBeNull();
  });

  it.each(['g-1', 'g-3', 'g-4', 'g-5', 'g-6'])(
    'applies gradient backgroundImage for known key %s',
    async (key) => {
      hooks.board = {
        id: 'b1',
        title: 'My Board',
        background_kind: 'gradient',
        background_value: key,
      } as any;

      const { container } = await renderAt('/boards/b1');
      await flushEffects();
      const page = getPageEl(container);

      expect(page.style.backgroundImage).toContain('linear-gradient');
    },
  );

  it('loads board members via useMember.getBoardMembers and passes them to BoardTopBar', async () => {
    memberMock.actions.getBoardMembers.mockResolvedValueOnce([
      { user_id: 'u1', username: 'Alice', email: 'a@a.com' },
      { user_id: 'u2', username: 'Bob', email: 'b@b.com' },
    ]);

    await renderAt('/boards/b1');
    await flushEffects();

    expect(memberMock.actions.getBoardMembers).toHaveBeenCalledTimes(1);
    expect(children.lastBoardTopBarProps.filterMembers).toEqual([
      { id: 'u1', username: 'Alice', email: 'a@a.com' },
      { id: 'u2', username: 'Bob', email: 'b@b.com' },
    ]);
  });

  it('if getBoardMembers throws, BoardTopBar receives empty members', async () => {
    memberMock.actions.getBoardMembers.mockRejectedValueOnce(new Error('boom'));

    await renderAt('/boards/b1');
    await flushEffects();

    expect(children.lastBoardTopBarProps.filterMembers).toEqual([]);
  });

  it('toggleFilterMember toggles ids and clearFilter resets them', async () => {
    await renderAt('/boards/b1');
    await flushEffects();

    expect(children.lastBoardTopBarProps.filterSelectedIds).toEqual([]);

    await act(async () => {
      children.lastBoardTopBarProps.onToggleFilterMember('u1');
    });
    expect(children.lastBoardTopBarProps.filterSelectedIds).toEqual(['u1']);

    await act(async () => {
      children.lastBoardTopBarProps.onToggleFilterMember('u1');
    });
    expect(children.lastBoardTopBarProps.filterSelectedIds).toEqual([]);

    await act(async () => {
      children.lastBoardTopBarProps.onToggleFilterMember('u1');
      children.lastBoardTopBarProps.onToggleFilterMember('u2');
    });
    expect(children.lastBoardTopBarProps.filterSelectedIds.sort()).toEqual(['u1', 'u2']);

    await act(async () => {
      children.lastBoardTopBarProps.onClearFilter();
    });
    expect(children.lastBoardTopBarProps.filterSelectedIds).toEqual([]);
  });

  it('when filterSelectedIds becomes non-empty and card members are missing, BoardKanban.loading becomes true while fetching', async () => {
    const d = deferred<any>();
    fetcher.apiFetch.mockReturnValueOnce(d.promise);

    await renderAt('/boards/b1');
    await flushEffects();

    await act(async () => {
      children.lastBoardTopBarProps.onToggleFilterMember('u1');
    });

    expect(children.lastKanbanProps.loading).toBe(true);

    d.resolve(mockRes({ ok: true, json: [{ user_id: 'u1' }] }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(children.lastKanbanProps.loading).toBe(false);
  });

  it('filteredCardsByListId: keeps card when ids not loaded yet (missing entry => true)', async () => {
    const d = deferred<any>();
    fetcher.apiFetch.mockReturnValueOnce(d.promise);

    await renderAt('/boards/b1');
    await flushEffects();

    act(() => {
      children.lastBoardTopBarProps.onToggleFilterMember('u1');
    });
    await flushEffects();
    await flushEffects();

    const cards = children.lastKanbanProps.cardsByListId.l1;
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('c1');

    d.resolve(mockRes({ ok: true, json: [] }));

    await flushEffects();
    await flushEffects();

    const cardsAfter = children.lastKanbanProps.cardsByListId.l1;
    expect(cardsAfter).toHaveLength(0);
  });

  it('filteredCardsByListId: keeps card when fetched ids contain selected member', async () => {
    fetcher.apiFetch.mockResolvedValueOnce(mockRes({ ok: true, json: [{ user_id: 'u1' }] }));

    await renderAt('/boards/b1');
    await flushEffects();

    await act(async () => {
      children.lastBoardTopBarProps.onToggleFilterMember('u1');
    });

    await act(async () => {
      await Promise.resolve();
    });

    const cards = children.lastKanbanProps.cardsByListId.l1;
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('c1');
  });

  it('filteredCardsByListId: removes card when fetched ids do NOT contain selected member', async () => {
    fetcher.apiFetch.mockResolvedValueOnce(mockRes({ ok: true, json: [{ user_id: 'u1' }] }));

    await renderAt('/boards/b1');
    await flushEffects();

    await act(async () => {
      children.lastBoardTopBarProps.onToggleFilterMember('u2');
    });

    await act(async () => {
      await Promise.resolve();
    });

    const cards = children.lastKanbanProps.cardsByListId.l1;
    expect(cards).toHaveLength(0);
  });

  it('fetchCardMemberIds: when apiFetch returns !ok => returns [] and card is filtered out', async () => {
    fetcher.apiFetch.mockResolvedValueOnce(mockRes({ ok: false, json: [{ user_id: 'u1' }] }));

    await renderAt('/boards/b1');
    await flushEffects();

    await act(async () => {
      children.lastBoardTopBarProps.onToggleFilterMember('u1');
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(children.lastKanbanProps.cardsByListId.l1).toHaveLength(0);
  });

  it('fetchCardMemberIds: when json is not an array => returns [] and card is filtered out', async () => {
    fetcher.apiFetch.mockResolvedValueOnce(mockRes({ ok: true, json: { nope: true } }));

    await renderAt('/boards/b1');
    await flushEffects();

    await act(async () => {
      children.lastBoardTopBarProps.onToggleFilterMember('u1');
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(children.lastKanbanProps.cardsByListId.l1).toHaveLength(0);
  });

  it('fetchCardMemberIds: filters out non-string user_id values', async () => {
    fetcher.apiFetch.mockResolvedValueOnce(
      mockRes({ ok: true, json: [{ user_id: 123 }, { user_id: 'u1' }, {}] }),
    );

    await renderAt('/boards/b1');
    await flushEffects();

    await act(async () => {
      children.lastBoardTopBarProps.onToggleFilterMember('u1');
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(children.lastKanbanProps.cardsByListId.l1).toHaveLength(1);
  });
});
