import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/api/fetcher';
import type { CardModel } from '@/components/BoardCard/BoardCard';
import type { ListModel } from '@/components/BoardList/BoardList';

export function useCard(boardId?: string, lists?: ListModel[]) {
  const [cardsByListId, setCardsByListId] = useState<Record<string, CardModel[]>>({});
  const [loadingCards, setLoadingCards] = useState(false);

  const listIdsKey = useMemo(() => {
    const ids = (lists ?? []).map((l) => l.id);
    return ids.join('|');
  }, [lists]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!boardId) return;

      const safeLists = Array.isArray(lists) ? lists : [];
      setLoadingCards(true);

      try {
        const entries = await Promise.all(
          safeLists.map(async (list) => {
            const resCards = await apiFetch(`/api/cards/?list_id=${encodeURIComponent(list.id)}`);
            const cards = (await resCards.json()) as CardModel[];
            return [list.id, Array.isArray(cards) ? cards : []] as const;
          }),
        );

        if (!cancelled) setCardsByListId(Object.fromEntries(entries));
      } catch {
        if (!cancelled) setCardsByListId({});
      } finally {
        if (!cancelled) setLoadingCards(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // on dépend du contenu (ids) des listes pour re-fetch quand une liste apparaît/disparaît
  }, [boardId, listIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addCard(listId: string, titleRaw: string) {
    const title = titleRaw.trim();
    if (!title) return;

    try {
      const res = await apiFetch(`/api/cards/?list_id=${encodeURIComponent(listId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      const created = (await res.json()) as CardModel;

      setCardsByListId((prev) => ({
        ...prev,
        [listId]: [...(prev[listId] ?? []), created],
      }));
    } catch {
      //
    }
  }

  async function renameCard(cardId: string, listId: string, nextTitle: string) {
    const title = nextTitle.trim();
    if (!title) return;

    const card = cardsByListId[listId]?.find((c) => c.id === cardId);
    if (!card) return;

    const prevTitle = card.title;
    const position = card.position;

    setCardsByListId((prev) => ({
      ...prev,
      [listId]: (prev[listId] ?? []).map((c) => (c.id === cardId ? { ...c, title } : c)),
    }));

    try {
      const res = await apiFetch(`/api/cards/${encodeURIComponent(cardId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          position,
          list_id: card.list_id,
          description: card.description,
        }),
      });

      if (!res.ok) throw new Error('Rename card failed');
    } catch {
      setCardsByListId((prev) => ({
        ...prev,
        [listId]: (prev[listId] ?? []).map((c) =>
          c.id === cardId ? { ...c, title: prevTitle } : c,
        ),
      }));
    }
  }

  async function deleteCard(cardId: string, listId: string) {
    setCardsByListId((prev) => ({
      ...prev,
      [listId]: (prev[listId] ?? []).filter((c) => c.id !== cardId),
    }));

    try {
      await apiFetch(`/api/cards/${encodeURIComponent(cardId)}`, { method: 'DELETE' });
    } catch {
      //
    }
  }

  function moveCardBetweenListsPreview(
    fromListId: string,
    toListId: string,
    cardId: string,
    toIndex: number,
  ) {
    setCardsByListId((prev) => {
      const from = prev[fromListId] ?? [];
      const to = prev[toListId] ?? [];

      const moving = from.find((c) => c.id === cardId);
      if (!moving) return prev;

      const nextFrom = from.filter((c) => c.id !== cardId);
      const movingUpdated = { ...moving, list_id: toListId };

      const safeIndex = Math.max(0, Math.min(toIndex, to.length));
      const nextTo = [...to.slice(0, safeIndex), movingUpdated, ...to.slice(safeIndex)];

      return {
        ...prev,
        [fromListId]: nextFrom,
        [toListId]: nextTo,
      };
    });
  }

  async function persistCardPositions(nextCards: CardModel[]) {
    await Promise.all(
      nextCards.map(async (c) => {
        const res = await apiFetch(`/api/cards/${encodeURIComponent(c.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: c.title,
            description: c.description,
            position: c.position,
            list_id: c.list_id,
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`PUT card failed (${res.status}): ${text}`);
        }
      }),
    );
  }

  async function reorderCards(listId: string, nextCards: CardModel[]) {
    setCardsByListId((prev) => ({
      ...prev,
      [listId]: nextCards,
    }));

    await persistCardPositions(nextCards);
  }

  async function commitCardsMove(
    fromListId: string,
    toListId: string,
    nextFrom: CardModel[],
    nextTo: CardModel[],
  ) {
    const prevSnapshot = cardsByListId;

    setCardsByListId((prev) => ({
      ...prev,
      [fromListId]: nextFrom,
      [toListId]: nextTo,
    }));

    try {
      await persistCardPositions(nextTo);
      if (fromListId !== toListId) {
        await persistCardPositions(nextFrom);
      }
    } catch {
      setCardsByListId(prevSnapshot);
    }
  }

  return {
    cardsByListId,
    loadingCards,
    addCard,
    renameCard,
    deleteCard,
    reorderCards,
    moveCardBetweenListsPreview,
    commitCardsMove,
  };
}
