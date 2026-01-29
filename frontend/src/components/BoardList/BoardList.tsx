import { useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import styles from './BoardList.module.css';

import EditableText from '../EditableText/EditableText';
import BoardCard, { type CardModel } from '../BoardCard/BoardCard';
import AddCardComposer from '../AddCardComposer/AddCardComposer';

import { useAddCardComposer } from '@/hooks/useAddCardComposer';
import { useListMenu } from '@/hooks/useListMenu';
import { useSortableStyle } from '@/hooks/useSortableStyle';

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

function SortableCardItem({ card, onOpen }: { card: CardModel; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(
      transform && isDragging ? { ...transform, scaleX: 1, scaleY: 1 } : transform,
    ),
    transition,
    opacity: isDragging ? 0.9 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BoardCard card={card} onOpen={onOpen} />
    </div>
  );
}

export default function BoardList({
  list,
  cards,
  onRename,
  onOpenCard,
  onDelete,
  onAddCard,
  onReorderCards,
}: {
  list: ListModel;
  cards: CardModel[];
  onRename: (listId: string, nextTitle: string) => void | Promise<void>;
  onOpenCard: (card: CardModel) => void;
  onDelete: (listId: string) => void | Promise<void>;
  onAddCard: (listId: string, title: string) => void | Promise<void>;
  onReorderCards: (
    listId: string,
    nextCards: CardModel[],
    changedCards: CardModel[],
  ) => void | Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, style } = useSortableStyle(
    list.id,
  );

  const { menuOpen, setMenuOpen, menuWrapperRef } = useListMenu();

  const {
    listRef,
    isAddingCard,
    newCardTitle,
    setNewCardTitle,
    openAddCard,
    cancelAddCard,
    submitAddCard,
  } = useAddCardComposer({ listId: list.id, onAddCard });

  const cardSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const orderedCards = useMemo(
    () => cards.slice().sort((a, b) => a.position - b.position),
    [cards],
  );

  function onDragEndCards(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedCards.findIndex((c) => c.id === String(active.id));
    const newIndex = orderedCards.findIndex((c) => c.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const moved = arrayMove(orderedCards, oldIndex, newIndex);

    const next = moved.map((c, i) => ({
      ...c,
      position: i,
    }));

    const start = Math.min(oldIndex, newIndex);
    const end = Math.max(oldIndex, newIndex);
    const changed = next.slice(start, end + 1);

    onReorderCards(list.id, next, changed);
  }

  return (
    <section
      ref={(el) => {
        setNodeRef(el);
        listRef.current = el;
      }}
      style={style}
      className={styles.list}
    >
      <div className={styles.listRow1} ref={setActivatorNodeRef} {...attributes} {...listeners}>
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

          {menuOpen ? (
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
          ) : null}
        </div>
      </div>

      <div className={styles.cards}>
        <DndContext
          sensors={cardSensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEndCards}
        >
          <SortableContext
            items={orderedCards.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {orderedCards.map((c) => (
              <SortableCardItem key={c.id} card={c} onOpen={() => onOpenCard(c)} />
            ))}
          </SortableContext>
        </DndContext>

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
