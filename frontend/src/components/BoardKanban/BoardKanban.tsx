import React from 'react';
import { DndContext, closestCenter, type DragEndEvent, type SensorDescriptor } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

import type { CardModel } from '@/components/BoardCard/BoardCard';
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
}) {
  return (
    <main aria-busy={loading}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
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
      </DndContext>
    </main>
  );
}

function AddListComposerBridge({ onAddList }: { onAddList: (title: string) => void | Promise<void> }) {
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
