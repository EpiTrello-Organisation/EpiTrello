import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSortableStyle } from './useSortableStyle';

const dnd = vi.hoisted(() => {
  return {
    useSortable: vi.fn(),
    toString: vi.fn(),
  };
});

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: dnd.useSortable,
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: dnd.toString,
    },
  },
}));

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

describe('hooks/useSortableStyle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls useSortable with {id} and forwards bindings', () => {
    const attrs = { role: 'button' };
    const listeners = { onPointerDown: vi.fn() };
    const setNodeRef = vi.fn();
    const setActivatorNodeRef = vi.fn();

    dnd.useSortable.mockReturnValueOnce({
      attributes: attrs,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform: null,
      transition: undefined,
      isDragging: false,
    });

    dnd.toString.mockReturnValueOnce('');

    const { result } = renderHook(() => useSortableStyle('x'));

    expect(useSortable).toHaveBeenCalledTimes(1);
    expect(useSortable).toHaveBeenCalledWith({ id: 'x' });

    expect(result.current.attributes).toBe(attrs);
    expect(result.current.listeners).toBe(listeners);
    expect(result.current.setNodeRef).toBe(setNodeRef);
    expect(result.current.setActivatorNodeRef).toBe(setActivatorNodeRef);
  });

  it('builds style: uses CSS.Transform.toString(transform) and passes transition', () => {
    dnd.useSortable.mockReturnValueOnce({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      setActivatorNodeRef: vi.fn(),
      transform: { x: 10, y: 20, scaleX: 2, scaleY: 3 },
      transition: 'transform 200ms ease',
      isDragging: false,
    });

    dnd.toString.mockReturnValueOnce('tx');

    const { result } = renderHook(() => useSortableStyle('l1'));

    expect(CSS.Transform.toString).toHaveBeenCalledTimes(1);
    expect(CSS.Transform.toString).toHaveBeenCalledWith({
      x: 10,
      y: 20,
      scaleX: 2,
      scaleY: 3,
    });

    expect(result.current.style).toEqual({
      transform: 'tx',
      transition: 'transform 200ms ease',
      opacity: undefined,
    });
  });

  it('when dragging + transform, forces scaleX/scaleY = 1 before toString()', () => {
    dnd.useSortable.mockReturnValueOnce({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      setActivatorNodeRef: vi.fn(),
      transform: { x: 5, y: 6, scaleX: 0.5, scaleY: 0.5 },
      transition: 't',
      isDragging: true,
    });

    dnd.toString.mockReturnValueOnce('dragTx');

    const { result } = renderHook(() => useSortableStyle('l1'));

    expect(CSS.Transform.toString).toHaveBeenCalledTimes(1);
    expect(CSS.Transform.toString).toHaveBeenCalledWith({
      x: 5,
      y: 6,
      scaleX: 1,
      scaleY: 1,
    });

    expect(result.current.style.transform).toBe('dragTx');
    expect(result.current.style.transition).toBe('t');
    expect(result.current.style.opacity).toBe(0.85);
  });

  it('when dragging but transform is null, passes null to toString and still sets opacity', () => {
    dnd.useSortable.mockReturnValueOnce({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      setActivatorNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: true,
    });

    dnd.toString.mockReturnValueOnce('');

    const { result } = renderHook(() => useSortableStyle('l1'));

    expect(CSS.Transform.toString).toHaveBeenCalledWith(null);
    expect(result.current.style.opacity).toBe(0.85);
  });
});
