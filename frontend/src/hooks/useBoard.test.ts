import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBoard } from './useBoard';

import type { BoardModel } from './useBoard';

vi.mock('@/api/fetcher', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/api/fetcher';

function makeResJson<T>(data: T, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn(async () => data),
  } as any;
}

const BOARD: BoardModel = { id: 'b1', title: 'My board' };

describe('hooks/useBoard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not load board when boardId is missing', () => {
    renderHook(() => useBoard(undefined));
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('loads board on mount (happy path)', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson(BOARD));

    const { result } = renderHook(() => useBoard('b1'));

    expect(result.current.loadingBoard).toBe(true);

    await waitFor(() => {
      expect(result.current.loadingBoard).toBe(false);
    });

    expect(result.current.board).toEqual(BOARD);
    expect(apiFetch).toHaveBeenCalledWith('/api/boards/b1');
  });

  it('sets board to null on load error', async () => {
    (apiFetch as any).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useBoard('b1'));

    await waitFor(() => {
      expect(result.current.loadingBoard).toBe(false);
    });

    expect(result.current.board).toBeNull();
  });

  it('api.getBoard returns board', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson(BOARD));

    const { result } = renderHook(() => useBoard('b1'));
    await waitFor(() => expect(result.current.loadingBoard).toBe(false));

    (apiFetch as any).mockResolvedValueOnce(makeResJson(BOARD));
    const out = await result.current.api.getBoard('b1');

    expect(out).toEqual(BOARD);
  });

  it('renameBoard trims title and updates optimistically', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson(BOARD));

    const { result } = renderHook(() => useBoard('b1'));
    await waitFor(() => expect(result.current.loadingBoard).toBe(false));

    (apiFetch as any).mockResolvedValueOnce({ ok: true });

    await act(async () => {
      await result.current.actions.renameBoard('  New title  ');
    });

    expect(result.current.board?.title).toBe('New title');

    expect(apiFetch).toHaveBeenLastCalledWith('/api/boards/b1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New title' }),
    });
  });

  it('renameBoard rolls back on PUT failure', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson(BOARD));

    const { result } = renderHook(() => useBoard('b1'));
    await waitFor(() => expect(result.current.loadingBoard).toBe(false));

    (apiFetch as any).mockRejectedValueOnce(new Error('PUT failed'));

    await act(async () => {
      await result.current.actions.renameBoard('New');
    });

    expect(result.current.board?.title).toBe('My board');
  });

  it('renameBoard no-ops for empty title or missing boardId', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson(BOARD));

    const { result } = renderHook(() => useBoard('b1'));
    await waitFor(() => expect(result.current.loadingBoard).toBe(false));

    await act(async () => {
      await result.current.actions.renameBoard('   ');
    });

    expect(apiFetch).toHaveBeenCalledTimes(1); // only initial GET
    expect(result.current.board?.title).toBe('My board');
  });

  it('deleteBoard returns true when DELETE succeeds', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson(BOARD));

    const { result } = renderHook(() => useBoard('b1'));
    await waitFor(() => expect(result.current.loadingBoard).toBe(false));

    (apiFetch as any).mockResolvedValueOnce({ ok: true });

    const ok = await result.current.actions.deleteBoard();

    expect(ok).toBe(true);
    expect(apiFetch).toHaveBeenLastCalledWith('/api/boards/b1', { method: 'DELETE' });
  });

  it('deleteBoard returns false on DELETE failure', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson(BOARD));

    const { result } = renderHook(() => useBoard('b1'));
    await waitFor(() => expect(result.current.loadingBoard).toBe(false));

    (apiFetch as any).mockRejectedValueOnce(new Error('delete failed'));

    const ok = await result.current.actions.deleteBoard();

    expect(ok).toBe(false);
  });

  it('deleteBoard returns false when boardId is missing', async () => {
    const { result } = renderHook(() => useBoard(undefined));

    const ok = await result.current.actions.deleteBoard();

    expect(ok).toBe(false);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('changeBackground updates board optimistically and calls PUT', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson(BOARD));

    const { result } = renderHook(() => useBoard('b1'));
    await waitFor(() => expect(result.current.loadingBoard).toBe(false));

    (apiFetch as any).mockResolvedValueOnce({ ok: true });

    await act(async () => {
      await result.current.actions.changeBackground({
        background_kind: 'gradient',
        background_value: 'g-3',
        background_thumb_url: null,
      });
    });

    expect(result.current.board?.background_kind).toBe('gradient');
    expect(result.current.board?.background_value).toBe('g-3');

    expect(apiFetch).toHaveBeenLastCalledWith('/api/boards/b1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        background_kind: 'gradient',
        background_value: 'g-3',
        background_thumb_url: null,
      }),
    });
  });

  it('changeBackground rolls back on PUT failure', async () => {
    const boardWithBg: BoardModel = {
      ...BOARD,
      background_kind: 'gradient',
      background_value: 'g-1',
      background_thumb_url: null,
    };
    (apiFetch as any).mockResolvedValueOnce(makeResJson(boardWithBg));

    const { result } = renderHook(() => useBoard('b1'));
    await waitFor(() => expect(result.current.loadingBoard).toBe(false));

    (apiFetch as any).mockRejectedValueOnce(new Error('PUT failed'));

    await act(async () => {
      await result.current.actions.changeBackground({
        background_kind: 'unsplash',
        background_value: 'img-2',
        background_thumb_url: 'https://example.com/img.jpg',
      });
    });

    // Should roll back to original values
    expect(result.current.board?.background_kind).toBe('gradient');
    expect(result.current.board?.background_value).toBe('g-1');
  });

  it('changeBackground no-ops when boardId is missing', async () => {
    const { result } = renderHook(() => useBoard(undefined));

    await act(async () => {
      await result.current.actions.changeBackground({
        background_kind: 'gradient',
        background_value: 'g-1',
        background_thumb_url: null,
      });
    });

    expect(apiFetch).not.toHaveBeenCalled();
  });
});
