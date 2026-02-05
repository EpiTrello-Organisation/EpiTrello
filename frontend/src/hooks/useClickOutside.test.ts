import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClickOutside } from './useClickOutside';
import React from 'react';

describe('hooks/useClickOutside', () => {
  let divInside: HTMLDivElement;
  let divOutside: HTMLDivElement;

  beforeEach(() => {
    divInside = document.createElement('div');
    divOutside = document.createElement('div');
    document.body.appendChild(divInside);
    document.body.appendChild(divOutside);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  function firePointerDown(target: EventTarget) {
    const event = new PointerEvent('pointerdown', {
      bubbles: true,
    });
    Object.defineProperty(event, 'target', {
      value: target,
    });
    window.dispatchEvent(event);
  }

  it('does nothing when disabled', () => {
    const onOutside = vi.fn();
    const ref = { current: divInside } as React.RefObject<HTMLDivElement>;

    renderHook(() =>
      useClickOutside({
        enabled: false,
        refs: [ref],
        onOutside,
      }),
    );

    firePointerDown(divOutside);

    expect(onOutside).not.toHaveBeenCalled();
  });

  it('does not call onOutside when clicking inside one of the refs', () => {
    const onOutside = vi.fn();
    const ref = { current: divInside } as React.RefObject<HTMLDivElement>;

    renderHook(() =>
      useClickOutside({
        enabled: true,
        refs: [ref],
        onOutside,
      }),
    );

    firePointerDown(divInside);

    expect(onOutside).not.toHaveBeenCalled();
  });

  it('calls onOutside when clicking outside all refs', () => {
    const onOutside = vi.fn();
    const ref = { current: divInside } as React.RefObject<HTMLDivElement>;

    renderHook(() =>
      useClickOutside({
        enabled: true,
        refs: [ref],
        onOutside,
      }),
    );

    firePointerDown(divOutside);

    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('works with multiple refs', () => {
    const onOutside = vi.fn();
    const ref1 = { current: divInside } as React.RefObject<HTMLDivElement>;
    const ref2 = { current: divOutside } as React.RefObject<HTMLDivElement>;

    renderHook(() =>
      useClickOutside({
        enabled: true,
        refs: [ref1, ref2],
        onOutside,
      }),
    );

    firePointerDown(divInside);
    firePointerDown(divOutside);

    expect(onOutside).not.toHaveBeenCalled();

    const another = document.createElement('div');
    document.body.appendChild(another);

    firePointerDown(another);
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('removes listener on unmount', () => {
    const onOutside = vi.fn();
    const ref = { current: divInside } as React.RefObject<HTMLDivElement>;

    const { unmount } = renderHook(() =>
      useClickOutside({
        enabled: true,
        refs: [ref],
        onOutside,
      }),
    );

    unmount();

    firePointerDown(divOutside);

    expect(onOutside).not.toHaveBeenCalled();
  });

  it('respects capture option', () => {
    const onOutside = vi.fn();
    const ref = { current: divInside } as React.RefObject<HTMLDivElement>;

    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useClickOutside({
        enabled: true,
        refs: [ref],
        onOutside,
        capture: false,
      }),
    );

    expect(addSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function), { capture: false });

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function), { capture: false });
  });

  it('reacts to enabled toggling (attach / detach)', () => {
    const onOutside = vi.fn();
    const ref = { current: divInside } as React.RefObject<HTMLDivElement>;

    const { rerender } = renderHook(
      ({ enabled }) =>
        useClickOutside({
          enabled,
          refs: [ref],
          onOutside,
        }),
      {
        initialProps: { enabled: false },
      },
    );

    firePointerDown(divOutside);
    expect(onOutside).not.toHaveBeenCalled();

    rerender({ enabled: true });

    firePointerDown(divOutside);
    expect(onOutside).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });

    firePointerDown(divOutside);
    expect(onOutside).toHaveBeenCalledTimes(1);
  });
});
