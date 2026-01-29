import styles from './BoardCard.module.css';

export type CardModel = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  list_id: string;
  creator_id: string;
  created_at: string;
};

export default function BoardCard({ card, onOpen }: { card: CardModel; onOpen: () => void }) {
  return (
    <button
      type="button"
      className={styles.card}
      aria-label={`Open card ${card.title}`}
      onClick={onOpen}
    >
      <div className={styles.title}>{card.title}</div>
    </button>
  );
}
