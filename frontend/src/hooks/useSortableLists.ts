import { useSensor, useSensors, PointerSensor, KeyboardSensor, type DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { ListModel } from '@/components/BoardList/BoardList';

export function useSortableLists({
  lists,
  onReorder,
}: {
  lists: ListModel[];
  onReorder: (next: ListModel[]) => void | Promise<void>;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const oldIndex = lists.findIndex((l) => l.id === String(active.id));
    const newIndex = lists.findIndex((l) => l.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(lists, oldIndex, newIndex);
    onReorder(next);
  }

  return { sensors, onDragEnd };
}
