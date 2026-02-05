import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAddCardComposer } from './useAddCardComposer';

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

function lastClickOutsideArgs(): ClickOutsideArgs {
  const calls = (useClickOutside as any).mock.calls;
  return calls[calls.length - 1][0] as ClickOutsideArgs;
}

describe('hooks/useAddCardComposer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('initial state is closed with empty title', () => {
    const onAddCard = vi.fn();

    const { result } = renderHook(() => useAddCardComposer({ listId: 'list-1', onAddCard }));

    expect(result.current.isAddingCard).toBe(false);
    expect(result.current.newCardTitle).toBe('');

    expect(useClickOutside).toHaveBeenCalledTimes(1);
    const args = lastClickOutsideArgs();
    expect(args.enabled).toBe(false);
    expect(args.capture).toBe(true);
    expect(Array.isArray(args.refs)).toBe(true);
    expect(args.refs).toHaveLength(1);
  });

  it('openAddCard sets isAddingCard=true (enables clickOutside)', () => {
    const onAddCard = vi.fn();

    const { result } = renderHook(() => useAddCardComposer({ listId: 'list-1', onAddCard }));

    act(() => {
      result.current.openAddCard();
    });

    expect(result.current.isAddingCard).toBe(true);

    expect((useClickOutside as any).mock.calls.length).toBeGreaterThanOrEqual(2);
    const args = lastClickOutsideArgs();
    expect(args.enabled).toBe(true);
  });

  it('cancelAddCard resets title and closes', () => {
    const onAddCard = vi.fn();

    const { result } = renderHook(() => useAddCardComposer({ listId: 'list-1', onAddCard }));

    act(() => {
      result.current.openAddCard();
      result.current.setNewCardTitle('Hello');
    });

    expect(result.current.isAddingCard).toBe(true);
    expect(result.current.newCardTitle).toBe('Hello');

    act(() => {
      result.current.cancelAddCard();
    });

    expect(result.current.isAddingCard).toBe(false);
    expect(result.current.newCardTitle).toBe('');
  });

  it('clickOutside triggers cancelAddCard only when enabled', () => {
    const onAddCard = vi.fn();

    const { result } = renderHook(() => useAddCardComposer({ listId: 'list-1', onAddCard }));

    act(() => {
      result.current.openAddCard();
      result.current.setNewCardTitle('Hello');
    });

    const args = lastClickOutsideArgs();
    act(() => {
      args.onOutside();
    });

    expect(result.current.isAddingCard).toBe(false);
    expect(result.current.newCardTitle).toBe('');
  });

  it('submitAddCard does nothing for empty/whitespace title', async () => {
    const onAddCard = vi.fn();

    const { result } = renderHook(() => useAddCardComposer({ listId: 'list-1', onAddCard }));

    act(() => {
      result.current.openAddCard();
      result.current.setNewCardTitle('   ');
    });

    await act(async () => {
      await result.current.submitAddCard();
    });

    expect(onAddCard).not.toHaveBeenCalled();

    expect(result.current.isAddingCard).toBe(true);
    expect(result.current.newCardTitle).toBe('   ');
  });

  it('submitAddCard trims title, calls onAddCard(listId, title), then resets & closes', async () => {
    const onAddCard = vi.fn();

    const { result } = renderHook(() => useAddCardComposer({ listId: 'list-1', onAddCard }));

    act(() => {
      result.current.openAddCard();
      result.current.setNewCardTitle('  Hello  ');
    });

    await act(async () => {
      await result.current.submitAddCard();
    });

    expect(onAddCard).toHaveBeenCalledTimes(1);
    expect(onAddCard).toHaveBeenCalledWith('list-1', 'Hello');

    expect(result.current.newCardTitle).toBe('');
    expect(result.current.isAddingCard).toBe(false);
  });

  it('submitAddCard awaits async onAddCard before resetting', async () => {
    const steps: string[] = [];

    const onAddCard = vi.fn(async () => {
      steps.push('onAddCard-start');
      await Promise.resolve();
      steps.push('onAddCard-end');
    });

    const { result } = renderHook(() => useAddCardComposer({ listId: 'list-1', onAddCard }));

    act(() => {
      result.current.openAddCard();
      result.current.setNewCardTitle('X');
    });

    await act(async () => {
      steps.push('before-submit');
      const p = result.current.submitAddCard();
      steps.push('after-submit-called');
      await p;
      steps.push('after-await');
    });

    expect(steps).toEqual([
      'before-submit',
      'onAddCard-start',
      'after-submit-called',
      'onAddCard-end',
      'after-await',
    ]);

    expect(result.current.isAddingCard).toBe(false);
    expect(result.current.newCardTitle).toBe('');
  });

  it('passes stable refs array to useClickOutside (same instance across rerenders)', () => {
    const onAddCard = vi.fn();

    const { result, rerender } = renderHook(
      ({ listId }) => useAddCardComposer({ listId, onAddCard }),
      { initialProps: { listId: 'list-1' } },
    );

    const firstArgs = lastClickOutsideArgs();
    const firstRefs = firstArgs.refs;

    rerender({ listId: 'list-1' });

    const secondArgs = lastClickOutsideArgs();
    const secondRefs = secondArgs.refs;

    expect(secondRefs).toBe(firstRefs);

    expect(result.current.listRef).toBe(firstRefs[0]);
  });
});
