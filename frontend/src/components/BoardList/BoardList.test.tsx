import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BoardList, { type ListModel } from './BoardList';
import type { CardModel } from '../BoardCard/BoardCard';

/** -------------------------
 *  dnd-kit mocks
 *  ------------------------- */
const dnd = vi.hoisted(() => ({
  useDroppable: vi.fn(),
  useSortable: vi.fn(),
}));

vi.mock('@dnd-kit/core', () => ({
  useDroppable: (args: any) => dnd.useDroppable(args),
}));

vi.mock('@dnd-kit/sortable', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  return {
    SortableContext: (props: any) =>
      React.createElement('div', { 'data-testid': 'SortableContext' }, props.children),
    verticalListSortingStrategy: () => null,
    useSortable: (args: any) => dnd.useSortable(args),
  };
});

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: (t: any) => String(t) } },
}));

/** -------------------------
 *  internal hooks mocks
 *  ------------------------- */
const hooks = vi.hoisted(() => ({
  useSortableStyle: vi.fn(),

  menuOpen: false,
  setMenuOpen: vi.fn(),
  menuWrapperRef: { current: null as HTMLDivElement | null },

  isAddingCard: false,
  openAddCard: vi.fn(),
  cancelAddCard: vi.fn(),
  submitAddCard: vi.fn(),
  newCardTitle: '',
  setNewCardTitle: vi.fn(),
  listRef: { current: null as HTMLElement | null },
}));

vi.mock('@/hooks/useSortableStyle', () => ({
  useSortableStyle: (id: string) => hooks.useSortableStyle(id),
}));

vi.mock('@/hooks/useListMenu', () => ({
  useListMenu: () => ({
    menuOpen: hooks.menuOpen,
    setMenuOpen: hooks.setMenuOpen,
    menuWrapperRef: hooks.menuWrapperRef,
  }),
}));

vi.mock('@/hooks/useAddCardComposer', () => ({
  useAddCardComposer: (_args: any) => ({
    listRef: hooks.listRef,
    isAddingCard: hooks.isAddingCard,
    newCardTitle: hooks.newCardTitle,
    setNewCardTitle: hooks.setNewCardTitle,
    openAddCard: hooks.openAddCard,
    cancelAddCard: hooks.cancelAddCard,
    submitAddCard: hooks.submitAddCard,
  }),
}));

/** -------------------------
 *  child components mocks
 *  ------------------------- */

vi.mock('../EditableText/EditableText', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: (props: any) =>
      React.createElement(
        'button',
        { type: 'button', 'aria-label': props.ariaLabel, onClick: () => props.onChange('Renamed') },
        props.value,
      ),
  };
});

vi.mock('../BoardCard/BoardCard', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: (props: any) =>
      React.createElement(
        'button',
        { type: 'button', 'data-testid': `BoardCard:${props.card.id}`, onClick: props.onOpen },
        `Card:${props.card.id}`,
      ),
  };
});

vi.mock('../AddCardComposer/AddCardComposer', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: (props: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'AddCardComposer' },
        React.createElement('div', { 'data-testid': 'acc-open' }, String(props.open)),
        React.createElement('div', { 'data-testid': 'acc-value' }, props.value),
      ),
  };
});

function mkCard(partial: Partial<CardModel>): CardModel {
  return {
    id: partial.id ?? 'c',
    title: partial.title ?? 't',
    description: partial.description ?? null,
    position: partial.position ?? 0,
    list_id: partial.list_id ?? 'l1',
    creator_id: partial.creator_id ?? 'u',
    created_at: partial.created_at ?? new Date().toISOString(),
    label_ids: partial.label_ids ?? [],
  } as any;
}

describe('components/BoardList', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hooks.menuOpen = false;
    hooks.setMenuOpen = vi.fn();
    hooks.menuWrapperRef = { current: null };
    hooks.isAddingCard = false;
    hooks.openAddCard = vi.fn();
    hooks.cancelAddCard = vi.fn();
    hooks.submitAddCard = vi.fn();
    hooks.newCardTitle = '';
    hooks.setNewCardTitle = vi.fn();
    hooks.listRef = { current: null };

    hooks.useSortableStyle = vi.fn(() => ({
      attributes: { 'data-attr': 'x' },
      listeners: { onPointerDown: vi.fn() },
      setNodeRef: vi.fn(),
      setActivatorNodeRef: vi.fn(),
      style: { opacity: 1 },
    }));

    dnd.useDroppable.mockReturnValue({ setNodeRef: vi.fn() });
    dnd.useSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    });
  });

  function renderList(overrides?: Partial<React.ComponentProps<typeof BoardList>>) {
    const onRename = vi.fn();
    const onOpenCard = vi.fn();
    const onDelete = vi.fn();
    const onAddCard = vi.fn();

    const list: ListModel = { id: 'l1', title: 'List 1' };

    const cards = [
      mkCard({ id: 'c2', list_id: 'l1', position: 2 }),
      mkCard({ id: 'c0', list_id: 'l1', position: 0 }),
      mkCard({ id: 'c1', list_id: 'l1', position: 1 }),
    ];

    const props: React.ComponentProps<typeof BoardList> = {
      list,
      cards,
      onRename,
      onOpenCard,
      onDelete,
      onAddCard,
      ...overrides,
    };

    const utils = render(<BoardList {...props} />);
    return { ...utils, props, onRename, onOpenCard, onDelete, onAddCard };
  }

  it('renders title button, menu button, add-card button, template button', () => {
    renderList();

    expect(screen.getByRole('button', { name: /edit list title/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /list menu/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /\+.*add a card/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /create from template/i })).toBeTruthy();
  });

  it('calls useSortableStyle with list.id and wires refs', () => {
    renderList();

    expect(hooks.useSortableStyle).toHaveBeenCalledTimes(1);
    expect(hooks.useSortableStyle).toHaveBeenCalledWith('l1');
  });

  it('registers droppable with id "list:<list.id>"', () => {
    renderList();

    expect(dnd.useDroppable).toHaveBeenCalledTimes(1);
    expect(dnd.useDroppable).toHaveBeenCalledWith({ id: 'list:l1' });
  });

  it('orders cards by position before rendering', () => {
    renderList();

    const rendered = screen
      .getAllByTestId(/^BoardCard:/)
      .map((el) => el.getAttribute('data-testid'));
    expect(rendered).toEqual(['BoardCard:c0', 'BoardCard:c1', 'BoardCard:c2']);
  });

  it('clicking a card calls onOpenCard with that card', () => {
    const { onOpenCard } = renderList();

    fireEvent.click(screen.getByTestId('BoardCard:c1'));
    expect(onOpenCard).toHaveBeenCalledTimes(1);

    const arg = onOpenCard.mock.calls[0][0] as CardModel;
    expect(arg.id).toBe('c1');
  });

  it('renaming list via EditableText calls onRename(list.id, value)', () => {
    const { onRename } = renderList();

    fireEvent.click(screen.getByRole('button', { name: /edit list title/i }));

    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onRename).toHaveBeenCalledWith('l1', 'Renamed');
  });

  it('clicking "+ Add a card" calls openAddCard when not adding', () => {
    renderList();

    fireEvent.click(screen.getByRole('button', { name: /\+.*add a card/i }));
    expect(hooks.openAddCard).toHaveBeenCalledTimes(1);
  });

  it('when isAddingCard=true, shows AddCardComposer and action buttons call submit/cancel', () => {
    hooks.isAddingCard = true;
    hooks.newCardTitle = 'Hello';
    renderList();

    expect(screen.getByTestId('AddCardComposer')).toBeTruthy();
    expect(screen.getByTestId('acc-open')).toHaveTextContent('true');
    expect(screen.getByTestId('acc-value').textContent).toBe('Hello');

    fireEvent.click(screen.getByRole('button', { name: /^add card$/i }));
    expect(hooks.submitAddCard).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(hooks.cancelAddCard).toHaveBeenCalledTimes(1);
  });

  it('menu toggle calls setMenuOpen', () => {
    renderList();

    fireEvent.click(screen.getByRole('button', { name: /list menu/i }));
    expect(hooks.setMenuOpen).toHaveBeenCalledTimes(1);

    expect(typeof hooks.setMenuOpen.mock.calls[0][0]).toBe('function');
  });

  it('when menuOpen=true, clicking "Delete List" closes menu and calls onDelete(list.id)', () => {
    hooks.menuOpen = true;
    const { onDelete } = renderList();

    const del = screen.getByRole('button', { name: /delete list/i });
    fireEvent.click(del);

    expect(hooks.setMenuOpen).toHaveBeenCalledWith(false);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('l1');
  });
});
