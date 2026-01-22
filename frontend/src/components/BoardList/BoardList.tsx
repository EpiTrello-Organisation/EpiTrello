import styles from './BoardList.module.css';
import EditableText from '../EditableText/EditableText';
import BoardCard, { type CardModel } from '../BoardCard/BoardCard';

export type ListModel = {
  id: string;
  title: string;
};

function IconDots() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <circle cx="6" cy="12" r="1.7" fill="#fff" />
      <circle cx="12" cy="12" r="1.7" fill="#fff" />
      <circle cx="18" cy="12" r="1.7" fill="#fff" />
    </svg>
  );
}

function IconTemplate() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconSmall}>
      <path
        d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 8h6M9 12h6M9 16h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BoardList({
  list,
  cards,
  onRename,
  onOpenCard,
}: {
  list: ListModel;
  cards: CardModel[];
  onRename: (listId: string, nextTitle: string) => void;
  onOpenCard: (card: CardModel) => void;
}) {
  return (
    <section className={styles.list}>
      <div className={styles.listRow1}>
        <EditableText
          value={list.title}
          ariaLabel="Edit list title"
          className={styles.listTitleButton}
          inputClassName={styles.listTitleInput}
          onChange={(v) => onRename(list.id, v)}
        />

        <button type="button" className={styles.iconBtn} aria-label="List menu">
          <IconDots />
        </button>
      </div>

      <div className={styles.cards}>
        {cards
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((c) => (
            <BoardCard key={c.id} card={c} onOpen={() => onOpenCard(c)} />
          ))}
      </div>

      <div className={styles.listRow2}>
        <button type="button" className={styles.addCardBtn}>
          + <span>Add a card</span>
        </button>

        <button
          type="button"
          className={styles.templateBtn}
          aria-label="Create from template"
          title="Create from a template..."
        >
          <IconTemplate />
        </button>
      </div>
    </section>
  );
}
