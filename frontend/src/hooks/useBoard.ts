import { useEffect, useState } from 'react';
import { apiFetch } from '@/api/fetcher';

export type BoardModel = {
  id: string;
  title: string;
};

export function useBoard(boardId?: string) {
  const [board, setBoard] = useState<BoardModel | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(false);

  async function getBoard(id: string): Promise<BoardModel> {
    const res = await apiFetch(`/api/boards/${encodeURIComponent(id)}`);
    return (await res.json()) as BoardModel;
  }

  async function updateBoard(id: string, payload: Pick<BoardModel, 'title'>): Promise<void> {
    await apiFetch(`/api/boards/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async function removeBoard(id: string): Promise<void> {
    await apiFetch(`/api/boards/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!boardId) return;

      setLoadingBoard(true);
      try {
        const data = await getBoard(boardId);
        if (!cancelled) setBoard(data);
      } catch {
        if (!cancelled) setBoard(null);
      } finally {
        if (!cancelled) setLoadingBoard(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  const api = { getBoard, updateBoard, removeBoard };

  async function renameBoard(nextTitle: string) {
    const title = nextTitle.trim();
    if (!title || !boardId) return;

    const prevTitle = board?.title ?? 'Board';

    setBoard((prev) => (prev ? { ...prev, title } : { id: boardId, title }));

    try {
      await api.updateBoard(boardId, { title });
    } catch {
      setBoard((prev) => (prev ? { ...prev, title: prevTitle } : prev));
    }
  }

  async function deleteBoard(): Promise<boolean> {
    if (!boardId) return false;

    try {
      await api.removeBoard(boardId);
      return true;
    } catch {
      return false;
    }
  }

  const actions = { renameBoard, deleteBoard };

  return {
    board,
    loadingBoard,
    api,
    actions,
  };
}
