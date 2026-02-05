import { useMemo, useRef, useState } from 'react';
import { useClickOutside } from './useClickOutside';

export function useListMenu() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useClickOutside({
    enabled: open,
    refs: useMemo(() => [wrapperRef], []),
    onOutside: () => setOpen(false),
    capture: true,
  });

  return {
    menuOpen: open,
    setMenuOpen: setOpen,
    menuWrapperRef: wrapperRef,
  };
}
