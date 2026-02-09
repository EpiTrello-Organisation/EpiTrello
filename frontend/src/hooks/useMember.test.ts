import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMember } from './useMember';
import type { BoardMemberApi, CardMemberApi } from './useMember';

// --- mock apiFetch ---
const apiFetchMock = vi.fn();
vi.mock('@/api/fetcher', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

function mkRes(opts: {
  ok: boolean;
  status: number;
  json?: any;
  jsonThrows?: boolean;
  text?: string;
  textThrows?: boolean;
}) {
  const jsonFn = opts.jsonThrows
    ? vi.fn().mockRejectedValue(new Error('json fail'))
    : vi.fn().mockResolvedValue(opts.json ?? {});
  const textFn = opts.textThrows
    ? vi.fn().mockRejectedValue(new Error('text fail'))
    : vi.fn().mockResolvedValue(opts.text ?? '');

  return {
    ok: opts.ok,
    status: opts.status,
    json: jsonFn,
    text: textFn,
  } as any; // Response-ish
}

async function actResolve<T>(fn: () => Promise<T>): Promise<T> {
  let out!: T;
  await act(async () => {
    out = await fn();
  });
  return out;
}

/**
 * Important: ne laisse PAS act() rejeter.
 * On capture l'erreur dans le act, sinon React n'a parfois pas le temps
 * de flush setError(...) avant que le test "throw".
 */
async function actReject(fn: () => Promise<any>): Promise<any> {
  let err: any = null;

  await act(async () => {
    try {
      await fn();
    } catch (e) {
      err = e;
    }
  });

  if (!err) throw new Error('Expected function to throw');
  return err;
}

beforeEach(() => {
  apiFetchMock.mockReset();
});

describe('useMember', () => {
  it('initial state', () => {
    const { result } = renderHook(() => useMember('b1'));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.actions).toBeTruthy();
  });

  describe('getMembers', () => {
    it('throws if boardId missing', async () => {
      const { result } = renderHook(() => useMember(undefined));
      await expect(result.current.actions.getMembers()).rejects.toThrow(
        /boardId is required to fetch (members|board members)/,
      );
    });

    it('returns [] if ok but json is not array', async () => {
      apiFetchMock.mockResolvedValue(mkRes({ ok: true, status: 200, json: { nope: true } }));

      const { result } = renderHook(() => useMember('b1'));

      const out = await actResolve(() => result.current.actions.getMembers());
      expect(out).toEqual([]);

      expect(apiFetchMock).toHaveBeenCalledWith('/api/boards/b1/members/');
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe(null);
    });

    it('returns members array when ok', async () => {
      const members: BoardMemberApi[] = [
        { user_id: 'u1', email: 'a@a.com', username: 'A', role: 'owner' },
        { user_id: 'u2', email: 'b@b.com', username: 'B', role: 'member' },
      ];
      apiFetchMock.mockResolvedValue(mkRes({ ok: true, status: 200, json: members }));

      const { result } = renderHook(() => useMember('b1'));

      const out = await actResolve(() => result.current.actions.getMembers());
      expect(out).toEqual(members);

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe(null);
    });

    it('non-ok uses json.detail (readDetail json path) and sets error', async () => {
      apiFetchMock.mockResolvedValue(
        mkRes({ ok: false, status: 403, json: { detail: 'Forbidden' } }),
      );

      const { result } = renderHook(() => useMember('b1'));

      const err = await actReject(() => result.current.actions.getMembers());
      expect(err).toMatchObject({ status: 403, detail: 'Forbidden' });

      await waitFor(() => expect(result.current.loading).toBe(false));
      await waitFor(() => expect(result.current.error).toBeTruthy());
      expect((result.current.error as any).detail).toBe('Forbidden');
    });

    it('non-ok falls back to res.text when json fails (readDetail text path)', async () => {
      apiFetchMock.mockResolvedValue(
        mkRes({ ok: false, status: 500, jsonThrows: true, text: 'Server exploded' }),
      );

      const { result } = renderHook(() => useMember('b1'));

      const err = await actReject(() => result.current.actions.getMembers());
      expect(err).toMatchObject({ status: 500, detail: 'Server exploded' });

      await waitFor(() => expect(result.current.loading).toBe(false));
      await waitFor(() => expect(result.current.error).toBeTruthy());
      expect((result.current.error as any).detail).toBe('Server exploded');
    });

    it('non-ok falls back to "Request failed" if json+text both fail', async () => {
      apiFetchMock.mockResolvedValue(
        mkRes({ ok: false, status: 502, jsonThrows: true, textThrows: true }),
      );

      const { result } = renderHook(() => useMember('b1'));

      const err = await actReject(() => result.current.actions.getMembers());
      expect(err).toMatchObject({ status: 502, detail: 'Request failed' });

      await waitFor(() => expect(result.current.loading).toBe(false));
      await waitFor(() => expect(result.current.error).toBeTruthy());
      expect((result.current.error as any).detail).toBe('Request failed');
    });

    it('sets loading true during pending request, then false', async () => {
      let resolve!: (v: any) => void;

      apiFetchMock.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        }),
      );

      const { result } = renderHook(() => useMember('b1'));

      let p!: Promise<BoardMemberApi[]>;
      await act(async () => {
        p = result.current.actions.getMembers();
      });

      await waitFor(() => expect(result.current.loading).toBe(true));

      // IMPORTANT: resolve + await p DANS act, sinon warning act(...)
      await act(async () => {
        resolve(mkRes({ ok: true, status: 200, json: [] }));
        await p;
      });

      await expect(p).resolves.toEqual([]);
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe(null);
    });
  });

  describe('addMember', () => {
    it('throws if boardId missing', async () => {
      const { result } = renderHook(() => useMember(undefined));
      await expect(result.current.actions.addMember('a@a.com')).rejects.toThrow(
        /boardId is required to add (a member|a board member)/,
      );
    });

    it('POSTs json body and returns status+detail on ok', async () => {
      apiFetchMock.mockResolvedValue(mkRes({ ok: true, status: 201, json: { detail: 'Created' } }));

      const { result } = renderHook(() => useMember('b 1'));

      const out = await actResolve(() => result.current.actions.addMember('X@Y.com'));
      expect(out).toEqual({ status: 201, detail: 'Created' });

      expect(apiFetchMock).toHaveBeenCalledWith('/api/boards/b%201/members/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'X@Y.com' }),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe(null);
    });

    it('non-ok throws ApiError (detail from json.detail) and sets error', async () => {
      apiFetchMock.mockResolvedValue(
        mkRes({ ok: false, status: 400, json: { detail: 'Bad request' } }),
      );

      const { result } = renderHook(() => useMember('b1'));

      const err = await actReject(() => result.current.actions.addMember('a@a.com'));
      expect(err).toMatchObject({ status: 400, detail: 'Bad request' });

      await waitFor(() => expect(result.current.loading).toBe(false));
      await waitFor(() => expect(result.current.error).toBeTruthy());
      expect((result.current.error as any).detail).toBe('Bad request');
    });

    it('ok but json has no detail => readDetail uses res.text fallback', async () => {
      apiFetchMock.mockResolvedValue(mkRes({ ok: true, status: 200, json: {}, text: 'OK' }));

      const { result } = renderHook(() => useMember('b1'));

      const out = await actResolve(() => result.current.actions.addMember('a@a.com'));
      expect(out).toEqual({ status: 200, detail: 'OK' });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe(null);
    });
  });

  describe('deleteMember', () => {
    it('throws if boardId missing', async () => {
      const { result } = renderHook(() => useMember(undefined));
      await expect(result.current.actions.deleteMember('a@a.com')).rejects.toThrow(
        /boardId is required to delete (a member|a board member)/,
      );
    });

    it('DELETEs json body; returns void on 204', async () => {
      apiFetchMock.mockResolvedValue(mkRes({ ok: true, status: 204 }));

      const { result } = renderHook(() => useMember('b1'));

      await actResolve(() => result.current.actions.deleteMember('a@a.com'));

      expect(apiFetchMock).toHaveBeenCalledWith('/api/boards/b1/members/', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'a@a.com' }),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe(null);
    });

    it('status != 204 throws ApiError using readDetail (json.detail) and sets error', async () => {
      apiFetchMock.mockResolvedValue(
        mkRes({ ok: false, status: 403, json: { detail: 'Only owner can remove' } }),
      );

      const { result } = renderHook(() => useMember('b1'));

      const err = await actReject(() => result.current.actions.deleteMember('a@a.com'));
      expect(err).toMatchObject({ status: 403, detail: 'Only owner can remove' });

      await waitFor(() => expect(result.current.loading).toBe(false));
      await waitFor(() => expect(result.current.error).toBeTruthy());
      expect((result.current.error as any).detail).toBe('Only owner can remove');
    });

    it('status != 204 falls back to "Request failed" when json+text fail', async () => {
      apiFetchMock.mockResolvedValue(
        mkRes({ ok: false, status: 500, jsonThrows: true, textThrows: true }),
      );

      const { result } = renderHook(() => useMember('b1'));

      const err = await actReject(() => result.current.actions.deleteMember('a@a.com'));
      expect(err).toMatchObject({ status: 500, detail: 'Request failed' });

      await waitFor(() => expect(result.current.loading).toBe(false));
      await waitFor(() => expect(result.current.error).toBeTruthy());
      expect((result.current.error as any).detail).toBe('Request failed');
    });
  });

  describe('useMember - card members', () => {
    describe('getCardMembers', () => {
      it('throws if cardId missing', async () => {
        const { result } = renderHook(() => useMember('b1', undefined));
        await expect(result.current.actions.getCardMembers()).rejects.toThrow(
          'cardId is required to fetch card members',
        );
      });

      it('returns [] if ok but json is not array', async () => {
        apiFetchMock.mockResolvedValue(mkRes({ ok: true, status: 200, json: { nope: true } }));

        const { result } = renderHook(() => useMember('b1', 'c1'));

        const out = await actResolve(() => result.current.actions.getCardMembers());
        expect(out).toEqual([]);

        expect(apiFetchMock).toHaveBeenCalledWith('/api/cards/c1/members/');
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe(null);
      });

      it('returns members array when ok', async () => {
        const members: CardMemberApi[] = [
          { user_id: 'u1', email: 'a@a.com', username: 'A' },
          { user_id: 'u2', email: 'b@b.com', username: 'B' },
        ];
        apiFetchMock.mockResolvedValue(mkRes({ ok: true, status: 200, json: members }));

        const { result } = renderHook(() => useMember('b1', 'c1'));

        const out = await actResolve(() => result.current.actions.getCardMembers());
        expect(out).toEqual(members);

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe(null);
      });

      it('non-ok uses json.detail and sets error', async () => {
        apiFetchMock.mockResolvedValue(
          mkRes({ ok: false, status: 404, json: { detail: 'Not found' } }),
        );

        const { result } = renderHook(() => useMember('b1', 'c1'));

        const err = await actReject(() => result.current.actions.getCardMembers());
        expect(err).toMatchObject({ status: 404, detail: 'Not found' });

        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.error).toBeTruthy());
        expect((result.current.error as any).detail).toBe('Not found');
      });

      it('non-ok falls back to res.text when json fails', async () => {
        apiFetchMock.mockResolvedValue(
          mkRes({ ok: false, status: 500, jsonThrows: true, text: 'Boom' }),
        );

        const { result } = renderHook(() => useMember('b1', 'c1'));

        const err = await actReject(() => result.current.actions.getCardMembers());
        expect(err).toMatchObject({ status: 500, detail: 'Boom' });

        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.error).toBeTruthy());
        expect((result.current.error as any).detail).toBe('Boom');
      });

      it('non-ok falls back to "Request failed" when json+text fail', async () => {
        apiFetchMock.mockResolvedValue(
          mkRes({ ok: false, status: 502, jsonThrows: true, textThrows: true }),
        );

        const { result } = renderHook(() => useMember('b1', 'c1'));

        const err = await actReject(() => result.current.actions.getCardMembers());
        expect(err).toMatchObject({ status: 502, detail: 'Request failed' });

        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.error).toBeTruthy());
        expect((result.current.error as any).detail).toBe('Request failed');
      });
    });

    describe('addCardMember', () => {
      it('throws if cardId missing', async () => {
        const { result } = renderHook(() => useMember('b1', undefined));
        await expect(result.current.actions.addCardMember('a@a.com')).rejects.toThrow(
          'cardId is required to add a card member',
        );
      });

      it('POSTs json body and returns status+detail on ok', async () => {
        apiFetchMock.mockResolvedValue(mkRes({ ok: true, status: 201, json: { detail: 'Added' } }));

        const { result } = renderHook(() => useMember('b1', 'c 1'));

        const out = await actResolve(() => result.current.actions.addCardMember('X@Y.com'));
        expect(out).toEqual({ status: 201, detail: 'Added' });

        expect(apiFetchMock).toHaveBeenCalledWith('/api/cards/c%201/members/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'X@Y.com' }),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe(null);
      });

      it('non-ok throws ApiError (detail from json.detail) and sets error', async () => {
        apiFetchMock.mockResolvedValue(
          mkRes({ ok: false, status: 400, json: { detail: 'Invalid email' } }),
        );

        const { result } = renderHook(() => useMember('b1', 'c1'));

        const err = await actReject(() => result.current.actions.addCardMember('a@a.com'));
        expect(err).toMatchObject({ status: 400, detail: 'Invalid email' });

        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.error).toBeTruthy());
        expect((result.current.error as any).detail).toBe('Invalid email');
      });

      it('ok but json has no detail => readDetail uses res.text fallback', async () => {
        apiFetchMock.mockResolvedValue(mkRes({ ok: true, status: 200, json: {}, text: 'OK' }));

        const { result } = renderHook(() => useMember('b1', 'c1'));

        const out = await actResolve(() => result.current.actions.addCardMember('a@a.com'));
        expect(out).toEqual({ status: 200, detail: 'OK' });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe(null);
      });
    });

    describe('deleteCardMember', () => {
      it('throws if cardId missing', async () => {
        const { result } = renderHook(() => useMember('b1', undefined));
        await expect(result.current.actions.deleteCardMember('a@a.com')).rejects.toThrow(
          'cardId is required to delete a card member',
        );
      });

      it('DELETEs json body; returns void on 204', async () => {
        apiFetchMock.mockResolvedValue(mkRes({ ok: true, status: 204 }));

        const { result } = renderHook(() => useMember('b1', 'c1'));

        await actResolve(() => result.current.actions.deleteCardMember('a@a.com'));

        expect(apiFetchMock).toHaveBeenCalledWith('/api/cards/c1/members/', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'a@a.com' }),
        });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe(null);
      });

      it('status != 204 throws ApiError using readDetail (json.detail) and sets error', async () => {
        apiFetchMock.mockResolvedValue(
          mkRes({ ok: false, status: 403, json: { detail: 'Forbidden' } }),
        );

        const { result } = renderHook(() => useMember('b1', 'c1'));

        const err = await actReject(() => result.current.actions.deleteCardMember('a@a.com'));
        expect(err).toMatchObject({ status: 403, detail: 'Forbidden' });

        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.error).toBeTruthy());
        expect((result.current.error as any).detail).toBe('Forbidden');
      });

      it('status != 204 falls back to "Request failed" when json+text fail', async () => {
        apiFetchMock.mockResolvedValue(
          mkRes({ ok: false, status: 500, jsonThrows: true, textThrows: true }),
        );

        const { result } = renderHook(() => useMember('b1', 'c1'));

        const err = await actReject(() => result.current.actions.deleteCardMember('a@a.com'));
        expect(err).toMatchObject({ status: 500, detail: 'Request failed' });

        await waitFor(() => expect(result.current.loading).toBe(false));
        await waitFor(() => expect(result.current.error).toBeTruthy());
        expect((result.current.error as any).detail).toBe('Request failed');
      });
    });
  });

  describe('useMember - action wrappers', () => {
    it('actions.getBoardMembers delegates to getBoardMembers', async () => {
      apiFetchMock.mockResolvedValue(mkRes({ ok: true, status: 200, json: [] }));
      const { result } = renderHook(() => useMember('b1'));
      const out = await actResolve(() => result.current.actions.getBoardMembers());
      expect(out).toEqual([]);
      expect(apiFetchMock).toHaveBeenCalledWith('/api/boards/b1/members/');
    });

    it('actions.getMembers throws if boardId missing (wrapper branch)', async () => {
      const { result } = renderHook(() => useMember(undefined));
      await expect(result.current.actions.getMembers()).rejects.toThrow(
        /boardId is required to fetch (members|board members)/,
      );
    });

    it('actions.addMember throws if boardId missing (wrapper branch)', async () => {
      const { result } = renderHook(() => useMember(undefined));
      await expect(result.current.actions.addMember('a@a.com')).rejects.toThrow(
        /boardId is required to add (a member|a board member)/,
      );
    });

    it('actions.deleteMember throws if boardId missing (wrapper branch)', async () => {
      const { result } = renderHook(() => useMember(undefined));
      await expect(result.current.actions.deleteMember('a@a.com')).rejects.toThrow(
        /boardId is required to delete (a member|a board member)/,
      );
    });
  });
});
