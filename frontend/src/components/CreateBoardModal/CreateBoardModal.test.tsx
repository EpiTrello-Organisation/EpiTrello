import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateBoardModal from './CreateBoardModal';

describe('components/CreateBoardModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setup(props?: Partial<React.ComponentProps<typeof CreateBoardModal>>) {
    const onClose = vi.fn();
    const onCreate = vi.fn();

    const p: React.ComponentProps<typeof CreateBoardModal> = {
      open: true,
      onClose,
      onCreate,
      ...props,
    };

    const utils = render(<CreateBoardModal {...p} />);
    return { ...utils, onClose, onCreate };
  }

  it('returns null when open=false', () => {
    setup({ open: false });
    expect(screen.queryByRole('dialog', { name: /create board/i })).toBeNull();
  });

  it('renders dialog when open=true', () => {
    setup({ open: true });
    expect(screen.getByRole('dialog', { name: /create board/i })).toBeTruthy();
    expect(screen.getByText(/create board/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /close/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^create$/i })).toBeTruthy();
  });

  it('close button calls onClose', () => {
    const { onClose } = setup({ open: true });

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pressing Escape calls onClose (only when open)', () => {
    const { onClose } = setup({ open: true });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking overlay background closes; clicking panel does not', () => {
    const { onClose } = setup({ open: true });

    const dialog = screen.getByRole('dialog', { name: /create board/i });

    fireEvent.mouseDown(screen.getByText(/create board/i));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Create is disabled until title has non-whitespace', () => {
    setup({ open: true });

    const createBtn = screen.getByRole('button', { name: /^create$/i }) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '   ' } });
    expect(createBtn.disabled).toBe(true);

    fireEvent.change(input, { target: { value: '  My board  ' } });
    expect(createBtn.disabled).toBe(false);
  });

  it('shows inline error only after blur when title is empty/whitespace', () => {
    setup({ open: true });

    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '   ' } });
    expect(screen.queryByText(/board title is required/i)).toBeNull();

    fireEvent.blur(input);
    expect(screen.getByText(/board title is required/i)).toBeTruthy();
  });

  it('clicking Create calls onCreate with trimmed title + background payload', () => {
    const { onCreate } = setup({ open: true });

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  Hello  ' } });

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    expect(onCreate).toHaveBeenCalledTimes(1);

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Hello',
        background_kind: 'unsplash',
        background_value: 'img-1',
        background_thumb_url: expect.stringMatching(/^https:\/\/images\.unsplash\.com\//),
      }),
    );
  });

  it('resets state each time open becomes true (title cleared, error cleared)', () => {
    const onClose = vi.fn();
    const onCreate = vi.fn();

    const { rerender } = render(
      <CreateBoardModal open={true} onClose={onClose} onCreate={onCreate} />,
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);
    expect(screen.getByText(/board title is required/i)).toBeTruthy();

    rerender(<CreateBoardModal open={false} onClose={onClose} onCreate={onCreate} />);
    expect(screen.queryByRole('dialog', { name: /create board/i })).toBeNull();

    rerender(<CreateBoardModal open={true} onClose={onClose} onCreate={onCreate} />);

    const input2 = screen.getByRole('textbox') as HTMLInputElement;
    expect(input2.value).toBe('');
    expect(screen.queryByText(/board title is required/i)).toBeNull();

    const createBtn = screen.getByRole('button', { name: /^create$/i }) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
  });

  it('selecting a gradient updates the preview backgroundImage', () => {
    setup({ open: true });

    const dialog = screen.getByRole('dialog', { name: /create board/i });
    const preview = dialog.querySelector('div[class*="preview_"]') as HTMLDivElement;
    expect(preview).toBeTruthy();

    const before = preview.style.backgroundImage;

    const colorButtons = screen.getAllByRole('button', { name: /select color/i });
    fireEvent.click(colorButtons[0]);

    const after = preview.style.backgroundImage;
    expect(after).not.toBe(before);
    expect(after.length).toBeGreaterThan(0);
  });

  it('clicking Create after selecting a gradient sends gradient payload', () => {
    const { onCreate } = setup({ open: true });

    const colorButtons = screen.getAllByRole('button', { name: /select color/i });
    fireEvent.click(colorButtons[0]);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  Grad  ' } });

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Grad',
        background_kind: 'gradient',
        background_value: 'g-1',
        background_thumb_url: null,
      }),
    );
  });

  it('clicking an image background updates the preview backgroundImage', () => {
    setup({ open: true });

    const dialog = screen.getByRole('dialog', { name: /create board/i });
    const preview = dialog.querySelector('div[class*="preview_"]') as HTMLDivElement;
    expect(preview).toBeTruthy();

    const before = preview.style.backgroundImage;

    const bgButtons = screen.getAllByRole('button', { name: /select background/i });
    expect(bgButtons.length).toBeGreaterThan(1);

    fireEvent.click(bgButtons[1]); // click img-2 (pas le défaut img-1)

    const after = preview.style.backgroundImage;
    expect(after).not.toBe(before);
    expect(after).toMatch(/^url\(/);
  });
});
