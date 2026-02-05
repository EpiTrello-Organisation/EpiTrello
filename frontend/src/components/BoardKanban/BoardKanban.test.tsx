import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import BoardKanban from './BoardKanban';

import type { CardModel } from '@/components/BoardCard/BoardCard';
import type { ListModel } from '@/components/BoardList/BoardList';

const dnd = vi.hoisted(() => {
  return {
    lastDndProps: null as any,
    arrayMove: vi.fn((arr: any[], from: number, to: number) => {
      const copy = [...arr];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    }),
  };
});

vi.mock('@dnd-kit/core', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  function DndContext(props: any) {
    dnd.lastDndProps = props;
    return React.createElement('div', { 'data-testid': 'DndContext' }, props.children);
  }

  function DragOverlay(props: any) {
    return React.createElement('div', { 'data-testid': 'DragOverlay' }, props.children);
  }

  const closestCorners = () => null;
  const MeasuringStrategy = { Always: 'Always' };

  return {
    DndContext,
    DragOverlay,
    closestCorners,
    MeasuringStrategy,
  };
});

vi.mock('@dnd-kit/sortable', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  function SortableContext(props: any) {
    return React.createElement('div', { 'data-testid': 'SortableContext' }, props.children);
  }

  const horizontalListSortingStrategy = () => null;

  return {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove: dnd.arrayMove,
  };
});

const boardListMock = vi.hoisted(() => ({
  calls: [] as any[],
}));

vi.mock('@/components/BoardList/BoardList', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: (props: any) => {
      boardListMock.calls.push(props);
      return React.createElement(
        'div',
        { 'data-testid': `BoardList:${props.list.id}` },
        React.createElement('div', null, `List:${props.list.title}`),
        React.createElement('div', null, `Cards:${props.cards?.length ?? 0}`),
      );
    },
  };
});

vi.mock('@/components/BoardCard/BoardCard', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: (props: any) =>
      React.createElement('div', { 'data-testid': 'BoardCardOverlay' }, `Card:${props.card?.id}`),
  };
});

vi.mock('@/components/AddListComposer/AddListComposer', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: (props: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'AddListComposer' },
        React.createElement('div', { 'data-testid': 'alc-open' }, String(props.open)),
        React.createElement('div', { 'data-testid': 'alc-value' }, props.value),

        React.createElement('button', { type: 'button', onClick: props.onOpen }, 'ALC_OPEN'),
        React.createElement(
          'button',
          { type: 'button', onClick: () => props.onChange('  New List  ') },
          'ALC_SET_VALUE',
        ),
        React.createElement('button', { type: 'button', onClick: props.onSubmit }, 'ALC_SUBMIT'),
        React.createElement('button', { type: 'button', onClick: props.onCancel }, 'ALC_CANCEL'),
      ),
  };
});

function list(id: string, title?: string): ListModel {
  return { id, title: title ?? id } as any;
}

function card(partial: Partial<CardModel>): CardModel {
  return {
    id: partial.id ?? 'c',
    title: partial.title ?? 't',
    description: partial.description ?? null,
    position: partial.position ?? 0,
    list_id: partial.list_id ?? 'l1',
    creator_id: partial.creator_id ?? 'u',
    created_at: partial.created_at ?? new Date().toISOString(),
    labelIds: partial.labelIds,
  } as any;
}

function dragEvent({
  activeId,
  overId,
  activeType,
  fromListId,
}: {
  activeId: string;
  overId?: string | null;
  activeType: 'card' | 'list' | string;
  fromListId?: string;
}) {
  return {
    active: {
      id: activeId,
      data: {
        current: {
          type: activeType,
          ...(fromListId ? { listId: fromListId } : {}),
        },
      },
    },
    over: overId == null ? null : { id: overId },
  } as any;
}

function getDndProps() {
  if (!dnd.lastDndProps) throw new Error('DndContext props not captured');
  return dnd.lastDndProps;
}

describe('components/BoardKanban', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    boardListMock.calls = [];
    dnd.lastDndProps = null;
  });

  function renderKanban(overrides?: Partial<React.ComponentProps<typeof BoardKanban>>) {
    const onDragEnd = vi.fn();
    const onRenameList = vi.fn();
    const onDeleteList = vi.fn();
    const onAddCard = vi.fn();
    const onOpenCard = vi.fn();
    const onAddList = vi.fn();
    const onMoveCardBetweenLists = vi.fn();
    const onCommitCards = vi.fn();

    const props: React.ComponentProps<typeof BoardKanban> = {
      lists: [list('l1', 'L1'), list('l2', 'L2')],
      cardsByListId: {
        l1: [
          card({ id: 'c1', list_id: 'l1', position: 0 }),
          card({ id: 'c2', list_id: 'l1', position: 1 }),
        ],
        l2: [card({ id: 'c3', list_id: 'l2', position: 0 })],
      },
      loading: false,
      sensors: [] as any,
      onDragEnd,

      onRenameList,
      onDeleteList,
      onAddCard,
      onOpenCard,
      onAddList,
      listsRowClassName: 'row',

      onMoveCardBetweenLists,
      onCommitCards,
      ...overrides,
    };

    const utils = render(<BoardKanban {...props} />);
    return { ...utils, props, onCommitCards, onMoveCardBetweenLists, onDragEnd, onAddList };
  }

  it('sets aria-busy based on loading', () => {
    renderKanban({ loading: true });
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders BoardList for each list with correct cards', () => {
    renderKanban();

    expect(screen.getByTestId('BoardList:l1')).toBeTruthy();
    expect(screen.getByTestId('BoardList:l2')).toBeTruthy();

    const l1Props = boardListMock.calls.find((c) => c.list.id === 'l1');
    const l2Props = boardListMock.calls.find((c) => c.list.id === 'l2');

    expect(l1Props.cards).toHaveLength(2);
    expect(l2Props.cards).toHaveLength(1);
  });

  it('onDragOver: moving a card over list dropzone calls onMoveCardBetweenLists (and dedupes)', async () => {
    const { onMoveCardBetweenLists } = renderKanban({
      cardsByListId: {
        l1: [card({ id: 'c1', list_id: 'l1' })],
        l2: [card({ id: 'c2', list_id: 'l2' }), card({ id: 'c3', list_id: 'l2' })],
      },
    });

    const { onDragOver } = getDndProps();

    await act(async () => {
      onDragOver(
        dragEvent({ activeId: 'c1', overId: 'list:l2', activeType: 'card', fromListId: 'l1' }),
      );
    });

    expect(onMoveCardBetweenLists).toHaveBeenCalledTimes(1);
    expect(onMoveCardBetweenLists).toHaveBeenCalledWith('l1', 'l2', 'c1', 2);

    await act(async () => {
      onDragOver(
        dragEvent({ activeId: 'c1', overId: 'list:l2', activeType: 'card', fromListId: 'l1' }),
      );
    });

    expect(onMoveCardBetweenLists).toHaveBeenCalledTimes(1);
  });

  it('onDragEnd: if activeType is not card, delegates to onDragEnd prop', async () => {
    const { onDragEnd } = renderKanban();
    const { onDragEnd: dndOnDragEnd } = getDndProps();

    const e = dragEvent({ activeId: 'l1', overId: 'l2', activeType: 'list' });

    await act(async () => {
      await dndOnDragEnd(e);
    });

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith(e);
  });

  it('onDragEnd: reorders cards within same list and calls onCommitCards with positions updated', async () => {
    const c1 = card({ id: 'c1', list_id: 'l1', position: 0 });
    const c2 = card({ id: 'c2', list_id: 'l1', position: 1 });

    const { onCommitCards } = renderKanban({
      cardsByListId: { l1: [c1, c2] },
      lists: [list('l1')],
    });

    const { onDragEnd: dndOnDragEnd } = getDndProps();

    await act(async () => {
      await dndOnDragEnd(
        dragEvent({ activeId: 'c1', overId: 'c2', activeType: 'card', fromListId: 'l1' }),
      );
    });

    expect(dnd.arrayMove).toHaveBeenCalledTimes(1);
    expect(dnd.arrayMove).toHaveBeenCalledWith([c1, c2], 0, 1);

    expect(onCommitCards).toHaveBeenCalledTimes(1);
    const [fromListId, toListId, nextFrom, nextTo] = onCommitCards.mock.calls[0];

    expect(fromListId).toBe('l1');
    expect(toListId).toBe('l1');

    expect((nextFrom as CardModel[]).map((c) => c.id)).toEqual(['c2', 'c1']);
    expect((nextTo as CardModel[])[0].position).toBe(0);
    expect((nextTo as CardModel[])[1].position).toBe(1);
  });

  it('onDragEnd: moves card across lists, updates list_id and positions, then calls onCommitCards', async () => {
    const c1 = card({ id: 'c1', list_id: 'l1', position: 0 });
    const c2 = card({ id: 'c2', list_id: 'l1', position: 1 });
    const c3 = card({ id: 'c3', list_id: 'l2', position: 0 });

    const { onCommitCards } = renderKanban({
      lists: [list('l1'), list('l2')],
      cardsByListId: { l1: [c1, c2], l2: [c3] },
    });

    const { onDragEnd: dndOnDragEnd } = getDndProps();

    await act(async () => {
      await dndOnDragEnd(
        dragEvent({ activeId: 'c1', overId: 'list:l2', activeType: 'card', fromListId: 'l1' }),
      );
    });

    expect(onCommitCards).toHaveBeenCalledTimes(1);
    const [fromListId, toListId, nextFrom, nextTo] = onCommitCards.mock.calls[0];

    expect(fromListId).toBe('l1');
    expect(toListId).toBe('l2');

    expect((nextFrom as CardModel[]).map((c) => c.id)).toEqual(['c2']);
    expect((nextFrom as CardModel[])[0].position).toBe(0);

    expect((nextTo as CardModel[]).map((c) => c.id)).toEqual(['c3', 'c1']);
    expect((nextTo as CardModel[])[0].position).toBe(0);
    expect((nextTo as CardModel[])[1].position).toBe(1);
    expect((nextTo as CardModel[])[1].list_id).toBe('l2');
  });

  it('DragOverlay shows active card after dragStart', async () => {
    renderKanban({
      cardsByListId: { l1: [card({ id: 'c1', list_id: 'l1' })] },
      lists: [list('l1')],
    });

    expect(screen.queryByTestId('BoardCardOverlay')).toBeNull();

    const { onDragStart } = getDndProps();

    await act(async () => {
      onDragStart({
        active: { id: 'c1', data: { current: { type: 'card', listId: 'l1' } } },
      } as any);
    });

    expect(screen.getByTestId('BoardCardOverlay')).toHaveTextContent('Card:c1');
  });

  it('AddListComposerBridge: submit trims and calls onAddList, then resets open/value', async () => {
    const onAddList = vi.fn(async () => {});
    renderKanban({ onAddList });

    expect(screen.getByTestId('alc-open')).toHaveTextContent('false');
    expect(screen.getByTestId('alc-value')).toHaveTextContent('');

    fireEvent.click(screen.getByRole('button', { name: 'ALC_OPEN' }));
    expect(screen.getByTestId('alc-open')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'ALC_SET_VALUE' }));
    expect(screen.getByTestId('alc-value').textContent).toBe('  New List  ');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'ALC_SUBMIT' }));
    });

    expect(onAddList).toHaveBeenCalledTimes(1);
    expect(onAddList).toHaveBeenCalledWith('New List');

    expect(screen.getByTestId('alc-open')).toHaveTextContent('false');
    expect(screen.getByTestId('alc-value')).toHaveTextContent('');
  });

  it('onDragOver: moving a card over another card in different list uses findCardContainer + card index', async () => {
    const { onMoveCardBetweenLists } = renderKanban({
      cardsByListId: {
        l1: [card({ id: 'c1', list_id: 'l1' })],
        l2: [card({ id: 'c2', list_id: 'l2' }), card({ id: 'c3', list_id: 'l2' })],
      },
    });

    const { onDragOver } = getDndProps();

    await act(async () => {
      onDragOver(dragEvent({ activeId: 'c1', overId: 'c2', activeType: 'card', fromListId: 'l1' }));
    });

    expect(onMoveCardBetweenLists).toHaveBeenCalledTimes(1);
    expect(onMoveCardBetweenLists).toHaveBeenCalledWith('l1', 'l2', 'c1', 0);
  });

  it('onDragOver: dragging a card over a card in the same list does nothing', async () => {
    const { onMoveCardBetweenLists } = renderKanban({
      cardsByListId: {
        l1: [card({ id: 'c1', list_id: 'l1' }), card({ id: 'c2', list_id: 'l1' })],
        l2: [],
      },
    });

    const { onDragOver } = getDndProps();

    await act(async () => {
      onDragOver(dragEvent({ activeId: 'c1', overId: 'c2', activeType: 'card', fromListId: 'l1' }));
    });

    expect(onMoveCardBetweenLists).not.toHaveBeenCalled();
  });

  it('DragStart: if active type is not card, it does not set overlay', async () => {
    renderKanban({
      cardsByListId: { l1: [card({ id: 'c1', list_id: 'l1' })] },
      lists: [list('l1')],
    });

    expect(screen.queryByTestId('BoardCardOverlay')).toBeNull();

    const { onDragStart } = getDndProps();

    await act(async () => {
      onDragStart({
        active: { id: 'l1', data: { current: { type: 'list' } } },
      } as any);
    });

    expect(screen.queryByTestId('BoardCardOverlay')).toBeNull();
  });
});
