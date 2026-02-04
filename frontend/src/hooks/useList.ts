import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/api/fetcher';
import type { ListModel } from '@/components/BoardList/BoardList';

type ListPut = { title?: string; position?: number };

export function useList(boardId?: string) {
  const [lists, setLists] = useState<ListModel[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const hasBoard = useMemo(() => Boolean(boardId), [boardId]);

  async function getListsByBoard(id: string): Promise<ListModel[]> {
    const res = await apiFetch(`/api/lists/board/${encodeURIComponent(id)}`);
    const data = (await res.json()) as ListModel[];
    return Array.isArray(data) ? data : [];
  }

  async function createList(id: string, payload: ListPost): Promise<ListModel> {
    const res = await apiFetch(`/api/lists/?board_id=${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return (await res.json()) as ListModel;
  }

  async function updateList(listId: string, payload: ListPut): Promise<void> {
    await apiFetch(`/api/lists/${encodeURIComponent(listId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async function removeList(listId: string): Promise<void> {
    await apiFetch(`/api/lists/${encodeURIComponent(listId)}`, { method: 'DELETE' });
  }

  const api = { getListsByBoard, createList, updateList, removeList };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!boardId) return;

      setLoadingLists(true);
      try {
        const data = await api.getListsByBoard(boardId);
        if (!cancelled) setLists(data);
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
      const created = await api.createList(boardId, { title });
      setLists((prev) => [...prev, created]);
    } catch {}
  }

  async function renameList(listId: string, nextTitle: string) {
    const title = nextTitle;
    const prevTitle = lists.find((l) => l.id === listId)?.title ?? '';

    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, title } : l)));

    try {
      await api.updateList(listId, { title });
    } catch {
      setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, title: prevTitle } : l)));
    }
  }

  async function deleteList(listId: string) {
    const prevSnapshot = lists;

    setLists((prev) => prev.filter((l) => l.id !== listId));

    try {
      await api.removeList(listId);
    } catch {
      setLists(prevSnapshot);
    }
  }

  async function persistListPositions(nextLists: ListModel[]) {
    await Promise.all(nextLists.map((list, index) => api.updateList(list.id, { position: index })));
  }

  async function reorderLists(nextLists: ListModel[]) {
    const prevSnapshot = lists;

    setLists(nextLists);
    try {
      await persistListPositions(nextLists);
    } catch {
      setLists(prevSnapshot);
    }
  }

  const actions = { addList, renameList, deleteList };
  const dnd = { reorderLists };

  return {
    lists,
    loadingLists,
    api,
    actions,
    dnd,
    hasBoard,
  };
}
