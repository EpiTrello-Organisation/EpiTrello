import { useCallback, useMemo, useRef, useState } from 'react';
import { useClickOutside } from './useClickOutside';

export function useAddCardComposer({
  listId,
  onAddCard,
}: {
  listId: string;
  onAddCard: (listId: string, title: string) => void | Promise<void>;
}) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const listRef = useRef<HTMLElement | null>(null);

  const cancelAddCard = useCallback(() => {
    setIsAddingCard(false);
    setNewCardTitle('');
  }, []);

  useClickOutside({
    enabled: isAddingCard,
    refs: useMemo(() => [listRef], []),
    onOutside: cancelAddCard,
    capture: true,
  });

  const openAddCard = useCallback(() => {
    setIsAddingCard(true);
  }, []);

  const submitAddCard = useCallback(async () => {
    const title = newCardTitle.trim();
    if (!title) return;

    await onAddCard(listId, title);

    setNewCardTitle('');
    setIsAddingCard(false);
  }, [newCardTitle, onAddCard, listId]);

  return {
    listRef,
    isAddingCard,
    newCardTitle,
    setNewCardTitle,
    openAddCard,
    cancelAddCard,
    submitAddCard,
  };
}
