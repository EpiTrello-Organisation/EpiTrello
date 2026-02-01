import styles from './BoardCard.module.css';
import { LABELS } from '@/constants/labels';

export type CardModel = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  list_id: string;
  creator_id: string;
  created_at: string;
  labelIds?: string[]; // TODO: add to backend
};

export default function BoardCard({ card, onOpen }: { card: CardModel; onOpen: () => void }) {
  const onIds = new Set(card.labelIds ?? []);
  const activeLabels = LABELS.filter((l) => onIds.has(l.id));

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
    </button>
  );
}
