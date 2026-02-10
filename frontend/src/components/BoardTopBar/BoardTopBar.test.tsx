import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import BoardTopBar from './BoardTopBar';

vi.mock('../EditableText/EditableText', () => ({
  default: (props: any) => (
    <button type="button" aria-label={props.ariaLabel} onClick={() => props.onChange('Renamed')}>
      {props.value}
    </button>
  ),
}));

vi.mock('../ShareModal/ShareModal', () => ({
  default: (props: any) =>
    props.open ? (
      <div data-testid="share-modal" onClick={props.onClose}>
        ShareModal
      </div>
    ) : null,
}));

vi.mock('../FilterMembersModal/FilterMembersModal', () => ({
  default: (props: any) =>
    props.open ? (
      <div data-testid="filter-modal">
        <button onClick={props.onClose}>close-filter</button>
      </div>
    ) : null,
  __esModule: true,
}));

vi.mock('../ChangeBgModal/ChangeBgModal', () => ({
  default: (props: any) =>
    props.open ? (
      <div data-testid="changebg-modal">
        <button
          onClick={() =>
            props.onSelect({
              background_kind: 'gradient',
              background_value: 'g-2',
              background_thumb_url: null,
            })
          }
        >
          pick-bg
        </button>
        <button onClick={props.onClose}>close-bg</button>
      </div>
    ) : null,
  __esModule: true,
}));

function firePointerDown(target: EventTarget) {
  const ev = new PointerEvent('pointerdown', { bubbles: true });
  Object.defineProperty(ev, 'target', { value: target });
  window.dispatchEvent(ev);
}

describe('components/BoardTopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  function renderComp(overrides?: Partial<React.ComponentProps<typeof BoardTopBar>>) {
    const onRename = vi.fn();
    const onDeleteBoard = vi.fn();

    // NEW required filter props
    const onToggleFilterMember = vi.fn();
    const onClearFilter = vi.fn();
    const onChangeBg = vi.fn();

    const utils = render(
      <BoardTopBar
        title="My board"
        onRename={onRename}
        onDeleteBoard={onDeleteBoard}
        onChangeBg={onChangeBg}
        currentBgId={null}
        // defaults for new required props
        filterMembers={[]}
        filterSelectedIds={[]}
        onToggleFilterMember={onToggleFilterMember}
        onClearFilter={onClearFilter}
        {...overrides}
      />,
    );

    return { ...utils, onRename, onDeleteBoard, onToggleFilterMember, onClearFilter, onChangeBg };
  }

  it('renders base UI elements', () => {
    renderComp();

    expect(screen.getByRole('button', { name: /edit board title/i })).toBeTruthy();

    expect(screen.getByRole('button', { name: /filter/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /share/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /board menu/i })).toBeTruthy();
  });

  it('clicking the title triggers onRename (via EditableText)', () => {
    const { onRename } = renderComp({ title: 'Old' });

    fireEvent.click(screen.getByRole('button', { name: /edit board title/i }));
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onRename).toHaveBeenCalledWith('Renamed');
  });

  it('toggles board menu on button click', () => {
    renderComp();

    expect(screen.queryByRole('button', { name: /delete board/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /board menu/i }));
    expect(screen.getByRole('button', { name: /delete board/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /board menu/i }));
    expect(screen.queryByRole('button', { name: /delete board/i })).toBeNull();
  });

  it('clicking inside the menu wrapper does not close the menu', () => {
    const { container } = renderComp();

    fireEvent.click(screen.getByRole('button', { name: /board menu/i }));
    expect(screen.getByRole('button', { name: /delete board/i })).toBeTruthy();

    const menuBtn = screen.getByRole('button', { name: /board menu/i });
    const wrapper = menuBtn.closest('div');
    expect(wrapper).toBeTruthy();

    firePointerDown(wrapper as HTMLElement);

    expect(screen.getByRole('button', { name: /delete board/i })).toBeTruthy();
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('"Delete Board" closes menu and calls onDeleteBoard', () => {
    const { onDeleteBoard } = renderComp();

    fireEvent.click(screen.getByRole('button', { name: /board menu/i }));
    const del = screen.getByRole('button', { name: /delete board/i });

    fireEvent.click(del);

    expect(onDeleteBoard).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /delete board/i })).toBeNull();
  });

  it('toggles filter modal on Filter button click', () => {
    renderComp();

    expect(screen.queryByTestId('filter-modal')).toBeNull();

    fireEvent.click(screen.getByTitle('Filter'));
    expect(screen.getByTestId('filter-modal')).toBeTruthy();

    fireEvent.click(screen.getByTitle('Filter'));
    expect(screen.queryByTestId('filter-modal')).toBeNull();
  });

  it('opens share modal when Share button is clicked', () => {
    renderComp();

    expect(screen.queryByTestId('share-modal')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    expect(screen.getByTestId('share-modal')).toBeTruthy();
  });

  it('"Change background" opens ChangeBgModal and forwards onChangeBg', () => {
    const { onChangeBg } = renderComp();

    fireEvent.click(screen.getByRole('button', { name: /board menu/i }));
    fireEvent.click(screen.getByText('Change background'));

    // menu should close, ChangeBgModal should open
    expect(screen.queryByText('Delete Board')).toBeNull();
    expect(screen.getByTestId('changebg-modal')).toBeTruthy();

    // simulate picking a background
    fireEvent.click(screen.getByText('pick-bg'));
    expect(onChangeBg).toHaveBeenCalledWith({
      background_kind: 'gradient',
      background_value: 'g-2',
      background_thumb_url: null,
    });
  });

  it('closing ChangeBgModal via onClose hides it', () => {
    renderComp();

    // open the menu, click Change background
    fireEvent.click(screen.getByRole('button', { name: /board menu/i }));
    fireEvent.click(screen.getByText('Change background'));
    expect(screen.getByTestId('changebg-modal')).toBeTruthy();

    // close the ChangeBgModal
    fireEvent.click(screen.getByText('close-bg'));
    expect(screen.queryByTestId('changebg-modal')).toBeNull();
  });

  it('closing FilterMembersModal via onClose hides it', () => {
    renderComp();

    fireEvent.click(screen.getByRole('button', { name: /filter/i }));
    expect(screen.getByTestId('filter-modal')).toBeTruthy();

    fireEvent.click(screen.getByText('close-filter'));
    expect(screen.queryByTestId('filter-modal')).toBeNull();
  });

  it('outside pointer-down closes menu', () => {
    renderComp();

    fireEvent.click(screen.getByRole('button', { name: /board menu/i }));
    expect(screen.getByText('Delete Board')).toBeTruthy();

    act(() => {
      firePointerDown(document.body);
    });
    expect(screen.queryByText('Delete Board')).toBeNull();
  });
});
