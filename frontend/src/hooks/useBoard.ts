import { useEffect, useState } from 'react';
import { apiFetch } from '@/api/fetcher';

export type BoardModel = {
  id: string;
  title: string;
};

export function useBoard(boardId?: string) {
  const [board, setBoard] = useState<BoardModel | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!boardId) return;

      try {
        const res = await apiFetch(`/api/boards/${encodeURIComponent(boardId)}`);
        const data = (await res.json()) as BoardModel;
        if (!cancelled) setBoard(data);
      } catch {
        if (!cancelled) setBoard(null);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  async function renameBoard(nextTitle: string) {
    const title = nextTitle.trim();
    if (!title || !boardId) return;

    const prevTitle = board?.title ?? 'Board';
    setBoard((prev) => (prev ? { ...prev, title } : { id: boardId, title }));

    try {
      await apiFetch(`/api/boards/${encodeURIComponent(boardId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
    } catch {
      setBoard((prev) => (prev ? { ...prev, title: prevTitle } : prev));
    }
  }

  async function deleteBoard() {
    if (!boardId) return false;

    try {
      await apiFetch(`/api/boards/${encodeURIComponent(boardId)}`, { method: 'DELETE' });
      return true;
    } catch {
      return false;
    }
  }

  return { board, renameBoard, deleteBoard };
}
