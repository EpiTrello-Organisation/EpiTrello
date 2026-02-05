import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSortableLists } from './useSortableLists';
import type { ListModel } from '@/components/BoardList/BoardList';

const useSensorMock = vi.fn();
const useSensorsMock = vi.fn();

vi.mock('@dnd-kit/core', () => {
  class PointerSensor {}
  class KeyboardSensor {}
  return {
    PointerSensor,
    KeyboardSensor,
    useSensor: (...args: any[]) => useSensorMock(...args),
    useSensors: (...args: any[]) => useSensorsMock(...args),
  };
});

const arrayMoveMock = vi.fn();
const sortableKeyboardCoordinatesMock = vi.fn();

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: (...args: any[]) => arrayMoveMock(...args),
  sortableKeyboardCoordinates: (...args: any[]) => sortableKeyboardCoordinatesMock(...args),
}));

function makeLists(): ListModel[] {
  return [
    { id: 'l1', title: 'L1' } as any,
    { id: 'l2', title: 'L2' } as any,
    { id: 'l3', title: 'L3' } as any,
  ];
}

function dragEndEvent(activeId: string, overId?: string) {
  return {
    active: { id: activeId },
    over: overId ? { id: overId } : null,
  } as any;
}

describe('hooks/useSortableLists', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    useSensorMock.mockImplementation((Sensor: any, options: any) => ({ Sensor, options }));
    useSensorsMock.mockImplementation((...sensors: any[]) => sensors);
    arrayMoveMock.mockImplementation((arr: any[], from: number, to: number) => {
      const copy = [...arr];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  });

  it('creates sensors with expected configuration', () => {
    const lists = makeLists();
    const onReorder = vi.fn();

    const { result } = renderHook(() => useSortableLists({ lists, onReorder }));

    expect(result.current.sensors).toHaveLength(2);

    expect(useSensorMock).toHaveBeenCalledTimes(2);

    const first = useSensorMock.mock.calls[0];
    const second = useSensorMock.mock.calls[1];

    expect(first[1]).toEqual({ activationConstraint: { distance: 8 } });

    expect(second[1]).toEqual({ coordinateGetter: sortableKeyboardCoordinatesMock });
  });

  it('onDragEnd no-ops when over is missing', () => {
    const lists = makeLists();
    const onReorder = vi.fn();
    const { result } = renderHook(() => useSortableLists({ lists, onReorder }));

    result.current.onDragEnd(dragEndEvent('l1'));

    expect(onReorder).not.toHaveBeenCalled();
    expect(arrayMoveMock).not.toHaveBeenCalled();
  });

  it('onDragEnd no-ops when active.id === over.id', () => {
    const lists = makeLists();
    const onReorder = vi.fn();
    const { result } = renderHook(() => useSortableLists({ lists, onReorder }));

    result.current.onDragEnd(dragEndEvent('l2', 'l2'));

    expect(onReorder).not.toHaveBeenCalled();
    expect(arrayMoveMock).not.toHaveBeenCalled();
  });

  it('onDragEnd no-ops when active or over id is not found in lists', () => {
    const lists = makeLists();
    const onReorder = vi.fn();
    const { result } = renderHook(() => useSortableLists({ lists, onReorder }));

    result.current.onDragEnd(dragEndEvent('missing', 'l2'));
    result.current.onDragEnd(dragEndEvent('l1', 'missing'));

    expect(onReorder).not.toHaveBeenCalled();
    expect(arrayMoveMock).not.toHaveBeenCalled();
  });

  it('onDragEnd calls arrayMove and onReorder with reordered lists', () => {
    const lists = makeLists();
    const onReorder = vi.fn();
    const { result } = renderHook(() => useSortableLists({ lists, onReorder }));

    result.current.onDragEnd(dragEndEvent('l1', 'l3'));

    expect(arrayMoveMock).toHaveBeenCalledTimes(1);
    expect(arrayMoveMock).toHaveBeenCalledWith(lists, 0, 2);

    expect(onReorder).toHaveBeenCalledTimes(1);
    const nextArg = onReorder.mock.calls[0][0] as ListModel[];
    expect(nextArg.map((l) => l.id)).toEqual(['l2', 'l3', 'l1']);
  });

  it('casts ids to string when searching (numeric ids still work)', () => {
    const lists: ListModel[] = [{ id: '1', title: 'A' } as any, { id: '2', title: 'B' } as any];
    const onReorder = vi.fn();
    const { result } = renderHook(() => useSortableLists({ lists, onReorder }));

    result.current.onDragEnd({
      active: { id: 1 },
      over: { id: 2 },
    } as any);

    expect(onReorder).toHaveBeenCalledTimes(1);
    expect((onReorder.mock.calls[0][0] as ListModel[]).map((l) => l.id)).toEqual(['2', '1']);
  });
});
