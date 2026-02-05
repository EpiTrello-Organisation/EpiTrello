import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditableText from './EditableText';

describe('components/EditableText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderComp(props?: Partial<React.ComponentProps<typeof EditableText>>) {
    const onChange = vi.fn();

    const utils = render(
      <EditableText
        value="Hello"
        className="btn"
        inputClassName="input"
        onChange={onChange}
        ariaLabel="Editable"
        {...props}
      />,
    );

    return { ...utils, onChange };
  }

  it('renders a button when not editing', () => {
    renderComp();

    const btn = screen.getByRole('button', { name: 'Editable' });
    expect(btn).toBeTruthy();
    expect(btn).toHaveTextContent('Hello');

    expect(screen.queryByRole('textbox', { name: 'Editable' })).toBeNull();
  });

  it('clicking the button enters edit mode and shows input (autofocus)', () => {
    renderComp();

    const btn = screen.getByRole('button', { name: 'Editable' });
    fireEvent.click(btn);

    const input = screen.getByRole('textbox', { name: 'Editable' }) as HTMLInputElement;
    expect(input.value).toBe('Hello');
    expect(document.activeElement).toBe(input);
  });

  it('typing updates draft value', () => {
    renderComp();

    fireEvent.click(screen.getByRole('button', { name: 'Editable' }));

    const input = screen.getByRole('textbox', { name: 'Editable' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  New  ' } });

    expect(input.value).toBe('  New  ');
  });

  it('Enter commits trimmed value, calls onChange if different, and exits edit mode', () => {
    const { onChange } = renderComp();

    fireEvent.click(screen.getByRole('button', { name: 'Editable' }));
    const input = screen.getByRole('textbox', { name: 'Editable' }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '  New  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('New');

    expect(screen.getByRole('button', { name: 'Editable' })).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: 'Editable' })).toBeNull();
  });

  it('does not call onChange when trimmed value is empty; still exits edit mode', () => {
    const { onChange } = renderComp();

    fireEvent.click(screen.getByRole('button', { name: 'Editable' }));
    const input = screen.getByRole('textbox', { name: 'Editable' });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Editable' })).toBeTruthy();
  });

  it('does not call onChange when value is unchanged (after trim); exits edit mode', () => {
    const { onChange } = renderComp({ value: 'Hello' });

    fireEvent.click(screen.getByRole('button', { name: 'Editable' }));
    const input = screen.getByRole('textbox', { name: 'Editable' });

    fireEvent.change(input, { target: { value: '  Hello  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Editable' })).toBeTruthy();
  });

  it('Blur commits (same rules as Enter)', () => {
    const { onChange } = renderComp();

    fireEvent.click(screen.getByRole('button', { name: 'Editable' }));
    const input = screen.getByRole('textbox', { name: 'Editable' });

    fireEvent.change(input, { target: { value: 'New' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('New');

    expect(screen.getByRole('button', { name: 'Editable' })).toBeTruthy();
  });

  it('Escape cancels editing (no onChange) and exits edit mode', () => {
    const { onChange } = renderComp();

    fireEvent.click(screen.getByRole('button', { name: 'Editable' }));
    const input = screen.getByRole('textbox', { name: 'Editable' });

    fireEvent.change(input, { target: { value: 'New' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Editable' })).toBeTruthy();
  });

  it('syncs draft when value prop changes (useEffect)', () => {
    const { rerender } = renderComp({ value: 'Hello' });

    fireEvent.click(screen.getByRole('button', { name: 'Editable' }));
    let input = screen.getByRole('textbox', { name: 'Editable' }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Draft' } });
    expect(input.value).toBe('Draft');

    rerender(
      <EditableText
        value="FromParent"
        className="btn"
        inputClassName="input"
        onChange={vi.fn()}
        ariaLabel="Editable"
      />,
    );

    input = screen.getByRole('textbox', { name: 'Editable' }) as HTMLInputElement;
    expect(input.value).toBe('FromParent');
  });
});
