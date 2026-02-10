import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChangeBgModal, { type ChangeBgPayload } from './ChangeBgModal';

describe('components/ChangeBgModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  function setup(overrides?: { open?: boolean; currentBgId?: string | null }) {
    const onClose = vi.fn();
    const onSelect = vi.fn();

    const utils = render(
      <ChangeBgModal
        open={overrides?.open ?? true}
        currentBgId={overrides?.currentBgId ?? null}
        onClose={onClose}
        onSelect={onSelect}
      />,
    );

    return { ...utils, onClose, onSelect };
  }

  it('renders nothing when closed', () => {
    const { container } = setup({ open: false });
    expect(container.innerHTML).toBe('');
  });

  it('renders the dialog when open', () => {
    setup();
    expect(screen.getByRole('dialog', { name: /change background/i })).toBeTruthy();
    expect(screen.getByText('Change background')).toBeTruthy();
  });

  it('renders 4 image tiles and 6 gradient tiles', () => {
    setup();
    const bgButtons = screen.getAllByRole('button', { name: /select background/i });
    const colorButtons = screen.getAllByRole('button', { name: /select color/i });
    expect(bgButtons).toHaveLength(4);
    expect(colorButtons).toHaveLength(6);
  });

  it('renders preview section', () => {
    setup();
    expect(screen.getByText('Background')).toBeTruthy();
  });

  it('calls onClose when close button is clicked', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const { onClose } = setup();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the overlay', () => {
    const { onClose } = setup();
    const overlay = screen.getByRole('dialog');
    fireEvent.mouseDown(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the panel', () => {
    const { onClose } = setup();
    fireEvent.mouseDown(screen.getByText('Change background'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clicking a gradient tile calls onSelect with gradient payload', () => {
    const { onSelect } = setup();
    const colorButtons = screen.getAllByRole('button', { name: /select color/i });
    fireEvent.click(colorButtons[0]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    const payload: ChangeBgPayload = onSelect.mock.calls[0][0];
    expect(payload.background_kind).toBe('gradient');
    expect(payload.background_value).toBe('g-1');
    expect(payload.background_thumb_url).toBeNull();
  });

  it('clicking an image tile calls onSelect with unsplash payload', () => {
    const { onSelect } = setup();
    const bgButtons = screen.getAllByRole('button', { name: /select background/i });
    fireEvent.click(bgButtons[1]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    const payload: ChangeBgPayload = onSelect.mock.calls[0][0];
    expect(payload.background_kind).toBe('unsplash');
    expect(payload.background_value).toBe('img-2');
    expect(payload.background_thumb_url).toContain('unsplash.com');
  });

  it('highlights the currentBgId tile as active', () => {
    setup({ currentBgId: 'g-3' });
    const colorButtons = screen.getAllByRole('button', { name: /select color/i });
    // g-3 is the 3rd gradient (index 2)
    expect(colorButtons[2].className).toContain('Active');
  });

  it('selecting a different tile updates the active state', () => {
    setup({ currentBgId: 'g-1' });
    const colorButtons = screen.getAllByRole('button', { name: /select color/i });

    expect(colorButtons[0].className).toContain('Active');
    expect(colorButtons[1].className).not.toContain('Active');

    fireEvent.click(colorButtons[1]);

    expect(colorButtons[1].className).toContain('Active');
  });

  it('cleans up Escape key listener when closed', () => {
    const { onClose, rerender } = setup();

    rerender(
      <ChangeBgModal open={false} currentBgId={null} onClose={onClose} onSelect={vi.fn()} />,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
