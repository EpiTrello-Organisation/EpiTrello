import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function useSortableStyle(id: string) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(
      transform && isDragging ? { ...transform, scaleX: 1, scaleY: 1 } : transform,
    ),
    transition,
    opacity: isDragging ? 0.85 : undefined,
  };

  return { attributes, listeners, setNodeRef, style };
}
