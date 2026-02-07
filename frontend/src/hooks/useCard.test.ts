import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useCard } from './useCard';

import type { CardModel } from '@/components/BoardCard/BoardCard';
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

function makeResText(text: string, ok = false, status = 500) {
  return {
    ok,
    status,
    json: vi.fn(async () => {
      throw new Error('no json');
    }),
    text: vi.fn(async () => text),
  } as any;
}

const L1: ListModel = { id: 'list-1', title: 'L1' } as any;
const L2: ListModel = { id: 'list-2', title: 'L2' } as any;

function card(partial: Partial<CardModel>): CardModel {
  return {
    id: partial.id ?? 'c',
    title: partial.title ?? 't',
    description: partial.description ?? null,
    position: partial.position ?? 0,
    list_id: partial.list_id ?? 'list-1',
    creator_id: partial.creator_id ?? 'u',
    created_at: partial.created_at ?? new Date().toISOString(),
    label_ids: partial.label_ids ?? [],
  };
}

describe('hooks/useCard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not load cards when boardId is missing', async () => {
    renderHook(() => useCard(undefined, [L1]));
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('loads cards for each list (happy path)', async () => {
    (apiFetch as any)
      .mockResolvedValueOnce(makeResJson([card({ id: 'c1', list_id: 'list-1' })]))
      .mockResolvedValueOnce(makeResJson([card({ id: 'c2', list_id: 'list-2' })]));

    const { result } = renderHook(() => useCard('b1', [L1, L2]));

    await waitFor(() => {
      expect(result.current.loadingCards).toBe(false);
    });

    expect(result.current.cardsByListId['list-1']).toHaveLength(1);
    expect(result.current.cardsByListId['list-2']).toHaveLength(1);

    expect(apiFetch).toHaveBeenCalledWith('/api/cards/?list_id=list-1');
    expect(apiFetch).toHaveBeenCalledWith('/api/cards/?list_id=list-2');
  });

  it('loads cards: error path sets empty object and stops loading', async () => {
    (apiFetch as any).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useCard('b1', [L1]));

    await waitFor(() => expect(result.current.loadingCards).toBe(false));
    expect(result.current.cardsByListId).toEqual({});
  });

  it('api.getCards returns [] when backend returns non-array JSON', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson({ nope: true }));

    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    (apiFetch as any).mockResolvedValueOnce(makeResJson({ nope: true }));
    const out = await result.current.api.getCards('list-1');
    expect(out).toEqual([]);
  });

  it('api.createCard sends POST and returns created card', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    const created = card({ id: 'c-new', title: 'X', list_id: 'list-1' });
    (apiFetch as any).mockResolvedValueOnce(makeResJson(created));

    const out = await result.current.api.createCard('list-1', { title: 'X' });
    expect(out).toEqual(created);

    expect(apiFetch).toHaveBeenLastCalledWith('/api/cards/?list_id=list-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'X' }),
    });
  });

  it('api.updateCard throws with empty text when res.text fails', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    const res = {
      ok: false,
      status: 500,
      text: vi.fn(async () => {
        throw new Error('text failed');
      }),
    } as any;

    (apiFetch as any).mockResolvedValueOnce(res);

    await expect(
      result.current.api.updateCard('c1', {
        title: 'T',
        description: null,
        position: 0,
        list_id: 'list-1',
      }),
    ).rejects.toThrow('PUT card failed (500):');
  });

  it('api.removeCard calls DELETE endpoint', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    (apiFetch as any).mockResolvedValueOnce({ ok: true, status: 204 });

    await result.current.api.removeCard('c1');

    expect(apiFetch).toHaveBeenLastCalledWith('/api/cards/c1', { method: 'DELETE' });
  });

  it('addCard ignores errors (catch branch) and does not change state', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    (apiFetch as any).mockRejectedValueOnce(new Error('POST failed'));

    await act(async () => {
      await result.current.actions.addCard('list-1', 'Hello');
    });

    expect(result.current.cardsByListId['list-1']).toEqual([]);
  });

  it('deleteCard keeps deletion when DELETE succeeds', async () => {
    const existing = card({ id: 'c1', list_id: 'list-1' });

    (apiFetch as any).mockResolvedValueOnce(makeResJson([existing]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    (apiFetch as any).mockResolvedValueOnce({ ok: true, status: 204 });

    await act(async () => {
      await result.current.actions.deleteCard('c1', 'list-1');
    });

    expect(result.current.cardsByListId['list-1']).toEqual([]);
  });

  it('commitCardsMove does not persist twice when moving within same list', async () => {
    const initial = [card({ id: 'c1', list_id: 'list-1', position: 0 })];

    (apiFetch as any).mockResolvedValueOnce(makeResJson(initial));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    (apiFetch as any).mockResolvedValue({ ok: true, status: 200, text: vi.fn(async () => '') });

    const next = [card({ id: 'c1', list_id: 'list-1', position: 0, title: 'X' })];

    await act(async () => {
      await result.current.dnd.commitCardsMove('list-1', 'list-1', next, next);
    });

    const putCalls = (apiFetch as any).mock.calls.filter((c: any[]) => c[1]?.method === 'PUT');
    expect(putCalls.length).toBe(1);
  });

  it('addCard trims title and appends created card on success', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    const created = card({ id: 'new', title: 'Hello', list_id: 'list-1' });
    (apiFetch as any).mockResolvedValueOnce(makeResJson(created));

    await act(async () => {
      await result.current.actions.addCard('list-1', '  Hello  ');
    });

    expect(result.current.cardsByListId['list-1']).toEqual([created]);

    expect(apiFetch).toHaveBeenLastCalledWith('/api/cards/?list_id=list-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hello' }),
    });
  });

  it('addCard does nothing for empty title', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));

    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    await act(async () => {
      await result.current.actions.addCard('list-1', '   ');
    });

    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('renameCard optimistic update then calls PUT; no rollback when ok', async () => {
    const existing = card({ id: 'c1', title: 'Old', list_id: 'list-1', position: 0 });

    (apiFetch as any).mockResolvedValueOnce(makeResJson([existing]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    (apiFetch as any).mockResolvedValueOnce({ ok: true, status: 200, text: vi.fn(async () => '') });

    await act(async () => {
      await result.current.actions.renameCard('c1', 'list-1', '  New  ');
    });

    expect(result.current.cardsByListId['list-1'][0].title).toBe('New');

    expect(apiFetch).toHaveBeenLastCalledWith('/api/cards/c1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New',
        description: existing.description,
        position: existing.position,
        list_id: existing.list_id,
      }),
    });
  });

  it('renameCard rolls back on PUT failure', async () => {
    const existing = card({ id: 'c1', title: 'Old', list_id: 'list-1', position: 0 });

    (apiFetch as any).mockResolvedValueOnce(makeResJson([existing]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    (apiFetch as any).mockResolvedValueOnce(makeResText('nope', false, 500));

    await act(async () => {
      await result.current.actions.renameCard('c1', 'list-1', 'New');
    });

    expect(result.current.cardsByListId['list-1'][0].title).toBe('Old');
  });

  it('renameCard no-ops for empty title or missing card', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    await act(async () => {
      await result.current.actions.renameCard('missing', 'list-1', 'New');
      await result.current.actions.renameCard('missing', 'list-1', '   ');
    });

    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('deleteCard optimistic remove then calls DELETE; rollback on failure', async () => {
    const existing = card({ id: 'c1', title: 'A', list_id: 'list-1' });

    (apiFetch as any).mockResolvedValueOnce(makeResJson([existing]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    (apiFetch as any).mockRejectedValueOnce(new Error('delete failed'));

    await act(async () => {
      await result.current.actions.deleteCard('c1', 'list-1');
    });

    expect(result.current.cardsByListId['list-1']).toHaveLength(1);
    expect(result.current.cardsByListId['list-1'][0].id).toBe('c1');
  });

  it('setCardLabelsLocal updates label_ids', async () => {
    const existing = card({ id: 'c1', title: 'A', list_id: 'list-1', label_ids: [] });

    (apiFetch as any).mockResolvedValueOnce(makeResJson([existing]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    act(() => {
      result.current.actions.setCardLabelsLocal('c1', 'list-1', [0, 1]);
    });

    expect(result.current.cardsByListId['list-1'][0].label_ids).toEqual([0, 1]);
  });

  it('moveCardBetweenListsPreview moves card and respects toIndex clamping', async () => {
    const c1 = card({ id: 'c1', title: '1', list_id: 'list-1' });
    const c2 = card({ id: 'c2', title: '2', list_id: 'list-1' });

    (apiFetch as any).mockResolvedValueOnce(makeResJson([c1, c2]));
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));
    const { result } = renderHook(() => useCard('b1', [L1, L2]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    act(() => {
      result.current.dnd.moveCardBetweenListsPreview('list-1', 'list-2', 'c1', 999);
    });

    expect(result.current.cardsByListId['list-1'].map((c) => c.id)).toEqual(['c2']);
    expect(result.current.cardsByListId['list-2'].map((c) => c.id)).toEqual(['c1']);
    expect(result.current.cardsByListId['list-2'][0].list_id).toBe('list-2');
  });

  it('moveCardBetweenListsPreview no-ops if moving card not found', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    const snapshot = result.current.cardsByListId;

    act(() => {
      result.current.dnd.moveCardBetweenListsPreview('list-1', 'list-2', 'missing', 0);
    });

    expect(result.current.cardsByListId).toBe(snapshot);
  });

  it('reorderCards updates state and persists positions via PUT', async () => {
    const c1 = card({ id: 'c1', title: '1', list_id: 'list-1', position: 0 });
    const c2 = card({ id: 'c2', title: '2', list_id: 'list-1', position: 1 });

    (apiFetch as any).mockResolvedValueOnce(makeResJson([c1, c2]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    (apiFetch as any).mockResolvedValue({ ok: true, status: 200, text: vi.fn(async () => '') });

    const next = [c2, c1];

    await act(async () => {
      await result.current.dnd.reorderCards('list-1', next);
    });

    expect(result.current.cardsByListId['list-1'].map((c) => c.id)).toEqual(['c2', 'c1']);

    const calls = (apiFetch as any).mock.calls.filter((c: any[]) =>
      String(c[0]).startsWith('/api/cards/'),
    );
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  it('commitCardsMove persists positions and rolls back snapshot on failure', async () => {
    const from = [card({ id: 'c1', title: '1', list_id: 'list-1', position: 0 })];
    const to = [card({ id: 'c2', title: '2', list_id: 'list-2', position: 0 })];

    (apiFetch as any).mockResolvedValueOnce(makeResJson(from));
    (apiFetch as any).mockResolvedValueOnce(makeResJson(to));
    const { result } = renderHook(() => useCard('b1', [L1, L2]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    const prevSnapshot = result.current.cardsByListId;

    (apiFetch as any).mockResolvedValueOnce(makeResText('fail', false, 500));

    await act(async () => {
      await result.current.dnd.commitCardsMove('list-1', 'list-2', [], to);
    });

    expect(result.current.cardsByListId).toEqual(prevSnapshot);
  });

  it('commitCardsMove persists both lists when moving across lists (success)', async () => {
    const fromInitial = [card({ id: 'c1', title: '1', list_id: 'list-1', position: 0 })];
    const toInitial: CardModel[] = [];

    (apiFetch as any).mockResolvedValueOnce(makeResJson(fromInitial));
    (apiFetch as any).mockResolvedValueOnce(makeResJson(toInitial));
    const { result } = renderHook(() => useCard('b1', [L1, L2]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    const nextFrom: CardModel[] = [];
    const moved = { ...fromInitial[0], list_id: 'list-2', position: 0 };
    const nextTo: CardModel[] = [moved];

    (apiFetch as any).mockResolvedValue({ ok: true, status: 200, text: vi.fn(async () => '') });

    await act(async () => {
      await result.current.dnd.commitCardsMove('list-1', 'list-2', nextFrom, nextTo);
    });

    expect(result.current.cardsByListId['list-1']).toEqual(nextFrom);
    expect(result.current.cardsByListId['list-2']).toEqual(nextTo);

    const putCalls = (apiFetch as any).mock.calls.filter((c: any[]) => c[1]?.method === 'PUT');
    expect(putCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('loads with lists undefined: safeLists=[] => no fetch, loading returns false', async () => {
    const { result } = renderHook(() => useCard('b1', undefined));

    await waitFor(() => expect(result.current.loadingCards).toBe(false));
    expect(apiFetch).not.toHaveBeenCalled();
    expect(result.current.cardsByListId).toEqual({});
  });

  it('reloads when lists change (listIdsKey dependency)', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([card({ id: 'c1', list_id: 'list-1' })]));

    const { result, rerender } = renderHook(({ lists }) => useCard('b1', lists), {
      initialProps: { lists: [L1] as any },
    });

    await waitFor(() => expect(result.current.loadingCards).toBe(false));
    expect(result.current.cardsByListId['list-1']).toHaveLength(1);

    (apiFetch as any)
      .mockResolvedValueOnce(makeResJson([card({ id: 'c1b', list_id: 'list-1' })]))
      .mockResolvedValueOnce(makeResJson([card({ id: 'c2', list_id: 'list-2' })]));

    rerender({ lists: [L1, L2] as any });

    await waitFor(() => expect(result.current.loadingCards).toBe(false));
    expect(result.current.cardsByListId['list-1']).toHaveLength(1);
    expect(result.current.cardsByListId['list-2']).toHaveLength(1);

    const getCalls = (apiFetch as any).mock.calls.filter((c: any[]) =>
      String(c[0]).startsWith('/api/cards/?list_id='),
    );

    expect(getCalls.length).toBe(3);
  });

  it('api.getCards encodes list_id in query (encodeURIComponent)', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));

    const weirdId = 'list/é 1?&=';
    await result.current.api.getCards(weirdId);

    expect(apiFetch).toHaveBeenLastCalledWith(`/api/cards/?list_id=${encodeURIComponent(weirdId)}`);
  });

  it('api.updateCard throws with response text when res.ok is false', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));
    const { result } = renderHook(() => useCard('b1', [L1]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    (apiFetch as any).mockResolvedValueOnce(makeResText('backend says nope', false, 418));

    await expect(
      result.current.api.updateCard('c1', {
        title: 'T',
        description: null,
        position: 0,
        list_id: 'list-1',
      }),
    ).rejects.toThrow('PUT card failed (418): backend says nope');
  });

  it('moveCardBetweenListsPreview clamps negative toIndex to 0', async () => {
    const c1 = card({ id: 'c1', title: '1', list_id: 'list-1' });
    const c2 = card({ id: 'c2', title: '2', list_id: 'list-2' });

    (apiFetch as any).mockResolvedValueOnce(makeResJson([c1]));
    (apiFetch as any).mockResolvedValueOnce(makeResJson([c2]));

    const { result } = renderHook(() => useCard('b1', [L1, L2]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    act(() => {
      result.current.dnd.moveCardBetweenListsPreview('list-1', 'list-2', 'c1', -999);
    });

    expect(result.current.cardsByListId['list-1']).toEqual([]);
    expect(result.current.cardsByListId['list-2'].map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(result.current.cardsByListId['list-2'][0].list_id).toBe('list-2');
  });

  it('commitCardsMove rolls back when persisting nextFrom fails (forced non-empty)', async () => {
    const fromInitial = [
      card({ id: 'c1', title: '1', list_id: 'list-1', position: 0 }),
      card({ id: 'cX', title: 'X', list_id: 'list-1', position: 1 }),
    ];
    const toInitial: CardModel[] = [];

    (apiFetch as any).mockResolvedValueOnce(makeResJson(fromInitial));
    (apiFetch as any).mockResolvedValueOnce(makeResJson(toInitial));

    const { result } = renderHook(() => useCard('b1', [L1, L2]));
    await waitFor(() => expect(result.current.loadingCards).toBe(false));

    const prevSnapshot = result.current.cardsByListId;

    const moved = { ...fromInitial[0], list_id: 'list-2', position: 0 };
    const nextTo: CardModel[] = [moved];

    const nextFrom: CardModel[] = [fromInitial[1]];

    (apiFetch as any)
      .mockResolvedValueOnce({ ok: true, status: 200, text: vi.fn(async () => '') })
      .mockResolvedValueOnce(makeResText('fail from', false, 500));

    await act(async () => {
      await result.current.dnd.commitCardsMove('list-1', 'list-2', nextFrom, nextTo);
    });

    expect(result.current.cardsByListId).toEqual(prevSnapshot);
  });
});
