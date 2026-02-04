import { useEffect, useState } from 'react';
import { apiFetch } from '@/api/fetcher';
import type { ListModel } from '@/components/BoardList/BoardList';

export function useList(boardId?: string) {
  const [lists, setLists] = useState<ListModel[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!boardId) return;

      setLoadingLists(true);

      try {
        const resLists = await apiFetch(`/api/lists/board/${encodeURIComponent(boardId)}`);
        const listsData = (await resLists.json()) as ListModel[];
        const safeLists = Array.isArray(listsData) ? listsData : [];

        if (!cancelled) setLists(safeLists);
      } catch {
        if (!cancelled) setLists([]);
      } finally {
        if (!cancelled) setLoadingLists(false);
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
    const prevTitle = lists.find((list) => list.id === listId)?.title ?? '';
    setLists((prev) =>
      prev.map((list) => (list.id === listId ? { ...list, title: nextTitle } : list)),
    );

    try {
      await apiFetch(`/api/lists/${encodeURIComponent(listId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nextTitle }),
      });
    } catch {
      setLists((prev) =>
        prev.map((list) => (list.id === listId ? { ...list, title: prevTitle } : list)),
      );
    }
  }

  async function deleteList(listId: string) {
    setLists((prev) => prev.filter((list) => list.id !== listId));

    try {
      await apiFetch(`/api/lists/${encodeURIComponent(listId)}`, { method: 'DELETE' });
    } catch {
      //
    }
  }

  async function persistListPositions(nextLists: ListModel[]) {
    await Promise.all(
      nextLists.map((list, index) =>
        apiFetch(`/api/lists/${encodeURIComponent(list.id)}`, {
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

  return {
    lists,
    loadingLists,
    addList,
    renameList,
    deleteList,
    reorderLists,
  };
}
