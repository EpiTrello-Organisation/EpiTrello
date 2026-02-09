// src/components/FilterMembersModal/FilterMembersModal.test.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterMembersModal, { type FilterMemberItem } from './FilterMembersModal';

// Mock heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: (props: any) => <svg data-testid="XMarkIcon" {...props} />,
}));

function firePointerDown(target: EventTarget) {
  const ev = new PointerEvent('pointerdown', { bubbles: true });
  Object.defineProperty(ev, 'target', { value: target });
  window.dispatchEvent(ev);
}

describe('components/FilterMembersModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  const members: FilterMemberItem[] = [
    { id: 'u1', username: 'Ada Lovelace', email: 'ada@example.com' },
    { id: 'u2', username: 'Grace Hopper', email: 'grace@example.com' },
    { id: 'u3', username: 'Linus Torvalds', email: 'linus@kernel.org' },
  ];

  function renderComp(overrides?: Partial<React.ComponentProps<typeof FilterMembersModal>>) {
    const onClose = vi.fn();
    const onToggle = vi.fn();
    const onClear = vi.fn();

    const anchorRef = { current: document.createElement('div') } as React.RefObject<HTMLDivElement>;
    document.body.appendChild(anchorRef.current!);

    const props: React.ComponentProps<typeof FilterMembersModal> = {
      open: true,
      anchorRef,
      onClose,
      members,
      selectedIds: [],
      onToggle,
      onClear,
      ...overrides,
    };

    const utils = render(<FilterMembersModal {...props} />);
    return { ...utils, onClose, onToggle, onClear, anchorRef };
  }

  it('returns null when open=false', () => {
    renderComp({ open: false });
    expect(screen.queryByRole('dialog', { name: /filter/i })).toBeNull();
  });

  it('renders the modal UI when open=true', () => {
    renderComp();

    expect(screen.getByRole('dialog', { name: /filter/i })).toBeTruthy();
    expect(screen.getByText('Filter')).toBeTruthy();
    expect(screen.getByRole('searchbox', { name: /search members/i })).toBeTruthy();
    expect(screen.getByText(/board members/i)).toBeTruthy();

    // rows are role=listitem (because the component sets role="listitem" on the button)
    expect(screen.getByRole('listitem', { name: /toggle member ada lovelace/i })).toBeTruthy();
    expect(screen.getByRole('listitem', { name: /toggle member grace hopper/i })).toBeTruthy();
    expect(screen.getByRole('listitem', { name: /toggle member linus torvalds/i })).toBeTruthy();

    // hint (no selection)
    expect(screen.getByText(/select members to filter cards/i)).toBeTruthy();

    // clear hidden when count=0
    expect(screen.queryByRole('button', { name: /clear filters/i })).toBeNull();
  });

  it('filters the list based on search query (by username or email)', () => {
    renderComp();

    const search = screen.getByRole('searchbox', { name: /search members/i });

    fireEvent.change(search, { target: { value: 'grace' } });

    expect(screen.queryByRole('listitem', { name: /toggle member ada lovelace/i })).toBeNull();
    expect(screen.getByRole('listitem', { name: /toggle member grace hopper/i })).toBeTruthy();
    expect(screen.queryByRole('listitem', { name: /toggle member linus torvalds/i })).toBeNull();

    fireEvent.change(search, { target: { value: 'kernel' } });
    expect(screen.getByRole('listitem', { name: /toggle member linus torvalds/i })).toBeTruthy();
    expect(screen.queryByRole('listitem', { name: /toggle member grace hopper/i })).toBeNull();
  });

  it('clicking a member row calls onToggle with the member id', () => {
    const { onToggle } = renderComp();

    fireEvent.click(screen.getByRole('listitem', { name: /toggle member ada lovelace/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('u1');
  });

  it('shows Clear button and pluralized hint when selectedIds length > 0', () => {
    const { onClear } = renderComp({ selectedIds: ['u1', 'u2'] });

    expect(screen.getByRole('button', { name: /clear filters/i })).toBeTruthy();
    expect(screen.getByText(/showing cards assigned to 2 members\./i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('clicking close calls onClose', () => {
    const { onClose } = renderComp();

    fireEvent.click(screen.getByRole('button', { name: /close filter/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pointerdown outside anchor and modal calls onClose', () => {
    const { onClose } = renderComp();

    firePointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pointerdown inside anchor does NOT call onClose', () => {
    const { onClose, anchorRef } = renderComp();

    firePointerDown(anchorRef.current as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(0);
  });

  it('pointerdown inside modal does NOT call onClose', () => {
    const { onClose } = renderComp();

    const dialog = screen.getByRole('dialog', { name: /filter/i });
    firePointerDown(dialog);
    expect(onClose).toHaveBeenCalledTimes(0);
  });

  it('resets the search query when re-opened', () => {
    const onClose = vi.fn();
    const onToggle = vi.fn();
    const onClear = vi.fn();

    const anchorRef = { current: document.createElement('div') } as React.RefObject<HTMLDivElement>;
    document.body.appendChild(anchorRef.current!);

    const { rerender } = render(
      <FilterMembersModal
        open
        anchorRef={anchorRef}
        onClose={onClose}
        members={members}
        selectedIds={[]}
        onToggle={onToggle}
        onClear={onClear}
      />,
    );

    const search = screen.getByRole('searchbox', { name: /search members/i });
    fireEvent.change(search, { target: { value: 'grace' } });
    expect((search as HTMLInputElement).value).toBe('grace');

    rerender(
      <FilterMembersModal
        open={false}
        anchorRef={anchorRef}
        onClose={onClose}
        members={members}
        selectedIds={[]}
        onToggle={onToggle}
        onClear={onClear}
      />,
    );

    rerender(
      <FilterMembersModal
        open
        anchorRef={anchorRef}
        onClose={onClose}
        members={members}
        selectedIds={[]}
        onToggle={onToggle}
        onClear={onClear}
      />,
    );

    const search2 = screen.getByRole('searchbox', { name: /search members/i });
    expect((search2 as HTMLInputElement).value).toBe('');
  });
});
