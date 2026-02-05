import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BoardTopBar from './BoardTopBar';

vi.mock('../EditableText/EditableText', () => ({
  default: (props: any) => (
    <button type="button" aria-label={props.ariaLabel} onClick={() => props.onChange('Renamed')}>
      {props.value}
    </button>
  ),
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

    const utils = render(
      <BoardTopBar
        title="My board"
        onRename={onRename}
        onDeleteBoard={onDeleteBoard}
        {...overrides}
      />,
    );

    return { ...utils, onRename, onDeleteBoard };
  }

  it('renders base UI elements', () => {
    renderComp();

    expect(screen.getByRole('button', { name: /edit board title/i })).toBeTruthy();

    expect(screen.getByLabelText(/board members/i)).toBeTruthy();

    expect(screen.getByRole('button', { name: /filter/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /change visibility/i })).toBeTruthy();
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

//   it('clicking outside closes the menu when open', () => {
//     renderComp();

//     fireEvent.click(screen.getByRole('button', { name: /board menu/i }));
//     expect(screen.getByRole('button', { name: /delete board/i })).toBeTruthy();

//     const outside = document.createElement('div');
//     document.body.appendChild(outside);

//     firePointerDown(outside);

//     expect(screen.queryByRole('button', { name: /delete board/i })).toBeNull();
//   });

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
});
