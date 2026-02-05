import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useListMenu } from './useListMenu';

vi.mock('./useClickOutside', () => ({
  useClickOutside: vi.fn(),
}));

import { useClickOutside } from './useClickOutside';

type ClickOutsideArgs = {
  enabled: boolean;
  refs: Array<{ current: any }>;
  onOutside: () => void;
  capture?: boolean;
};

function lastArgs(): ClickOutsideArgs {
  const calls = (useClickOutside as any).mock.calls;
  return calls[calls.length - 1][0] as ClickOutsideArgs;
}

describe('hooks/useListMenu', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('initial state: menu closed, clickOutside disabled', () => {
    const { result } = renderHook(() => useListMenu());

    expect(result.current.menuOpen).toBe(false);
    expect(result.current.menuWrapperRef).toBeTruthy();

    expect(useClickOutside).toHaveBeenCalledTimes(1);
    const args = lastArgs();
    expect(args.enabled).toBe(false);
    expect(args.capture).toBe(true);
    expect(args.refs).toHaveLength(1);
  });

  it('setMenuOpen(true) enables clickOutside', () => {
    const { result } = renderHook(() => useListMenu());

    act(() => {
      result.current.setMenuOpen(true);
    });

    expect(result.current.menuOpen).toBe(true);

    expect((useClickOutside as any).mock.calls.length).toBeGreaterThanOrEqual(2);
    const args = lastArgs();
    expect(args.enabled).toBe(true);
  });

  it('onOutside closes the menu', () => {
    const { result } = renderHook(() => useListMenu());

    act(() => {
      result.current.setMenuOpen(true);
    });

    expect(result.current.menuOpen).toBe(true);

    const args = lastArgs();
    act(() => {
      args.onOutside();
    });

    expect(result.current.menuOpen).toBe(false);
  });

  it('passes stable refs array across rerenders', () => {
    const { result, rerender } = renderHook(() => useListMenu());

    const first = lastArgs();
    const firstRefs = first.refs;

    rerender();

    const second = lastArgs();
    const secondRefs = second.refs;

    expect(secondRefs).toBe(firstRefs);

    expect(result.current.menuWrapperRef).toBe(firstRefs[0]);
  });
});
