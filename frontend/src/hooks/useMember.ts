import { useCallback, useState } from 'react';
import { apiFetch } from '@/api/fetcher';

export type BoardMemberApi = {
  user_id: string;
  email: string;
  username: string;
  role: 'owner' | 'member';
};

export type AddMemberResult = {
  status: number;
  detail: string;
};

class ApiError extends Error {
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
    // ignore
  }

  try {
    const t = await res.text();
    return t || 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export function useMember(boardId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const getMembers = useCallback(async (): Promise<BoardMemberApi[]> => {
    if (!boardId) throw new Error('boardId is required to fetch members');

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

  const addMember = useCallback(
    async (email: string): Promise<AddMemberResult> => {
      if (!boardId) throw new Error('boardId is required to add a member');

      setLoading(true);
      setError(null);

      try {
        const res = await apiFetch(`/api/boards/${encodeURIComponent(boardId)}/members/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const detail = await readDetail(res);

        if (!res.ok) {
          throw new ApiError(res.status, detail);
        }

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

  return {
    loading,
    error,
    actions: {
      getMembers,
      addMember,
    },
  };
}
