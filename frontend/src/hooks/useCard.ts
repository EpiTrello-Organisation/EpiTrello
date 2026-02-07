import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/api/fetcher';

import type { CardModel } from '@/components/BoardCard/BoardCard';
import type { ListModel } from '@/components/BoardList/BoardList';

type CardPut = Partial<
  Pick<CardModel, 'title' | 'description' | 'position' | 'list_id' | 'label_ids'>
>;

export function useCard(boardId?: string, lists?: ListModel[]) {
  const [cardsByListId, setCardsByListId] = useState<Record<string, CardModel[]>>({});
  const [loadingCards, setLoadingCards] = useState(false);

  const listsRef = useRef<ListModel[] | undefined>(lists);

  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  const listIdsKey = useMemo(
    () => (Array.isArray(lists) ? lists.map((l) => l.id).join('|') : ''),
    [lists],
  );

  async function getCards(listId: string): Promise<CardModel[]> {
    const res = await apiFetch(`/api/cards/?list_id=${encodeURIComponent(listId)}`);
    const cards = (await res.json()) as CardModel[];
    return Array.isArray(cards) ? cards : [];
  }

  async function createCard(listId: string, payload: { title: string }): Promise<CardModel> {
    const res = await apiFetch(`/api/cards/?list_id=${encodeURIComponent(listId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return (await res.json()) as CardModel;
  }

  async function updateCard(cardId: string, payload: CardPut): Promise<void> {
    const res = await apiFetch(`/api/cards/${encodeURIComponent(cardId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`PUT card failed (${res.status}): ${text}`);
    }
  }

  async function removeCard(cardId: string): Promise<void> {
    await apiFetch(`/api/cards/${encodeURIComponent(cardId)}`, { method: 'DELETE' });
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!boardId) {
        if (!cancelled) setLoadingCards(false);
        return;
      }

      const safeLists: ListModel[] = Array.isArray(listsRef.current) ? listsRef.current : [];

      setLoadingCards(true);

      try {
        const entries = await Promise.all(
          safeLists.map(async (list) => [list.id, await getCards(list.id)] as const),
        );

        if (!cancelled) {
          setCardsByListId(Object.fromEntries(entries));
        }
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
  }, [boardId, listIdsKey]);

  async function addCard(listId: string, titleRaw: string) {
    const title = titleRaw.trim();
    if (!title) return;

    try {
      const created = await createCard(listId, { title });
      setCardsByListId((prev) => ({
        ...prev,
        [listId]: [...(prev[listId] ?? []), created],
      }));
    } catch {
      // intentional
    }
  }

  async function renameCard(cardId: string, listId: string, nextTitle: string) {
    const title = nextTitle.trim();
    if (!title) return;

    const card = (cardsByListId[listId] ?? []).find((c) => c.id === cardId);
    if (!card) return;

    const prevTitle = card.title;

    setCardsByListId((prev) => ({
      ...prev,
      [listId]: (prev[listId] ?? []).map((c) => (c.id === cardId ? { ...c, title } : c)),
    }));

    try {
      await updateCard(cardId, {
        title,
        description: card.description,
        position: card.position,
        list_id: card.list_id,
      });
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
    const prevList = cardsByListId[listId] ?? [];

    setCardsByListId((prev) => ({
      ...prev,
      [listId]: prevList.filter((c) => c.id !== cardId),
    }));

    try {
      await removeCard(cardId);
    } catch {
      setCardsByListId((prev) => ({
        ...prev,
        [listId]: prevList,
      }));
    }
  }

  function setCardLabelsLocal(cardId: string, listId: string, nextLabelIds: number[]) {
    setCardsByListId((prev) => ({
      ...prev,
      [listId]: (prev[listId] ?? []).map((c) =>
        c.id === cardId ? { ...c, label_ids: nextLabelIds } : c,
      ),
    }));
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

  async function persistCardPositions(cards: CardModel[]) {
    await Promise.all(
      cards.map((c) =>
        updateCard(c.id, {
          title: c.title,
          description: c.description,
          position: c.position,
          list_id: c.list_id,
        }),
      ),
    );
  }

  async function updateCardLabels(cardId: string, listId: string, nextLabelIds: number[]) {
    const prev = cardsByListId[listId]?.find((c) => c.id === cardId)?.label_ids ?? [];

    setCardLabelsLocal(cardId, listId, nextLabelIds);

    try {
      await updateCard(cardId, { label_ids: nextLabelIds });
    } catch {
      setCardLabelsLocal(cardId, listId, prev);
    }
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
    api: { getCards, createCard, updateCard, removeCard },
    actions: { addCard, renameCard, deleteCard, setCardLabelsLocal, updateCardLabels },
    dnd: { moveCardBetweenListsPreview, commitCardsMove, reorderCards },
  };
}
