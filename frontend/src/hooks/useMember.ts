import { useCallback, useState } from 'react';
import { apiFetch } from '@/api/fetcher';

export type BoardMemberApi = {
  user_id: string;
  email: string;
  username: string;
  role: 'owner' | 'member';
};

export type CardMemberApi = {
  user_id: string;
  email: string;
  username: string;
};

export type ActionResult = {
  status: number;
  detail: string;
};

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

async function readDetail(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: unknown };
    if (typeof data?.detail === 'string') return data.detail;
  } catch {
    // intentionnal
  }

  try {
    const t = await res.text();
    return t || 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export function useMember(boardId?: string, cardId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // -----------------------
  // Board members
  // -----------------------
  const getBoardMembers = useCallback(async (): Promise<BoardMemberApi[]> => {
    if (!boardId) throw new Error('boardId is required to fetch board members');

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/boards/${encodeURIComponent(boardId)}/members/`);
      if (!res.ok) {
        const detail = await readDetail(res);
        throw new ApiError(res.status, detail);
      }

      const data = (await res.json()) as unknown;
      return Array.isArray(data) ? (data as BoardMemberApi[]) : [];
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const addBoardMember = useCallback(
    async (email: string): Promise<ActionResult> => {
      if (!boardId) throw new Error('boardId is required to add a board member');

      setLoading(true);
      setError(null);

      try {
        const res = await apiFetch(`/api/boards/${encodeURIComponent(boardId)}/members/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const detail = await readDetail(res);
        if (!res.ok) throw new ApiError(res.status, detail);

        return { status: res.status, detail };
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId],
  );

  const deleteBoardMember = useCallback(
    async (email: string): Promise<void> => {
      if (!boardId) throw new Error('boardId is required to delete a board member');

      setLoading(true);
      setError(null);

      try {
        const res = await apiFetch(`/api/boards/${encodeURIComponent(boardId)}/members/`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        if (res.status === 204) return;

        const detail = await readDetail(res);
        throw new ApiError(res.status, detail);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId],
  );

  const getCardMembers = useCallback(async (): Promise<CardMemberApi[]> => {
    if (!cardId) throw new Error('cardId is required to fetch card members');

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/cards/${encodeURIComponent(cardId)}/members/`);
      if (!res.ok) {
        const detail = await readDetail(res);
        throw new ApiError(res.status, detail);
      }

      const data = (await res.json()) as unknown;
      return Array.isArray(data) ? (data as CardMemberApi[]) : [];
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  const addCardMember = useCallback(
    async (email: string): Promise<ActionResult> => {
      if (!cardId) throw new Error('cardId is required to add a card member');

      setLoading(true);
      setError(null);

      try {
        const res = await apiFetch(`/api/cards/${encodeURIComponent(cardId)}/members/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const detail = await readDetail(res);
        if (!res.ok) throw new ApiError(res.status, detail);

        return { status: res.status, detail };
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cardId],
  );

  const deleteCardMember = useCallback(
    async (email: string): Promise<void> => {
      if (!cardId) throw new Error('cardId is required to delete a card member');

      setLoading(true);
      setError(null);

      try {
        const res = await apiFetch(`/api/cards/${encodeURIComponent(cardId)}/members/`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        if (res.status === 204) return;

        const detail = await readDetail(res);
        throw new ApiError(res.status, detail);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cardId],
  );

  return {
    loading,
    error,
    actions: {
      getMembers: async () => {
        if (!boardId) throw new Error('boardId is required to fetch members');
        return getBoardMembers();
      },
      addMember: async (email: string) => {
        if (!boardId) throw new Error('boardId is required to add a member');
        return addBoardMember(email);
      },
      deleteMember: async (email: string) => {
        if (!boardId) throw new Error('boardId is required to delete a member');
        return deleteBoardMember(email);
      },
      getBoardMembers,
      addBoardMember,
      deleteBoardMember,
      getCardMembers,
      addCardMember,
      deleteCardMember,
    },
  };
}
