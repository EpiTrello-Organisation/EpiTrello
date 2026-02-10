import styles from './BoardCard.module.css';
import { LABELS } from '@/constants/labels';

export type CardMember = {
  user_id: string;
  username: string;
};

export type CardModel = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  list_id: string;
  creator_id: string;
  created_at: string;
  label_ids: number[];
  members?: CardMember[];
};

function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  const first = parts[0]?.[0] ?? 'U';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export default function BoardCard({ card, onOpen }: { card: CardModel; onOpen: () => void }) {
  const onIds = new Set<number>(card.label_ids ?? []);

  const activeLabels = LABELS.map((l, idx) => ({ id: idx, color: l.color })).filter((l) =>
    onIds.has(l.id),
  );

  const members = card.members ?? [];

  return (
    <button
      type="button"
      className={styles.card}
      aria-label={`Open card ${card.title}`}
      onClick={onOpen}
    >
      {activeLabels.length > 0 && (
        <div className={styles.labelStripes} aria-hidden="true">
          {activeLabels.map((l) => (
            <span key={l.id} className={styles.labelStripe} style={{ background: l.color }} />
          ))}
        </div>
      )}

      <div className={styles.title}>{card.title}</div>

      {members.length > 0 && (
        <div className={styles.members}>
          {members.map((m) => (
            <span
              key={m.user_id}
              className={styles.memberAvatar}
              title={m.username}
              aria-label={m.username}
            >
              {initialsForName(m.username)}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
