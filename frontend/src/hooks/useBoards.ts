import { useEffect, useState } from 'react';
import { apiFetch } from '@/api/fetcher';

export type BoardModel = {
  id: string;
  title: string;
  backgroundUrl?: string | null;
  background_url?: string | null;
};

export function getBoardBackgroundUrl(board: BoardModel): string | null {
  return board.backgroundUrl ?? board.background_url ?? null;
}

export function useBoards() {
  const [boards, setBoards] = useState<BoardModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await apiFetch('/api/boards');
        const data = (await res.json()) as BoardModel[];
        if (!cancelled) setBoards(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setBoards([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createBoard(payload: { title: string }) {
    const res = await apiFetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const created = (await res.json()) as BoardModel;
    setBoards((prev) => [...prev, created]);

    return created;
  }

  return { boards, loading, createBoard };
}
