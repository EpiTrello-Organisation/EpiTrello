import { useEffect, useState } from 'react';
import { apiFetch } from '@/api/fetcher';

export type BoardBackgroundKind = 'gradient' | 'unsplash';

export type BoardModel = {
  id: string;
  title: string;

  background_kind?: BoardBackgroundKind | null;
  background_value?: string | null;
  background_thumb_url?: string | null;

  backgroundUrl?: string | null;
  background_url?: string | null;
};

export function getBoardBackgroundUrl(board: BoardModel): string | null {
  const legacy = board.backgroundUrl ?? board.background_url ?? null;
  if (legacy) return legacy;

  if (board.background_kind === 'unsplash') {
    return board.background_thumb_url ?? null;
  }

  return null;
}

export function getBoardBackgroundStyle(board: BoardModel): React.CSSProperties | undefined {
  const legacy = board.backgroundUrl ?? board.background_url ?? null;
  if (legacy) return { backgroundImage: `url(${legacy})` };

  if (board.background_kind === 'unsplash') {
    if (!board.background_thumb_url) return undefined;
    return { backgroundImage: `url(${board.background_thumb_url})` };
  }

  if (board.background_kind === 'gradient') {
    const v = board.background_value ?? '';
    const css = gradientCssForKey(v);
    if (!css) return undefined;
    return { backgroundImage: css };
  }

  return undefined;
}

function gradientCssForKey(key: string): string | null {
  switch (key) {
    case 'g-1':
      return 'linear-gradient(135deg, #e6f0ff, #cfe2ff)';
    case 'g-2':
      return 'linear-gradient(135deg, #1fb6ff, #2dd4bf)';
    case 'g-3':
      return 'linear-gradient(135deg, #0ea5e9, #2563eb)';
    case 'g-4':
      return 'linear-gradient(135deg, #334155, #0f172a)';
    case 'g-5':
      return 'linear-gradient(135deg, #6d28d9, #ec4899)';
    case 'g-6':
      return 'linear-gradient(135deg, #7b5cff, #f17ac6)';
    default:
      return null;
  }
}

export type CreateBoardPayload = {
  title: string;
  background_kind: BoardBackgroundKind;
  background_value: string;
  background_thumb_url?: string | null;
};

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

  async function createBoard(payload: CreateBoardPayload) {
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
