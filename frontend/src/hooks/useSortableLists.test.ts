import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSortableLists } from './useSortableLists';
import type { ListModel } from '@/components/BoardList/BoardList';

vi.mock('@dnd-kit/core', () => {
  const useSensor = vi.fn((Sensor: any, options: any) => ({ Sensor, options }));
  const useSensors = vi.fn((...sensors: any[]) => sensors);

  class PointerSensor {}
  class KeyboardSensor {}

  return { useSensor, useSensors, PointerSensor, KeyboardSensor };
});

vi.mock('@dnd-kit/sortable', () => {
  const arrayMove = vi.fn((arr: any[], from: number, to: number) => {
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  });

  const sortableKeyboardCoordinates = vi.fn();

  return { arrayMove, sortableKeyboardCoordinates };
});

import { useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

function makeLists(): ListModel[] {
  return [
    { id: 'l1', title: 'L1' } as any,
    { id: 'l2', title: 'L2' } as any,
    { id: 'l3', title: 'L3' } as any,
  ];
}

function dragEndEvent(activeId: any, overId?: any) {
  return {
    active: { id: activeId },
    over: overId === undefined ? null : { id: overId },
  } as any;
}

describe('hooks/useSortableLists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates sensors with expected configuration', () => {
    const lists = makeLists();
    const onReorder = vi.fn();

    const { result } = renderHook(() => useSortableLists({ lists, onReorder }));

    expect(result.current.sensors).toHaveLength(2);

    expect(useSensor).toHaveBeenCalledTimes(2);

    expect(useSensor).toHaveBeenNthCalledWith(1, PointerSensor, {
      activationConstraint: { distance: 8 },
    });

    expect(useSensor).toHaveBeenNthCalledWith(2, KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    });

    expect(useSensors).toHaveBeenCalledTimes(1);
  });

  it('onDragEnd no-ops when over is missing', () => {
    const lists = makeLists();
    const onReorder = vi.fn();
    const { result } = renderHook(() => useSortableLists({ lists, onReorder }));

    result.current.onDragEnd(dragEndEvent('l1'));

    expect(onReorder).not.toHaveBeenCalled();
    expect(arrayMove).not.toHaveBeenCalled();
  });

  it('onDragEnd no-ops when active.id === over.id', () => {
    const lists = makeLists();
    const onReorder = vi.fn();
    const { result } = renderHook(() => useSortableLists({ lists, onReorder }));

    result.current.onDragEnd(dragEndEvent('l2', 'l2'));

    expect(onReorder).not.toHaveBeenCalled();
    expect(arrayMove).not.toHaveBeenCalled();
  });

  it('onDragEnd no-ops when active or over id is not found in lists', () => {
    const lists = makeLists();
    const onReorder = vi.fn();
    const { result } = renderHook(() => useSortableLists({ lists, onReorder }));

    result.current.onDragEnd(dragEndEvent('missing', 'l2'));
    result.current.onDragEnd(dragEndEvent('l1', 'missing'));

    expect(onReorder).not.toHaveBeenCalled();
    expect(arrayMove).not.toHaveBeenCalled();
  });

  it('onDragEnd calls arrayMove and onReorder with reordered lists', () => {
    const lists = makeLists();
    const onReorder = vi.fn();
    const { result } = renderHook(() => useSortableLists({ lists, onReorder }));

    result.current.onDragEnd(dragEndEvent('l1', 'l3'));

    expect(arrayMove).toHaveBeenCalledTimes(1);
    expect(arrayMove).toHaveBeenCalledWith(lists, 0, 2);

    expect(onReorder).toHaveBeenCalledTimes(1);
    const next = onReorder.mock.calls[0][0] as ListModel[];
    expect(next.map((l) => l.id)).toEqual(['l2', 'l3', 'l1']);
  });

  it('casts ids to string when searching (numeric ids still work)', () => {
    const lists: ListModel[] = [{ id: '1', title: 'A' } as any, { id: '2', title: 'B' } as any];

    const onReorder = vi.fn();
    const { result } = renderHook(() => useSortableLists({ lists, onReorder }));

    result.current.onDragEnd(dragEndEvent(1, 2));

    expect(onReorder).toHaveBeenCalledTimes(1);
    expect((onReorder.mock.calls[0][0] as ListModel[]).map((l) => l.id)).toEqual(['2', '1']);
  });
});
