import { useEffect, useState } from 'react';
import { apiFetch } from '@/api/fetcher';
import type { CardModel } from '@/components/BoardCard/BoardCard';
import type { ListModel } from '@/components/BoardList/BoardList';

export function useLists(boardId?: string) {
  const [lists, setLists] = useState<ListModel[]>([]);
  const [cardsByListId, setCardsByListId] = useState<Record<string, CardModel[]>>({});
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!boardId) return;

      setLoadingLists(true);
      setLoadingCards(true);

      try {
        const resLists = await apiFetch(`/api/lists/board/${encodeURIComponent(boardId)}`);
        const listsData = (await resLists.json()) as ListModel[];
        const safeLists = Array.isArray(listsData) ? listsData : [];

        if (cancelled) return;
        setLists(safeLists);

        const entries = await Promise.all(
          safeLists.map(async (l) => {
            const resCards = await apiFetch(`/api/cards/?list_id=${encodeURIComponent(l.id)}`);
            const cards = (await resCards.json()) as CardModel[];
            return [l.id, Array.isArray(cards) ? cards : []] as const;
          }),
        );

        if (!cancelled) setCardsByListId(Object.fromEntries(entries));
      } catch {
        if (!cancelled) {
          setLists([]);
          setCardsByListId({});
        }
      } finally {
        if (!cancelled) {
          setLoadingLists(false);
          setLoadingCards(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  async function addList(titleRaw: string) {
    const title = titleRaw.trim();
    if (!title || !boardId) return;

    try {
      const res = await apiFetch(`/api/lists/?board_id=${encodeURIComponent(boardId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      const created = (await res.json()) as ListModel;
      setLists((prev) => [...prev, created]);
    } catch {
      //
    }
  }

  async function renameList(listId: string, nextTitle: string) {
    const prevTitle = lists.find((l) => l.id === listId)?.title ?? '';
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, title: nextTitle } : l)));

    try {
      await apiFetch(`/api/lists/${encodeURIComponent(listId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nextTitle }),
      });
    } catch {
      setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, title: prevTitle } : l)));
    }
  }

  async function deleteList(listId: string) {
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setCardsByListId((prev) => {
      const next = { ...prev };
      delete next[listId];
      return next;
    });

    try {
      await apiFetch(`/api/lists/${encodeURIComponent(listId)}`, { method: 'DELETE' });
    } catch {
      //
    }
  }

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

  async function persistListPositions(nextLists: ListModel[]) {
    await Promise.all(
      nextLists.map((l, index) =>
        apiFetch(`/api/lists/${encodeURIComponent(l.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: index }),
        }),
      ),
    );
  }

  async function reorderLists(nextLists: ListModel[]) {
    setLists(nextLists);
    try {
      await persistListPositions(nextLists);
    } catch {
      //
    }
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

  return {
    lists,
    cardsByListId,
    loadingLists,
    loadingCards,
    addList,
    renameList,
    deleteList,
    addCard,
    renameCard,
    deleteCard,
    reorderLists,
    reorderCards,
  };
}
