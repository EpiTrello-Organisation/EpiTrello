import React from 'react';
import {
  DndContext,
  closestCorners,
  DragOverlay,
  MeasuringStrategy,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type SensorDescriptor,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

import BoardCard, { type CardModel } from '@/components/BoardCard/BoardCard';
import BoardList, { type ListModel } from '@/components/BoardList/BoardList';
import AddListComposer from '@/components/AddListComposer/AddListComposer';

export default function BoardKanban({
  lists,
  cardsByListId,
  loading,
  sensors,
  onDragEnd,
  onRenameList,
  onDeleteList,
  onAddCard,
  onOpenCard,
  onAddList,
  listsRowClassName,
  onMoveCardBetweenLists,
  onCommitCards,
}: {
  lists: ListModel[];
  cardsByListId: Record<string, CardModel[]>;
  loading: boolean;
  sensors: SensorDescriptor<any>[];
  onDragEnd: (e: DragEndEvent) => void;

  onRenameList: (listId: string, nextTitle: string) => void | Promise<void>;
  onDeleteList: (listId: string) => void | Promise<void>;
  onAddCard: (listId: string, title: string) => void | Promise<void>;
  onOpenCard: (card: CardModel) => void;
  onAddList: (title: string) => void | Promise<void>;
  listsRowClassName: string;

  onMoveCardBetweenLists: (
    fromListId: string,
    toListId: string,
    cardId: string,
    toIndex: number,
  ) => void;

  onCommitCards: (
    fromListId: string,
    toListId: string,
    nextFrom: CardModel[],
    nextTo: CardModel[],
  ) => void | Promise<void>;
}) {
  const lastMoveRef = React.useRef<{ from: string; to: string; overId: string } | null>(null);
  const [activeCardId, setActiveCardId] = React.useState<string | null>(null);

  const activeCard = React.useMemo(() => {
    if (!activeCardId) return null;
    for (const cards of Object.values(cardsByListId)) {
      const found = cards.find((c) => c.id === activeCardId);
      if (found) return found;
    }
    return null;
  }, [activeCardId, cardsByListId]);

  function isListDropId(id: string) {
    return id.startsWith('list:');
  }

  function listIdFromDropId(id: string) {
    return id.replace('list:', '');
  }

  function findCardContainer(map: Record<string, CardModel[]>, cardId: string) {
    for (const [listId, cards] of Object.entries(map)) {
      if (cards.some((c) => c.id === cardId)) return listId;
    }
    return null;
  }

  function handleDragStart(e: DragStartEvent) {
    const t = e.active?.data?.current?.type;
    if (t === 'card') setActiveCardId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;

    const activeType = active.data.current?.type;
    if (activeType !== 'card') return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromListId = active.data.current?.listId as string;

    let toListId: string | null = null;
    if (isListDropId(overId)) toListId = listIdFromDropId(overId);
    else toListId = findCardContainer(cardsByListId, overId);
    if (!toListId) return;

    if (toListId === fromListId) return;

    const toCards = cardsByListId[toListId] ?? [];
    const toIndex = !isListDropId(overId)
      ? toCards.findIndex((c) => c.id === overId)
      : toCards.length;

    const last = lastMoveRef.current;
    if (last && last.from === fromListId && last.to === toListId && last.overId === overId) return;

    lastMoveRef.current = { from: fromListId, to: toListId, overId };

    onMoveCardBetweenLists(fromListId, toListId, activeId, Math.max(0, toIndex));
  }

  async function handleDragEndInternal(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeType = active.data.current?.type;

    if (activeType !== 'card') {
      onDragEnd(e);
      return;
    }

    const fromListId = active.data.current?.listId as string;

    let toListId: string | null = null;
    if (isListDropId(overId)) toListId = listIdFromDropId(overId);
    else toListId = findCardContainer(cardsByListId, overId);
    if (!toListId) return;

    const fromCards = cardsByListId[fromListId] ?? [];
    const toCards = cardsByListId[toListId] ?? [];

    const toIndex = !isListDropId(overId)
      ? toCards.findIndex((c) => c.id === overId)
      : toCards.length;

    if (toListId === fromListId) {
      const oldIndex = fromCards.findIndex((c) => c.id === activeId);
      const newIndex = Math.max(0, toIndex);
      if (oldIndex < 0 || newIndex < 0) return;

      const moved = arrayMove(fromCards, oldIndex, newIndex).map((c, i) => ({ ...c, position: i }));

      await onCommitCards(fromListId, fromListId, moved, moved);
      return;
    }

    const moving = fromCards.find((c) => c.id === activeId);
    if (!moving) return;

    const nextFromRaw = fromCards.filter((c) => c.id !== activeId);
    const nextFrom = nextFromRaw.map((c, i) => ({ ...c, position: i }));

    const insertIndex = Math.max(0, toIndex);
    const movingUpdated: CardModel = { ...moving, list_id: toListId };

    const nextToRaw = [
      ...toCards.slice(0, insertIndex),
      movingUpdated,
      ...toCards.slice(insertIndex),
    ];
    const nextTo = nextToRaw.map((c, i) => ({ ...c, position: i }));

    await onCommitCards(fromListId, toListId, nextFrom, nextTo);
  }

  async function handleDragEnd(e: DragEndEvent) {
    try {
      await handleDragEndInternal(e);
    } finally {
      lastMoveRef.current = null;
      setActiveCardId(null);
    }
  }

  return (
    <main aria-busy={loading}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
          <div className={listsRowClassName}>
            {lists.map((list) => (
              <BoardList
                key={list.id}
                list={list}
                cards={cardsByListId[list.id] ?? []}
                onRename={onRenameList}
                onOpenCard={onOpenCard}
                onDelete={onDeleteList}
                onAddCard={onAddCard}
              />
            ))}

            <AddListComposerBridge onAddList={onAddList} />
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <div style={{ pointerEvents: 'none' }}>
              <BoardCard card={activeCard} onOpen={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

function AddListComposerBridge({
  onAddList,
}: {
  onAddList: (title: string) => void | Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  return (
    <AddListComposer
      open={open}
      value={value}
      onOpen={() => setOpen(true)}
      onChange={setValue}
      onCancel={() => {
        setOpen(false);
        setValue('');
      }}
      onSubmit={async () => {
        const title = value.trim();
        if (!title) return;
        await onAddList(title);
        setValue('');
        setOpen(false);
      }}
    />
  );
}
