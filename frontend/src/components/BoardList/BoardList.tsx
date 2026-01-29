import { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import styles from './BoardList.module.css';
import EditableText from '../EditableText/EditableText';
import BoardCard, { type CardModel } from '../BoardCard/BoardCard';
import AddCardComposer from '../AddCardComposer/AddCardComposer';

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

function IconX() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconX}>
      <path
        d="M7 7l10 10M17 7L7 17"
        fill="none"
        stroke="#fff"
        strokeWidth="1.4"
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
  onDelete,
  onAddCard,
}: {
  list: ListModel;
  cards: CardModel[];
  onRename: (listId: string, nextTitle: string) => void;
  onOpenCard: (card: CardModel) => void;
  onDelete: (listId: string) => void;
  onAddCard: (listId: string, title: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const wrapperEl = menuWrapperRef.current;
      const clickedInWrapper = !!wrapperEl && wrapperEl.contains(target);
      if (!clickedInWrapper) setMenuOpen(false);
    }

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const listRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!isAddingCard) return;

    const opts: AddEventListenerOptions = { capture: true };

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const el = listRef.current;
      if (el && !el.contains(target)) cancelAddCard();
    }

    window.addEventListener('pointerdown', onPointerDown, opts);
    return () => window.removeEventListener('pointerdown', onPointerDown, opts);
  }, [isAddingCard]);

  function openAddCard() {
    setIsAddingCard(true);
  }

  function cancelAddCard() {
    setIsAddingCard(false);
    setNewCardTitle('');
  }

  async function submitAddCard() {
    const title = newCardTitle.trim();
    if (!title) return;

    await onAddCard(list.id, title);

    setNewCardTitle('');
    setIsAddingCard(false);
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(
      transform && isDragging ? { ...transform, scaleX: 1, scaleY: 1 } : transform,
    ),
    transition,
    opacity: isDragging ? 0.85 : undefined,
  };

  return (
    <section ref={setNodeRef} style={style} className={styles.list} {...attributes} {...listeners}>
      <div className={styles.listRow1}>
        <EditableText
          value={list.title}
          ariaLabel="Edit list title"
          className={styles.listTitleButton}
          inputClassName={styles.listTitleInput}
          onChange={(v) => onRename(list.id, v)}
        />

        <div className={styles.listMenuWrapper} ref={menuWrapperRef}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="List menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <IconDots />
          </button>

          {menuOpen && (
            <div className={styles.listMenu}>
              <button
                type="button"
                className={styles.listMenuItemDanger}
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(list.id);
                }}
              >
                Delete List
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.cards}>
        {cards
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((c) => (
            <BoardCard key={c.id} card={c} onOpen={() => onOpenCard(c)} />
          ))}

        {isAddingCard ? (
          <AddCardComposer
            open
            value={newCardTitle}
            onOpen={() => {}}
            onChange={setNewCardTitle}
            onCancel={cancelAddCard}
            onSubmit={submitAddCard}
            showActions={false}
          />
        ) : null}
      </div>

      <div className={styles.listRow2}>
        {isAddingCard ? (
          <div className={styles.addCardActionsRow}>
            <button type="button" className={styles.addCardPrimary} onClick={submitAddCard}>
              Add card
            </button>

            <button
              type="button"
              className={styles.addCardCancel}
              onClick={cancelAddCard}
              aria-label="Cancel"
            >
              <IconX />
            </button>
          </div>
        ) : (
          <button type="button" className={styles.addCardBtn} onClick={openAddCard}>
            + <span>Add a card</span>
          </button>
        )}

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
