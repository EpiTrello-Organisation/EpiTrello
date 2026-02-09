import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useBoards,
  getBoardBackgroundUrl,
  getBoardBackgroundStyle,
  type BoardModel,
} from './useBoards';

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

describe('hooks/useBoards', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads boards on mount (happy path)', async () => {
    const data: BoardModel[] = [
      { id: 'b1', title: 'A' },
      { id: 'b2', title: 'B', background_url: 'https://x/bg.jpg' },
    ];

    (apiFetch as any).mockResolvedValueOnce(makeResJson(data));

    const { result } = renderHook(() => useBoards());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.boards).toEqual(data);
    expect(apiFetch).toHaveBeenCalledWith('/api/boards');
  });

  it('loads boards: non-array JSON becomes []', async () => {
    (apiFetch as any).mockResolvedValueOnce(makeResJson({ nope: true }));

    const { result } = renderHook(() => useBoards());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.boards).toEqual([]);
  });

  it('loads boards: error path sets [] and stops loading', async () => {
    (apiFetch as any).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useBoards());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.boards).toEqual([]);
  });

  it('createBoard sends POST, appends created board, and returns it', async () => {
    // initial load
    (apiFetch as any).mockResolvedValueOnce(makeResJson([]));

    const { result } = renderHook(() => useBoards());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const created: BoardModel = { id: 'b-new', title: 'New board' };
    (apiFetch as any).mockResolvedValueOnce(makeResJson(created));

    let out: BoardModel | undefined;

    const payload = {
      title: 'New board',
      background_kind: 'gradient' as const,
      background_value: 'g-1',
    };

    await act(async () => {
      out = await result.current.createBoard(payload);
    });

    expect(out).toEqual(created);
    expect(result.current.boards).toEqual([created]);

    expect(apiFetch).toHaveBeenLastCalledWith('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });

  it('createBoard appends after existing boards', async () => {
    const initial: BoardModel[] = [{ id: 'b1', title: 'A' }];
    (apiFetch as any).mockResolvedValueOnce(makeResJson(initial));

    const { result } = renderHook(() => useBoards());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const created: BoardModel = { id: 'b2', title: 'B' };
    (apiFetch as any).mockResolvedValueOnce(makeResJson(created));

    await act(async () => {
      await result.current.createBoard({
        title: 'B',
        background_kind: 'gradient',
        background_value: 'g-2',
      });
    });

    expect(result.current.boards.map((b) => b.id)).toEqual(['b1', 'b2']);
  });
});

describe('getBoardBackgroundUrl', () => {
  it('prefers backgroundUrl over background_url', () => {
    const b: BoardModel = {
      id: 'b1',
      title: 'A',
      backgroundUrl: 'camel',
      background_url: 'snake',
    };
    expect(getBoardBackgroundUrl(b)).toBe('camel');
  });

  it('falls back to background_url', () => {
    const b: BoardModel = { id: 'b1', title: 'A', background_url: 'snake' };
    expect(getBoardBackgroundUrl(b)).toBe('snake');
  });

  it('unsplash returns thumb url', () => {
    const b: BoardModel = {
      id: 'b1',
      title: 'A',
      background_kind: 'unsplash',
      background_thumb_url: 'thumb',
    };
    expect(getBoardBackgroundUrl(b)).toBe('thumb');
  });

  it('unsplash returns null if thumb missing', () => {
    const b: BoardModel = {
      id: 'b1',
      title: 'A',
      background_kind: 'unsplash',
      background_thumb_url: null,
    };
    expect(getBoardBackgroundUrl(b)).toBeNull();
  });

  it('returns null when none', () => {
    const b: BoardModel = { id: 'b1', title: 'A' };
    expect(getBoardBackgroundUrl(b)).toBeNull();
  });

  it('returns null when values are null', () => {
    const b: BoardModel = { id: 'b1', title: 'A', backgroundUrl: null, background_url: null };
    expect(getBoardBackgroundUrl(b)).toBeNull();
  });
});

describe('getBoardBackgroundStyle', () => {
  it('legacy backgroundUrl returns url() backgroundImage', () => {
    const b: BoardModel = { id: 'b1', title: 'A', backgroundUrl: 'http://x' };
    expect(getBoardBackgroundStyle(b)).toEqual({ backgroundImage: 'url(http://x)' });
  });

  it('legacy background_url returns url() backgroundImage (when backgroundUrl missing)', () => {
    const b: BoardModel = { id: 'b1', title: 'A', background_url: 'http://y' };
    expect(getBoardBackgroundStyle(b)).toEqual({ backgroundImage: 'url(http://y)' });
  });

  it('unsplash returns url() backgroundImage when thumb exists', () => {
    const b: BoardModel = {
      id: 'b1',
      title: 'A',
      background_kind: 'unsplash',
      background_thumb_url: 'thumb',
    };
    expect(getBoardBackgroundStyle(b)).toEqual({ backgroundImage: 'url(thumb)' });
  });

  it('unsplash returns undefined when thumb missing', () => {
    const b: BoardModel = {
      id: 'b1',
      title: 'A',
      background_kind: 'unsplash',
      background_thumb_url: null,
    };
    expect(getBoardBackgroundStyle(b)).toBeUndefined();
  });

  it('gradient returns linear-gradient for known key', () => {
    const b: BoardModel = {
      id: 'b1',
      title: 'A',
      background_kind: 'gradient',
      background_value: 'g-3',
    };

    const style = getBoardBackgroundStyle(b);
    expect(style).toBeDefined();
    expect(style?.backgroundImage).toContain('linear-gradient');
    expect(style?.backgroundImage).toContain('#0ea5e9'); // g-3 signature
  });

  it('gradient returns undefined for unknown key', () => {
    const b: BoardModel = {
      id: 'b1',
      title: 'A',
      background_kind: 'gradient',
      background_value: 'g-404',
    };
    expect(getBoardBackgroundStyle(b)).toBeUndefined();
  });

  it('returns undefined for unknown background_kind', () => {
    const b: BoardModel = {
      id: 'b1',
      title: 'A',
      // @ts-expect-error test unknown kind
      background_kind: 'whatever',
    };
    expect(getBoardBackgroundStyle(b)).toBeUndefined();
  });

  it('returns undefined when nothing is set', () => {
    const b: BoardModel = { id: 'b1', title: 'A' };
    expect(getBoardBackgroundStyle(b)).toBeUndefined();
  });
});
