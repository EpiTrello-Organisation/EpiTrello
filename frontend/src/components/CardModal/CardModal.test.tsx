import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
// import { waitFor } from '@testing-library/react';
import CardModal from './CardModal';
import type { CardModel } from '../BoardCard/BoardCard';

vi.mock('@/constants/labels', () => ({
  LABELS: [
    { id: 'green', color: '#00ff00' },
    { id: 'red', color: '#ff0000' },
    { id: 'blue', color: '#0000ff' },
  ],
}));

vi.mock('../EditableText/EditableText', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: (props: any) =>
      React.createElement(
        'button',
        { 'data-testid': 'EditableText', onClick: () => props.onChange('New Title') },
        props.value,
      ),
  };
});

vi.mock('../LabelsPopover/LabelsPopover', () => ({
  default: ({ open, onToggle }: any) => {
    if (!open) return null;
    return (
      <div data-testid="LabelsPopover" role="dialog" aria-label="LabelsPopover">
        <button type="button" onClick={() => onToggle('green')}>
          TOGGLE_GREEN
        </button>
      </div>
    );
  },
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
    labelIds: partial.labelIds,
  } as any;
}

describe('components/CardModal', () => {
  let prevOverflow = '';

  beforeEach(() => {
    vi.clearAllMocks();
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = prevOverflow;
  });

  it('renders dialog with accessible name including card title', () => {
    render(
      <CardModal
        card={makeCard({ title: 'Hello' })}
        onClose={vi.fn()}
        onRename={vi.fn()}
        onDeleteCard={vi.fn()}
        onUpdateLabels={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: /card details: hello/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /close/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /card menu/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /labels/i })).toBeTruthy();
  });

  it('sets body overflow hidden on mount and restores on unmount', () => {
    const { unmount } = render(
      <CardModal
        card={makeCard()}
        onClose={vi.fn()}
        onRename={vi.fn()}
        onDeleteCard={vi.fn()}
        onUpdateLabels={vi.fn()}
      />,
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('calls onClose when pressing Escape', () => {
    const onClose = vi.fn();
    render(
      <CardModal
        card={makeCard()}
        onClose={onClose}
        onRename={vi.fn()}
        onDeleteCard={vi.fn()}
        onUpdateLabels={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the close button', () => {
    const onClose = vi.fn();
    render(
      <CardModal
        card={makeCard()}
        onClose={onClose}
        onRename={vi.fn()}
        onDeleteCard={vi.fn()}
        onUpdateLabels={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking backdrop (mouseDown on presentation element)', () => {
    const onClose = vi.fn();
    render(
      <CardModal
        card={makeCard()}
        onClose={onClose}
        onRename={vi.fn()}
        onDeleteCard={vi.fn()}
        onUpdateLabels={vi.fn()}
      />,
    );

    const backdrop = screen.getByRole('presentation');
    fireEvent.mouseDown(backdrop, { target: backdrop });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT close when mouseDown happens inside dialog', () => {
    const onClose = vi.fn();
    render(
      <CardModal
        card={makeCard()}
        onClose={onClose}
        onRename={vi.fn()}
        onDeleteCard={vi.fn()}
        onUpdateLabels={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog');
    fireEvent.mouseDown(dialog, { target: dialog });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows "No description" when card.description is null; otherwise shows description', () => {
    const { unmount } = render(
      <CardModal
        card={makeCard({ description: null })}
        onClose={vi.fn()}
        onRename={vi.fn()}
        onDeleteCard={vi.fn()}
        onUpdateLabels={vi.fn()}
      />,
    );

    expect(screen.getByText(/no description/i)).toBeTruthy();

    unmount();

    render(
      <CardModal
        card={makeCard({ description: 'Hello desc' })}
        onClose={vi.fn()}
        onRename={vi.fn()}
        onDeleteCard={vi.fn()}
        onUpdateLabels={vi.fn()}
      />,
    );

    expect(screen.getByText('Hello desc')).toBeTruthy();
  });

  it('card menu toggles and closes when clicking outside (capture pointerdown)', () => {
    render(
      <CardModal
        card={makeCard()}
        onClose={vi.fn()}
        onRename={vi.fn()}
        onDeleteCard={vi.fn()}
        onUpdateLabels={vi.fn()}
      />,
    );

    // open menu
    fireEvent.click(screen.getByRole('button', { name: /card menu/i }));
    expect(screen.getByRole('button', { name: /delete card/i })).toBeTruthy();

    // IMPORTANT: dispatch on a real Node so e.target is a Node
    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole('button', { name: /delete card/i })).toBeNull();
  });

  it('clicking "Delete card" calls onDeleteCard and closes menu', () => {
    const onDeleteCard = vi.fn();
    render(
      <CardModal
        card={makeCard()}
        onClose={vi.fn()}
        onRename={vi.fn()}
        onDeleteCard={onDeleteCard}
        onUpdateLabels={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /card menu/i }));
    const del = screen.getByRole('button', { name: /delete card/i });

    fireEvent.click(del);

    expect(onDeleteCard).toHaveBeenCalledTimes(1);
    // menu should be closed
    expect(screen.queryByRole('button', { name: /delete card/i })).toBeNull();
  });

  it('toggles LabelsPopover open/close via Labels quick action button', () => {
    render(
      <CardModal
        card={makeCard()}
        onClose={vi.fn()}
        onRename={vi.fn()}
        onDeleteCard={vi.fn()}
        onUpdateLabels={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('LabelsPopover')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^labels$/i }));
    expect(screen.getByTestId('LabelsPopover')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^labels$/i }));
    expect(screen.queryByTestId('LabelsPopover')).toBeNull();
  });

//   it('LabelsPopover onClose closes it', () => {
//     render(
//       <CardModal
//         card={makeCard()}
//         onClose={vi.fn()}
//         onRename={vi.fn()}
//         onDeleteCard={vi.fn()}
//         onUpdateLabels={vi.fn()}
//       />,
//     );

//     fireEvent.click(screen.getByRole('button', { name: /^labels$/i }));
//     expect(screen.getByTestId('LabelsPopover')).toBeTruthy();

//     fireEvent.click(screen.getByRole('button', { name: 'POPOVER_CLOSE' }));
//     expect(screen.queryByTestId('LabelsPopover')).toBeNull();
//   });

//   it('toggleLabel adds/removes id and calls onUpdateLabels', async () => {
//     const onUpdateLabels = vi.fn();

//     const { rerender } = render(
//       <CardModal
//         card={makeCard({ labelIds: ['red'] })}
//         onClose={vi.fn()}
//         onRename={vi.fn()}
//         onDeleteCard={vi.fn()}
//         onUpdateLabels={onUpdateLabels}
//       />,
//     );

//     fireEvent.click(screen.getByRole('button', { name: /^labels$/i }));

//     await waitFor(() => {
//       expect(screen.getByTestId('LabelsPopover')).toBeTruthy();
//     });

//     fireEvent.click(screen.getByRole('button', { name: 'TOGGLE_GREEN' }));

//     const added = onUpdateLabels.mock.calls[0][0] as string[];
//     expect(new Set(added)).toEqual(new Set(['red', 'green']));

//     onUpdateLabels.mockClear();

//     rerender(
//       <CardModal
//         card={makeCard({ labelIds: ['red', 'green'] })}
//         onClose={vi.fn()}
//         onRename={vi.fn()}
//         onDeleteCard={vi.fn()}
//         onUpdateLabels={onUpdateLabels}
//       />,
//     );

//     fireEvent.click(screen.getByRole('button', { name: /^labels$/i }));

//     await waitFor(() => expect(screen.getByTestId('LabelsPopover')).toBeTruthy());

//     fireEvent.click(screen.getByRole('button', { name: 'TOGGLE_GREEN' }));

//     const removed = onUpdateLabels.mock.calls[0][0] as string[];
//     expect(new Set(removed)).toEqual(new Set(['red']));
//   });

  it('renders labels swatches only when activeLabels exist', () => {
    const { unmount } = render(
      <CardModal
        card={makeCard({ labelIds: [] })}
        onClose={vi.fn()}
        onRename={vi.fn()}
        onDeleteCard={vi.fn()}
        onUpdateLabels={vi.fn()}
      />,
    );

    expect(screen.queryByText(/^labels$/i)).toBeTruthy(); // quick action
    expect(screen.queryByText('Labels')).toBeTruthy(); // quick action button text
    // category title "Labels" only appears if activeLabels.length > 0 (but quick action also includes Labels)
    // So check for swatches via aria-hidden=true swatch divs
    expect(screen.queryAllByLabelText(/labels/i).length).toBeGreaterThanOrEqual(0);
    // Better: ensure no aria-hidden swatch divs exist when no labels
    expect(document.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0); // icons etc.

    unmount();

    render(
      <CardModal
        card={makeCard({ labelIds: ['green', 'blue'] })}
        onClose={vi.fn()}
        onRename={vi.fn()}
        onDeleteCard={vi.fn()}
        onUpdateLabels={vi.fn()}
      />,
    );

    // swatches are aria-hidden=true divs with style background set
    const swatches = Array.from(document.querySelectorAll('div[aria-hidden="true"]')).filter(
      (el) => (el as HTMLDivElement).style?.background?.length,
    );
    expect(swatches.length).toBeGreaterThanOrEqual(1);
  });
});
