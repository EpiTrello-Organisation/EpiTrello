import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LabelsPopover, { type LabelItem } from './LabelsPopover';

vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: (props: any) => <svg data-testid="xmark" {...props} />,
}));

function firePointerDown(target: EventTarget) {
  const ev = new PointerEvent('pointerdown', { bubbles: true });
  Object.defineProperty(ev, 'target', { value: target });
  window.dispatchEvent(ev);
}

describe('components/LabelsPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  function setup(opts?: { open?: boolean; labels?: LabelItem[]; selectedIds?: number[] }) {
    const anchorEl = document.createElement('div');
    document.body.appendChild(anchorEl);

    const anchorRef = { current: anchorEl } as React.RefObject<HTMLDivElement>;

    const onClose = vi.fn();
    const onToggle = vi.fn();

    const labels: LabelItem[] = opts?.labels ?? [
      { id: 0, color: '#0f0' },
      { id: 1, color: '#f00' },
      { id: 2, color: '#00f' },
    ];

    const selectedIds = opts?.selectedIds ?? [1];

    const utils = render(
      <LabelsPopover
        open={opts?.open ?? true}
        anchorRef={anchorRef}
        onClose={onClose}
        labels={labels}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />,
    );

    return { ...utils, anchorEl, anchorRef, onClose, onToggle, labels };
  }

  it('returns null when open=false', () => {
    setup({ open: false });
    expect(screen.queryByRole('dialog', { name: /labels/i })).toBeNull();
  });

  it('renders dialog when open=true', () => {
    setup({ open: true });

    expect(screen.getByRole('dialog', { name: /labels/i })).toBeTruthy();

    expect(screen.getByRole('button', { name: /close labels/i })).toBeTruthy();

    expect(screen.getAllByText('Labels')).toHaveLength(1);

    expect(screen.queryByRole('textbox', { name: /search labels/i })).toBeNull();
  });

  it('close button calls onClose', () => {
    const { onClose } = setup({ open: true });

    fireEvent.click(screen.getByRole('button', { name: /close labels/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('marks selectedIds as checked', () => {
    setup({ open: true, selectedIds: [1] });

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes).toHaveLength(3);

    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].checked).toBe(true);
    expect(checkboxes[2].checked).toBe(false);
  });

  it('clicking color button toggles that label', () => {
    const { onToggle } = setup({ open: true });

    fireEvent.click(screen.getByRole('button', { name: /toggle label 0/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(0);
  });

  it('changing checkbox toggles that label', () => {
    const { onToggle } = setup({ open: true });

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(2);
  });

  it('clicking outside anchor and popover closes (capture pointerdown)', () => {
    const { onClose } = setup({ open: true });

    const outside = document.createElement('div');
    document.body.appendChild(outside);

    firePointerDown(outside);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking inside anchor does not close', () => {
    const { onClose, anchorEl } = setup({ open: true });

    firePointerDown(anchorEl);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clicking inside popover does not close', () => {
    const { onClose } = setup({ open: true });

    const dialog = screen.getByRole('dialog', { name: /labels/i });
    firePointerDown(dialog);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('removes pointerdown listener on unmount (capture=true)', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = setup({ open: true });

    expect(addSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function), { capture: true });

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function), { capture: true });
  });

  it('does not attach listener when open=false', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    setup({ open: false });

    expect(addSpy).not.toHaveBeenCalledWith('pointerdown', expect.any(Function), expect.anything());
  });
});
