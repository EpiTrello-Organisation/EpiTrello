import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useList } from './useList';

import type { ListModel } from '@/components/BoardList/BoardList';

vi.mock('@/api/fetcher', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/api/fetcher';

function makeResJson<T>(data: T, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn(async () => data),
    text: vi.fn(async () => JSON.stringify(data)),
  } as any;
}

const L1: ListModel = { id: 'list-1', title: 'L1' } as any;
const L2: ListModel = { id: 'list-2', title: 'L2' } as any;

describe('hooks/useList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('hasBoard=false and does not load when boardId is missing', () => {
    const { result } = renderHook(() => useList(undefined));

    expect(result.current.hasBoard).toBe(false);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('loads lists for board (happy path)', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([L1, L2]));

    const { result } = renderHook(() => useList('b1'));

    await waitFor(() => expect(result.current.loadingLists).toBe(false));

    expect(result.current.lists).toEqual([L1, L2]);
    expect(result.current.hasBoard).toBe(true);
    expect(apiFetch).toHaveBeenCalledWith('/api/lists/board/b1');
  });

  it('loads lists: non-array JSON becomes []', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson({ nope: true }));

    const { result } = renderHook(() => useList('b1'));

    await waitFor(() => expect(result.current.loadingLists).toBe(false));
    expect(result.current.lists).toEqual([]);
  });

  it('loads lists: error path sets [] and stops loading', async () => {
    (apiFetch as any).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useList('b1'));

    await waitFor(() => expect(result.current.loadingLists).toBe(false));
    expect(result.current.lists).toEqual([]);
  });

  it('api.createList sends POST and returns created list', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));

    const { result } = renderHook(() => useList('b1'));
    await waitFor(() => expect(result.current.loadingLists).toBe(false));

    const created: ListModel = { id: 'list-new', title: 'X' } as any;
    (apiFetch as any).mockResolvedValueOnce(makeResJson(created));

    const out = await result.current.api.createList('b1', { title: 'X' });
    expect(out).toEqual(created);

    expect(apiFetch).toHaveBeenLastCalledWith('/api/lists/?board_id=b1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'X' }),
    });
  });

  it('api.updateList calls PUT endpoint', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));

    const { result } = renderHook(() => useList('b1'));
    await waitFor(() => expect(result.current.loadingLists).toBe(false));

    (apiFetch as any).mockResolvedValueOnce({ ok: true, status: 200 });

    await result.current.api.updateList('list-1', { title: 'New', position: 3 });

    expect(apiFetch).toHaveBeenLastCalledWith('/api/lists/list-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New', position: 3 }),
    });
  });

  it('api.removeList calls DELETE endpoint', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));

    const { result } = renderHook(() => useList('b1'));
    await waitFor(() => expect(result.current.loadingLists).toBe(false));

    (apiFetch as any).mockResolvedValueOnce({ ok: true, status: 204 });

    await result.current.api.removeList('list-1');

    expect(apiFetch).toHaveBeenLastCalledWith('/api/lists/list-1', { method: 'DELETE' });
  });

  it('actions.addList trims title and appends created list on success', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([L1]));

    const { result } = renderHook(() => useList('b1'));
    await waitFor(() => expect(result.current.loadingLists).toBe(false));

    const created: ListModel = { id: 'list-2', title: 'Hello' } as any;
    (apiFetch as any).mockResolvedValueOnce(makeResJson(created));

    await act(async () => {
      await result.current.actions.addList('  Hello  ');
    });

    expect(result.current.lists.map((l) => l.id)).toEqual(['list-1', 'list-2']);
    expect(apiFetch).toHaveBeenLastCalledWith('/api/lists/?board_id=b1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hello' }),
    });
  });

  it('actions.addList no-ops for empty title or missing boardId', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));

    const { result } = renderHook(() => useList('b1'));
    await waitFor(() => expect(result.current.loadingLists).toBe(false));

    await act(async () => {
      await result.current.actions.addList('   ');
    });

    expect(apiFetch).toHaveBeenCalledTimes(1);

    const { result: result2 } = renderHook(() => useList(undefined));
    await act(async () => {
      await result2.current.actions.addList('Hello');
    });

    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('actions.addList ignores errors (catch branch) and does not change state', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([L1]));

    const { result } = renderHook(() => useList('b1'));
    await waitFor(() => expect(result.current.loadingLists).toBe(false));

    (apiFetch as any).mockRejectedValueOnce(new Error('POST failed'));

    await act(async () => {
      await result.current.actions.addList('Hello');
    });

    expect(result.current.lists).toEqual([L1]);
  });

  it('actions.renameList optimistic update then PUT; rollback on failure', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([L1]));

    const { result } = renderHook(() => useList('b1'));
    await waitFor(() => expect(result.current.loadingLists).toBe(false));

    (apiFetch as any).mockRejectedValueOnce(new Error('PUT failed'));

    await act(async () => {
      await result.current.actions.renameList('list-1', 'New');
    });

    expect(result.current.lists[0].title).toBe('L1');

    expect(apiFetch).toHaveBeenLastCalledWith('/api/lists/list-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New' }),
    });
  });

  it('actions.renameList keeps new title when PUT succeeds', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([L1]));

    const { result } = renderHook(() => useList('b1'));
    await waitFor(() => expect(result.current.loadingLists).toBe(false));

    (apiFetch as any).mockResolvedValueOnce({ ok: true, status: 200 });

    await act(async () => {
      await result.current.actions.renameList('list-1', 'New');
    });

    expect(result.current.lists[0].title).toBe('New');
  });

  it('actions.deleteList optimistic remove then DELETE; rollback on failure', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([L1, L2]));

    const { result } = renderHook(() => useList('b1'));
    await waitFor(() => expect(result.current.loadingLists).toBe(false));

    (apiFetch as any).mockRejectedValueOnce(new Error('DELETE failed'));

    await act(async () => {
      await result.current.actions.deleteList('list-1');
    });

    expect(result.current.lists.map((l) => l.id)).toEqual(['list-1', 'list-2']);
  });

  it('actions.deleteList keeps deletion when DELETE succeeds', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([L1, L2]));

    const { result } = renderHook(() => useList('b1'));
    await waitFor(() => expect(result.current.loadingLists).toBe(false));

    (apiFetch as any).mockResolvedValueOnce({ ok: true, status: 204 });

    await act(async () => {
      await result.current.actions.deleteList('list-1');
    });

    expect(result.current.lists.map((l) => l.id)).toEqual(['list-2']);
    expect(apiFetch).toHaveBeenLastCalledWith('/api/lists/list-1', { method: 'DELETE' });
  });

  it('dnd.reorderLists updates state and persists positions; rollback on persist failure', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([L1, L2]));

    const { result } = renderHook(() => useList('b1'));
    await waitFor(() => expect(result.current.loadingLists).toBe(false));

    const next: ListModel[] = [{ ...L2 }, { ...L1 }];

    (apiFetch as any).mockRejectedValueOnce(new Error('PUT failed'));

    await act(async () => {
      await result.current.dnd.reorderLists(next);
    });

    expect(result.current.lists.map((l) => l.id)).toEqual(['list-1', 'list-2']);
  });

  it('dnd.reorderLists persists each list position by index (success)', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([L1, L2]));

    const { result } = renderHook(() => useList('b1'));
    await waitFor(() => expect(result.current.loadingLists).toBe(false));

    const next: ListModel[] = [{ ...L2 }, { ...L1 }];

    (apiFetch as any).mockResolvedValue({ ok: true, status: 200 });

    await act(async () => {
      await result.current.dnd.reorderLists(next);
    });

    expect(result.current.lists.map((l) => l.id)).toEqual(['list-2', 'list-1']);

    const putCalls = (apiFetch as any).mock.calls.filter((c: any[]) => c[1]?.method === 'PUT');

    expect(putCalls.length).toBeGreaterThanOrEqual(2);

    const payloadsById = new Map<string, any>();
    for (const [url, options] of putCalls) {
      const id = String(url).replace('/api/lists/', '');
      payloadsById.set(id, JSON.parse(options.body));
    }

    expect(payloadsById.get('list-2')).toEqual({ position: 0 });
    expect(payloadsById.get('list-1')).toEqual({ position: 1 });
  });
});
