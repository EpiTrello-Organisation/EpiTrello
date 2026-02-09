import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ShareModal.module.css';
import { XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export type ShareMember = {
  id: string;
  username: string;
  email: string;
  role: 'owner' | 'member';
};

export default function ShareModal({
  open,
  onClose,
  members,
}: {
  open: boolean;
  onClose: () => void;
  members?: ShareMember[];
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');

  const placeholderMembers = useMemo<ShareMember[]>(
    () => [
      { id: 'me', username: 'dylan winter (you)', email: '@dylanwinter6', role: 'owner' },
      { id: 'm1', username: 'Member A', email: 'member.a@example.com', role: 'member' },
      { id: 'm2', username: 'Member B', email: 'member.b@example.com', role: 'member' },
    ],
    [],
  );

  const list = members?.length ? members : placeholderMembers;

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Share board"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Share board</h2>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Close"
              title="Close"
              onClick={onClose}
            >
              <XMarkIcon className={styles.icon} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className={styles.topRow}>
          <input
            className={styles.input}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Email address or name"
            aria-label="Email address or name"
          />
          <button type="button" className={styles.shareBtn}>
            Share
          </button>
        </div>

        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            Board members <span className={styles.count}>{list.length}</span>
          </div>
        </div>

        <div className={styles.members} role="list">
          {list.map((m) => (
            <div key={m.id} className={styles.member} role="listitem">
              <UserCircleIcon className={styles.memberIcon} aria-hidden="true" />

              <div className={styles.memberInfo}>
                <div className={styles.memberName}>{m.username}</div>
                <div className={styles.memberEmail}>{m.email}</div>
              </div>

              <div className={styles.role}>{m.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
