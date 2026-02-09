import { useEffect, useRef, useState } from 'react';
import styles from './ShareModal.module.css';
import { XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useMember, type BoardMemberApi } from '@/hooks/useMember';

export type ShareMember = {
  id: string;
  username: string;
  email: string;
  role: 'owner' | 'member';
};

type InlineMessage = { text: string; tone: 'error' | 'success' } | null;

function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}

function emailToUsername(email: string) {
  const at = email.indexOf('@');
  const base = at > 0 ? email.slice(0, at) : email;
  return base || 'Member';
}

function isEmailLike(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function mapApiMember(m: BoardMemberApi): ShareMember {
  return {
    id: m.user_id,
    email: m.email,
    username: m.username,
    role: m.role,
  };
}

export default function ShareModal({
  open,
  onClose,
  boardId,
}: {
  open: boolean;
  onClose: () => void;
  boardId?: string;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<ShareMember[]>([]);
  const [message, setMessage] = useState<InlineMessage>(null);

  const { loading, actions } = useMember(boardId);
  const { getMembers, addMember } = actions; // ✅ ne plus dépendre de "actions" dans les effects

  // GET members once when modal opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    setQuery('');
    setMessage(null);
    setMembers([]);

    if (!boardId) {
      setMessage({ text: 'Missing board id.', tone: 'error' });
      return;
    }

    (async () => {
      try {
        const apiMembers = await getMembers();
        if (cancelled) return;
        setMembers(apiMembers.map(mapApiMember));
      } catch (e: any) {
        if (cancelled) return;
        const detail = typeof e?.detail === 'string' ? e.detail : 'Unable to fetch members.';
        setMessage({ text: detail, tone: 'error' });
        setMembers([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, boardId, getMembers]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const normalized = normalizeEmail(query);
  const canSubmit = !loading && normalized.length > 0 && isEmailLike(normalized);

  async function onShare() {
    if (loading) return;

    setMessage(null);

    const email = normalizeEmail(query);
    if (!email) return;

    if (!isEmailLike(email)) {
      setMessage({ text: 'Please enter a valid email address.', tone: 'error' });
      return;
    }

    if (!boardId) {
      setMessage({ text: 'Missing board id.', tone: 'error' });
      return;
    }

    const already = members.some((m) => normalizeEmail(m.email) === email);
    if (already) {
      setMessage({ text: 'User already member of this board', tone: 'error' });
      return;
    }

    try {
      const res = await addMember(email);

      if (res.status === 201) {
        setMessage({ text: res.detail || 'Member added', tone: 'success' });

        // optimistic add
        setMembers((prev) => [
          ...prev,
          {
            id: `pending:${email}`,
            username: emailToUsername(email),
            email,
            role: 'member',
          },
        ]);

        setQuery('');
        return;
      }

      setMessage({ text: res.detail || 'Member added', tone: 'success' });
    } catch (e: any) {
      const status = typeof e?.status === 'number' ? e.status : undefined;
      const detail = typeof e?.detail === 'string' ? e.detail : undefined;

      if (status === 400 && detail === 'User already member of this board') {
        setMessage({ text: detail, tone: 'error' });
        return;
      }

      if (status === 404 && detail === 'User not found') {
        setMessage({ text: detail, tone: 'error' });
        return;
      }

      setMessage({ text: detail || 'Unable to add member.', tone: 'error' });
    }
  }

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
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onShare();
            }}
          />
          <button
            type="button"
            className={styles.shareBtn}
            onClick={onShare}
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
          >
            Share
          </button>
        </div>

        {message ? (
          <div
            style={{
              padding: '0 12px 8px',
              fontSize: 12,
              color: message.tone === 'success' ? 'var(--success)' : 'var(--error)',
            }}
          >
            {message.text}
          </div>
        ) : null}

        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            Board members <span className={styles.count}>{members.length}</span>
          </div>
        </div>

        <div className={styles.members} role="list">
          {members.map((m) => (
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
