import { useEffect } from 'react';

export function useClickOutside({
  enabled,
  refs,
  onOutside,
  capture = true,
}: {
  enabled: boolean;
  refs: Array<React.RefObject<HTMLElement | null>>;
  onOutside: () => void;
  capture?: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;

    const opts: AddEventListenerOptions = { capture };

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;

      const clickedInside = refs.some((r) => {
        const el = r.current;
        return !!el && el.contains(target);
      });

      if (!clickedInside) onOutside();
    }

    window.addEventListener('pointerdown', onPointerDown, opts);
    return () => window.removeEventListener('pointerdown', onPointerDown, opts);
  }, [enabled, refs, onOutside, capture]);
}
