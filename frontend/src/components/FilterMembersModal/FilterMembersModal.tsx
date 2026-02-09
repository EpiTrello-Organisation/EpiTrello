import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './FilterMembersModal.module.css';
import { XMarkIcon } from '@heroicons/react/24/outline';

export type FilterMemberItem = {
  id: string;
  username: string;
  email: string;
};

function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  const first = parts[0]?.[0] ?? 'U';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export default function FilterMembersModal({
  open,
  anchorRef,
  onClose,
  members,
  selectedIds,
  onToggle,
  onClear,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;

  members: FilterMemberItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');

  const selectedSet = useMemo(() => new Set(selectedIds ?? []), [selectedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;

    return members.filter((m) => {
      const u = m.username.toLowerCase();
      const e = m.email.toLowerCase();
      return u.includes(q) || e.includes(q);
    });
  }, [members, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const opts: AddEventListenerOptions = { capture: true };

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;

      const anchorEl = anchorRef.current;
      const popoverEl = popoverRef.current;

      const clickedInAnchor = !!anchorEl && anchorEl.contains(target);
      const clickedInPopover = !!popoverEl && popoverEl.contains(target);

      if (!clickedInAnchor && !clickedInPopover) onClose();
    }

    window.addEventListener('pointerdown', onPointerDown, opts);
    return () => window.removeEventListener('pointerdown', onPointerDown, opts);
  }, [open, anchorRef, onClose]);

  if (!open) return null;

  const count = selectedIds?.length ?? 0;

  return (
    <div className={styles.popover} ref={popoverRef} role="dialog" aria-label="Filter">
      <div className={styles.header}>
        <div className={styles.title}>Filter</div>

        {count > 0 ? (
          <button
            type="button"
            className={styles.clear}
            onClick={onClear}
            aria-label="Clear filters"
            title="Clear"
          >
            Clear
          </button>
        ) : null}

        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close filter"
          title="Close"
        >
          <XMarkIcon className={styles.closeIcon} aria-hidden="true" />
        </button>
      </div>

      <input
        className={styles.search}
        type="search"
        value={query}
        placeholder="Search members"
        aria-label="Search members"
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className={styles.sectionTitle}>Board members</div>

      <div className={styles.list} role="list">
        {filtered.map((m) => {
          const checked = selectedSet.has(m.id);

          return (
            <button
              key={m.id}
              type="button"
              className={`${styles.row} ${checked ? styles.rowActive : ''}`}
              onClick={() => onToggle(m.id)}
              aria-label={`Toggle member ${m.username}`}
              role="listitem"
            >
              <div className={styles.avatar} aria-hidden="true">
                {initialsForName(m.username)}
              </div>

              <div className={styles.user}>
                <div className={styles.username}>{m.username}</div>
                <div className={styles.email}>{m.email}</div>
              </div>
            </button>
          );
        })}
      </div>

      {count > 0 ? (
        <div className={styles.hint} aria-live="polite">
          Showing cards assigned to {count} member{count > 1 ? 's' : ''}.
        </div>
      ) : (
        <div className={styles.hint} aria-live="polite">
          Select members to filter cards.
        </div>
      )}
    </div>
  );
}
