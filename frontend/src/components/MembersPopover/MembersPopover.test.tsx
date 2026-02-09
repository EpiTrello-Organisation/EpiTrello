import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MembersPopover, { type MemberItem } from './MembersPopover';

function renderPopover(opts?: Partial<React.ComponentProps<typeof MembersPopover>>) {
  const onClose = vi.fn();
  const onToggle = vi.fn();

  const members: MemberItem[] = [
    { id: 'u1', username: 'Alice Wonderland', email: 'alice@example.com' },
    { id: 'u2', username: 'Bob', email: 'bob@work.com' },
    { id: 'u3', username: '   ', email: 'emptyname@x.com' },
    { id: 'u4', username: 'Jean  Claude  Van Damme', email: 'jc@vd.com' },
  ];

  const anchorRef = { current: null } as React.RefObject<HTMLDivElement | null>;

  render(
    <>
      <div
        data-testid="anchor"
        ref={(el) => {
          (anchorRef as any).current = el;
        }}
      />

      <MembersPopover
        open
        anchorRef={anchorRef}
        onClose={onClose}
        members={members}
        selectedIds={[]}
        onToggle={onToggle}
        {...opts}
      />
    </>,
  );

  return { onClose, onToggle, members };
}

describe('MembersPopover', () => {
  it('renders dialog, header and list items when open=true', () => {
    renderPopover();

    expect(screen.getByRole('dialog', { name: 'Members' })).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Board members')).toBeInTheDocument();

    expect(
      screen.getByRole('listitem', { name: 'Toggle member Alice Wonderland' }),
    ).toBeInTheDocument();

    expect(screen.getByRole('listitem', { name: 'Toggle member Bob' })).toBeInTheDocument();

    expect(
      screen.getByRole('listitem', {
        name: /toggle member jean\s+claude\s+van\s+damme/i,
      }),
    ).toBeInTheDocument();
  });

  it('calls onToggle with member id when clicking a row', () => {
    const { onToggle } = renderPopover();

    fireEvent.click(screen.getByRole('listitem', { name: 'Toggle member Bob' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('u2');
  });

  it('marks selected members as active when selectedIds contains id', () => {
    renderPopover({
      selectedIds: ['u2', 'u4'],
    });

    const bobRow = screen.getByRole('listitem', { name: 'Toggle member Bob' });
    const jcRow = screen.getByRole('listitem', {
      name: /toggle member jean\s+claude\s+van\s+damme/i,
    });
    const aliceRow = screen.getByRole('listitem', {
      name: 'Toggle member Alice Wonderland',
    });

    expect(bobRow.className).toMatch(/rowActive/);
    expect(jcRow.className).toMatch(/rowActive/);
    expect(aliceRow.className).not.toMatch(/rowActive/);
  });

  it('filters by username (case-insensitive) when typing in search input', () => {
    renderPopover();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search members' }), {
      target: { value: 'alice' },
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(
      screen.getByRole('listitem', { name: 'Toggle member Alice Wonderland' }),
    ).toBeInTheDocument();

    expect(screen.queryByRole('listitem', { name: 'Toggle member Bob' })).toBeNull();
  });

  it('filters by email (case-insensitive) when typing in search input', () => {
    renderPopover();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search members' }), {
      target: { value: 'WORK' },
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('listitem', { name: 'Toggle member Bob' })).toBeInTheDocument();
  });

  it('resets search query when popover is reopened', () => {
    const { rerender } = render(
      (() => {
        const anchorRef = { current: null } as React.RefObject<HTMLDivElement | null>;

        return (
          <>
            <div
              data-testid="anchor"
              ref={(el) => {
                (anchorRef as any).current = el;
              }}
            />

            <MembersPopover
              open
              anchorRef={anchorRef}
              onClose={vi.fn()}
              onToggle={vi.fn()}
              members={[
                { id: 'u1', username: 'Alice', email: 'a@a.com' },
                { id: 'u2', username: 'Bob', email: 'b@b.com' },
              ]}
              selectedIds={[]}
            />
          </>
        );
      })(),
    );

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'alice' },
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(1);

    // close
    rerender(<></>);

    // reopen
    rerender(
      (() => {
        const anchorRef = { current: null } as React.RefObject<HTMLDivElement | null>;
        return (
          <>
            <div
              data-testid="anchor"
              ref={(el) => {
                (anchorRef as any).current = el;
              }}
            />

            <MembersPopover
              open
              anchorRef={anchorRef}
              onClose={vi.fn()}
              onToggle={vi.fn()}
              members={[
                { id: 'u1', username: 'Alice', email: 'a@a.com' },
                { id: 'u2', username: 'Bob', email: 'b@b.com' },
              ]}
              selectedIds={[]}
            />
          </>
        );
      })(),
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('calls onClose when clicking outside anchor and popover', () => {
    const { onClose } = renderPopover();

    fireEvent.pointerDown(document.body);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking close button', () => {
    const { onClose } = renderPopover();

    fireEvent.click(screen.getByRole('button', { name: 'Close members' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('returns null when open=false', () => {
    const anchorRef = { current: null } as React.RefObject<HTMLDivElement | null>;

    const { container } = render(
      <MembersPopover
        open={false}
        anchorRef={anchorRef}
        onClose={vi.fn()}
        onToggle={vi.fn()}
        members={[]}
        selectedIds={[]}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
