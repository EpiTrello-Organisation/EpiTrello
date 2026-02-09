import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import CardModal from './CardModal';
import type { CardModel } from '../BoardCard/BoardCard';

vi.mock('@/constants/labels', () => ({
  LABELS: [{ color: '#00ff00' }, { color: '#ff0000' }, { color: '#0000ff' }],
}));

vi.mock('../EditableText/EditableText', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: (props: any) =>
      React.createElement(
        'button',
        {
          'data-testid': 'EditableText',
          onClick: () => props.onChange('New Title'),
        },
        props.value,
      ),
  };
});

vi.mock('../LabelsPopover/LabelsPopover', () => ({
  default: ({ open, onToggle, onClose }: any) => {
    if (!open) return null;
    return (
      <div data-testid="LabelsPopover" role="dialog" aria-label="LabelsPopover">
        <button type="button" onClick={() => onToggle(0)}>
          TOGGLE_0
        </button>
        <button type="button" onClick={onClose}>
          CLOSE_LABELS
        </button>
      </div>
    );
  },
}));

vi.mock('../MembersPopover/MembersPopover', () => ({
  default: ({ open, onToggle, onClose }: any) => {
    if (!open) return null;
    return (
      <div data-testid="MembersPopover" role="dialog" aria-label="MembersPopover">
        <button type="button" onClick={() => onToggle('u2')}>
          TOGGLE_U2
        </button>
        <button type="button" onClick={onClose}>
          CLOSE_MEMBERS
        </button>
      </div>
    );
  },
}));

vi.mock('./RichTextEditor', () => ({
  default: ({ value, onSave, onCancel }: any) => {
    return (
      <div data-testid="RichTextEditor">
        <div data-testid="RTE_VALUE">{value}</div>
        <button type="button" onClick={() => onSave('')}>
          SAVE_EMPTY
        </button>
        <button type="button" onClick={() => onSave('<p>Hi</p>')}>
          SAVE_HTML
        </button>
        <button type="button" onClick={onCancel}>
          CANCEL
        </button>
      </div>
    );
  },
}));

const memberActions = {
  getBoardMembers: vi.fn(),
  getCardMembers: vi.fn(),
  addCardMember: vi.fn(),
  deleteCardMember: vi.fn(),
};

vi.mock('@/hooks/useMember', () => ({
  useMember: () => ({
    actions: memberActions,
  }),
}));

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0 as any;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeCard(partial: Partial<CardModel> = {}): CardModel {
  return {
    id: partial.id ?? 'c1',
    title: partial.title ?? 'Card 1',
    description: partial.description ?? null,
    position: partial.position ?? 0,
    list_id: partial.list_id ?? 'l1',
    creator_id: partial.creator_id ?? 'u1',
    created_at: partial.created_at ?? new Date('2024-01-01T12:00:00.000Z').toISOString(),
    label_ids: partial.label_ids ?? [],
  };
}

function renderModal(
  opts: Partial<React.ComponentProps<typeof CardModal>> & { card?: CardModel } = {},
) {
  const props = {
    card: opts.card ?? makeCard(),
    boardId: opts.boardId,
    onClose: opts.onClose ?? vi.fn(),
    onRename: opts.onRename ?? vi.fn(),
    onDeleteCard: opts.onDeleteCard ?? vi.fn(),
    onUpdateLabels: opts.onUpdateLabels ?? vi.fn(),
    onEditDescription: opts.onEditDescription ?? vi.fn(),
  };

  return { ...props, ...render(<CardModal {...props} />) };
}

async function flushMembersFetch() {
  await act(async () => {});
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('components/CardModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memberActions.getBoardMembers.mockResolvedValue([
      { user_id: 'u1', username: 'Alice Wonderland', email: 'alice@example.com', role: 'owner' },
      { user_id: 'u2', username: 'Bob', email: 'bob@work.com', role: 'member' },
    ]);
    memberActions.getCardMembers.mockResolvedValue([
      { user_id: 'u1', username: 'Alice Wonderland', email: 'alice@example.com' },
    ]);
    memberActions.addCardMember.mockResolvedValue({ status: 201, detail: 'Created' });
    memberActions.deleteCardMember.mockResolvedValue(undefined);
  });

  it('renders dialog with accessible name including card title', () => {
    renderModal({ card: makeCard({ title: 'Hello' }) });

    expect(screen.getByRole('dialog', { name: /card details: hello/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /close/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /card menu/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^labels$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^members$/i })).toBeTruthy();
  });

  it('sets body overflow hidden on mount and restores on unmount', () => {
    const prev = document.body.style.overflow;
    const { unmount } = renderModal();

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe(prev);
  });

  it('calls onClose when pressing Escape (when not editing description)', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose on Escape while editing description', () => {
    const onClose = vi.fn();
    renderModal({ onClose, card: makeCard({ description: null }) });

    fireEvent.click(screen.getByRole('button', { name: /edit card description/i }));
    expect(screen.getByTestId('RichTextEditor')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when clicking backdrop (mouseDown on presentation element)', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const backdrop = screen.getByRole('presentation');
    fireEvent.mouseDown(backdrop, { target: backdrop });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT close when mouseDown happens inside dialog (target != currentTarget)', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const backdrop = screen.getByRole('presentation');
    const dialog = screen.getByRole('dialog');

    fireEvent.mouseDown(backdrop, { target: dialog });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('card menu toggles and closes when clicking outside (capture pointerdown)', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /card menu/i }));
    expect(screen.getByRole('button', { name: /delete card/i })).toBeTruthy();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('button', { name: /delete card/i })).toBeNull();
  });

  it('clicking "Delete card" calls onDeleteCard and closes menu', () => {
    const onDeleteCard = vi.fn();
    renderModal({ onDeleteCard });

    fireEvent.click(screen.getByRole('button', { name: /card menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete card/i }));

    expect(onDeleteCard).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /delete card/i })).toBeNull();
  });

  it('toggles LabelsPopover open/close via Labels button', () => {
    renderModal();

    expect(screen.queryByTestId('LabelsPopover')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^labels$/i }));
    expect(screen.getByTestId('LabelsPopover')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^labels$/i }));
    expect(screen.queryByTestId('LabelsPopover')).toBeNull();
  });

  it('closeLabelsPopover does NOT call onUpdateLabels when labels did not change', () => {
    const onUpdateLabels = vi.fn();
    renderModal({ onUpdateLabels, card: makeCard({ label_ids: [1] }) });

    fireEvent.click(screen.getByRole('button', { name: /^labels$/i }));
    fireEvent.click(screen.getByRole('button', { name: 'CLOSE_LABELS' }));

    expect(onUpdateLabels).not.toHaveBeenCalled();
  });

  it('closeLabelsPopover calls onUpdateLabels when labels changed', () => {
    const onUpdateLabels = vi.fn();
    renderModal({ onUpdateLabels, card: makeCard({ label_ids: [] }) });

    fireEvent.click(screen.getByRole('button', { name: /^labels$/i }));
    fireEvent.click(screen.getByRole('button', { name: 'TOGGLE_0' }));
    fireEvent.click(screen.getByRole('button', { name: 'CLOSE_LABELS' }));

    expect(onUpdateLabels).toHaveBeenCalledTimes(1);
    expect(onUpdateLabels).toHaveBeenCalledWith([0]);
  });

  it('opens description editor on click and calls onEditDescription with "No description" when saving empty', () => {
    const onEditDescription = vi.fn();
    renderModal({ onEditDescription, card: makeCard({ description: '' as any }) });

    fireEvent.click(screen.getByRole('button', { name: /edit card description/i }));
    expect(screen.getByTestId('RichTextEditor')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'SAVE_EMPTY' }));

    expect(onEditDescription).toHaveBeenCalledTimes(1);
    expect(onEditDescription).toHaveBeenCalledWith('No description');

    expect(screen.queryByTestId('RichTextEditor')).toBeNull();
  });

  it('calls onEditDescription with html when saving non-empty, and closes editor', () => {
    const onEditDescription = vi.fn();
    renderModal({ onEditDescription, card: makeCard({ description: null }) });

    fireEvent.click(screen.getByRole('button', { name: /edit card description/i }));
    fireEvent.click(screen.getByRole('button', { name: 'SAVE_HTML' }));

    expect(onEditDescription).toHaveBeenCalledTimes(1);
    expect(onEditDescription).toHaveBeenCalledWith('<p>Hi</p>');
    expect(screen.queryByTestId('RichTextEditor')).toBeNull();
  });

  it('cancel description editing does not call onEditDescription and closes editor', () => {
    const onEditDescription = vi.fn();
    renderModal({ onEditDescription });

    fireEvent.click(screen.getByRole('button', { name: /edit card description/i }));
    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));

    expect(onEditDescription).not.toHaveBeenCalled();
    expect(screen.queryByTestId('RichTextEditor')).toBeNull();
  });

  it('Members button is disabled when boardId is missing', () => {
    renderModal({ boardId: undefined });

    const btn = screen.getByRole('button', { name: /^members$/i });
    expect(btn).toHaveProperty('disabled', true);
  });

  it('Members: does NOT call API on each toggle, only on close (adds member)', async () => {
    renderModal({ boardId: 'b1' });

    await flushMembersFetch();
    expect(memberActions.getBoardMembers).toHaveBeenCalledTimes(1);
    expect(memberActions.getCardMembers).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /^members$/i }));
    expect(screen.getByTestId('MembersPopover')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'TOGGLE_U2' }));

    expect(memberActions.addCardMember).not.toHaveBeenCalled();
    expect(memberActions.deleteCardMember).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'CLOSE_MEMBERS' }));

    await waitFor(() => expect(memberActions.addCardMember).toHaveBeenCalledTimes(1));
    expect(memberActions.addCardMember).toHaveBeenCalledWith('bob@work.com');
  });

  it('Members: close does nothing if no changes', async () => {
    renderModal({ boardId: 'b1' });

    await flushMembersFetch();

    fireEvent.click(screen.getByRole('button', { name: /^members$/i }));
    fireEvent.click(screen.getByRole('button', { name: 'CLOSE_MEMBERS' }));

    expect(memberActions.addCardMember).not.toHaveBeenCalled();
    expect(memberActions.deleteCardMember).not.toHaveBeenCalled();
  });

  it('Members: close removes member when draft deselects existing one', async () => {
    memberActions.getCardMembers.mockResolvedValueOnce([
      { user_id: 'u1', username: 'Alice Wonderland', email: 'alice@example.com' },
      { user_id: 'u2', username: 'Bob', email: 'bob@work.com' },
    ]);

    renderModal({ boardId: 'b1', card: makeCard({ id: 'c-rem' }) });
    await flushMembersFetch();

    const membersBtns = screen.getAllByRole('button', { name: /^members$/i });
    fireEvent.click(membersBtns[0]);

    expect(screen.getByTestId('MembersPopover')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'TOGGLE_U2' }));
    fireEvent.click(screen.getByRole('button', { name: 'CLOSE_MEMBERS' }));

    await waitFor(() => expect(memberActions.deleteCardMember).toHaveBeenCalledTimes(1));
    expect(memberActions.deleteCardMember).toHaveBeenCalledWith('bob@work.com');
  });

  it('Members: on close, if API throws, it attempts best-effort resync via getCardMembers', async () => {
    memberActions.addCardMember.mockRejectedValueOnce(new Error('boom'));
    memberActions.getCardMembers
      .mockResolvedValueOnce([
        { user_id: 'u1', username: 'Alice Wonderland', email: 'alice@example.com' },
      ])
      .mockResolvedValueOnce([
        { user_id: 'u1', username: 'Alice Wonderland', email: 'alice@example.com' },
      ]);

    renderModal({ boardId: 'b1' });
    await flushMembersFetch();

    fireEvent.click(screen.getByRole('button', { name: /^members$/i }));
    fireEvent.click(screen.getByRole('button', { name: 'TOGGLE_U2' }));
    fireEvent.click(screen.getByRole('button', { name: 'CLOSE_MEMBERS' }));

    await waitFor(() => expect(memberActions.getCardMembers).toHaveBeenCalled());

    expect(memberActions.addCardMember).toHaveBeenCalledTimes(1);
    expect(memberActions.getCardMembers).toHaveBeenCalledTimes(2);
  });

  it('returns null when open=false for popovers (sanity: no LabelsPopover/MembersPopover visible by default)', async () => {
    render(
      <CardModal
        card={makeCard()}
        onClose={vi.fn()}
        onRename={vi.fn()}
        onDeleteCard={vi.fn()}
        onUpdateLabels={vi.fn()}
        onEditDescription={vi.fn()}
      />,
    );

    await flushMicrotasks();

    expect(screen.queryByTestId('LabelsPopover')).toBeNull();
    expect(screen.queryByTestId('MembersPopover')).toBeNull();
  });
});
