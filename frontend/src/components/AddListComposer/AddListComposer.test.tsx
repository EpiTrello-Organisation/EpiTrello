import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddListComposer from './AddListComposer';

describe('components/AddListComposer', () => {
  let rafSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(performance.now());
        return 1;
      });
  });

  afterEach(() => {
    rafSpy?.mockRestore?.();
  });

  function renderComp(props?: Partial<React.ComponentProps<typeof AddListComposer>>) {
    const onOpen = vi.fn();
    const onChange = vi.fn();
    const onCancel = vi.fn();
    const onSubmit = vi.fn();

    const utils = render(
      <AddListComposer
        open={false}
        value=""
        onOpen={onOpen}
        onChange={onChange}
        onCancel={onCancel}
        onSubmit={onSubmit}
        {...props}
      />,
    );

    return { ...utils, onOpen, onChange, onCancel, onSubmit };
  }

  function firePointerDown(target: EventTarget) {
    const ev = new PointerEvent('pointerdown', { bubbles: true });
    Object.defineProperty(ev, 'target', { value: target });
    window.dispatchEvent(ev);
  }

  it('when closed, renders "+ Add another list" button and calls onOpen on click', () => {
    const { onOpen } = renderComp({ open: false });

    const btn = screen.getByRole('button', { name: /\+\s*add another list/i });
    fireEvent.click(btn);

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText(/list name/i)).toBeNull();
  });

  it('when open, renders input with value and calls onChange', () => {
    const { onChange } = renderComp({ open: true, value: 'Todo' });

    const input = screen.getByLabelText('List name') as HTMLInputElement;
    expect(input.value).toBe('Todo');

    fireEvent.change(input, { target: { value: 'New' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('New');
  });

  it('pressing Enter submits; pressing Escape cancels', () => {
    const { onSubmit, onCancel } = renderComp({ open: true });

    const input = screen.getByLabelText('List name');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('action buttons call onSubmit / onCancel', () => {
    const { onSubmit, onCancel } = renderComp({ open: true });

    fireEvent.click(screen.getByRole('button', { name: /add list/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('when open becomes true, focuses the input via requestAnimationFrame', () => {
    const { rerender } = renderComp({ open: false });

    expect(screen.queryByLabelText('List name')).toBeNull();

    rerender(
      <AddListComposer
        open={true}
        value=""
        onOpen={vi.fn()}
        onChange={vi.fn()}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('List name') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('clicking outside when open calls onCancel; clicking inside does not', () => {
    const { onCancel, container } = renderComp({ open: true });

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toBeTruthy();

    firePointerDown(wrapper);
    expect(onCancel).not.toHaveBeenCalled();

    const outside = document.createElement('div');
    document.body.appendChild(outside);

    firePointerDown(outside);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('removes pointerdown listener on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderComp({ open: true });

    expect(addSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function), { capture: true });

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function), { capture: true });
  });

  it('detaches listener when open toggles to false', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { rerender, onCancel } = renderComp({ open: true });

    rerender(
      <AddListComposer
        open={false}
        value=""
        onOpen={vi.fn()}
        onChange={vi.fn()}
        onCancel={onCancel}
        onSubmit={vi.fn()}
      />,
    );

    expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function), { capture: true });
  });
});
