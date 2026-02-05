import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddCardComposer from './AddCardComposer';

describe('components/AddCardComposer', () => {
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

  function renderComp(props?: Partial<React.ComponentProps<typeof AddCardComposer>>) {
    const onOpen = vi.fn();
    const onChange = vi.fn();
    const onCancel = vi.fn();
    const onSubmit = vi.fn();

    render(
      <AddCardComposer
        open={false}
        value=""
        onOpen={onOpen}
        onChange={onChange}
        onCancel={onCancel}
        onSubmit={onSubmit}
        {...props}
      />,
    );

    return { onOpen, onChange, onCancel, onSubmit };
  }

  it('when closed, renders "+ Add a card" button and calls onOpen on click', () => {
    const { onOpen } = renderComp({ open: false });

    const btn = screen.getByRole('button', { name: /\+\s*add a card/i });
    fireEvent.click(btn);

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText(/card title/i)).toBeNull();
  });

  it('when open, renders input with value and calls onChange on typing', () => {
    const { onChange } = renderComp({ open: true, value: 'Hello' });

    const input = screen.getByLabelText('Card title') as HTMLInputElement;
    expect(input.value).toBe('Hello');

    fireEvent.change(input, { target: { value: 'New' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('New');
  });

  it('pressing Enter in input calls onSubmit', () => {
    const { onSubmit } = renderComp({ open: true });

    const input = screen.getByLabelText('Card title');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('pressing Escape in input calls onCancel', () => {
    const { onCancel } = renderComp({ open: true });

    const input = screen.getByLabelText('Card title');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('when showActions=true (default), shows action buttons and they call submit/cancel', () => {
    const { onSubmit, onCancel } = renderComp({ open: true });

    fireEvent.click(screen.getByRole('button', { name: /add card/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('when showActions=false, hides action buttons', () => {
    renderComp({ open: true, showActions: false });

    expect(screen.queryByRole('button', { name: /add card/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /cancel/i })).toBeNull();
  });

  it('when open becomes true, focuses the input via requestAnimationFrame', () => {
    const { rerender } = render(
      <AddCardComposer
        open={false}
        value=""
        onOpen={vi.fn()}
        onChange={vi.fn()}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('Card title')).toBeNull();

    rerender(
      <AddCardComposer
        open={true}
        value=""
        onOpen={vi.fn()}
        onChange={vi.fn()}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Card title') as HTMLInputElement;

    expect(document.activeElement).toBe(input);
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  });
});
