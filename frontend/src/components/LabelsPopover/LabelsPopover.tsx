import { useEffect, useMemo, useRef } from 'react';
import styles from './LabelsPopover.module.css';

import { XMarkIcon } from '@heroicons/react/24/outline';

export type LabelItem = {
  id: number;
  color: string;
};

export default function LabelsPopover({
  open,
  anchorRef,
  onClose,
  labels,
  selectedIds,
  onToggle,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;

  labels: LabelItem[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const selectedSet = useMemo(() => new Set<number>(selectedIds ?? []), [selectedIds]);

  useEffect(() => {
    if (!open) return;

    const opts: AddEventListenerOptions = { capture: true };

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;

      const anchorEl = anchorRef.current;
      const popoverEl = popoverRef.current;

      const clickedInAnchor = !!anchorEl && anchorEl.contains(target);
      const clickedInPopover = !!popoverEl && popoverEl.contains(target);

      if (!clickedInAnchor && !clickedInPopover) onClose();
    }

    window.addEventListener('pointerdown', onPointerDown, opts);
    return () => window.removeEventListener('pointerdown', onPointerDown, opts);
  }, [open, anchorRef, onClose]);

  if (!open) return null;

  return (
    <div className={styles.popover} ref={popoverRef} role="dialog" aria-label="Labels">
      <div className={styles.header}>
        <div className={styles.title}>Labels</div>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close labels"
          title="Close"
        >
          <XMarkIcon className={styles.closeIcon} />
        </button>
      </div>

      <div className={styles.list}>
        {labels.map((l) => {
          const checked = selectedSet.has(l.id);

          return (
            <div className={styles.row} key={l.id}>
              <label className={styles.check}>
                <input type="checkbox" checked={checked} onChange={() => onToggle(l.id)} />
                <span className={styles.customBox} aria-hidden="true" />
              </label>

              <button
                type="button"
                className={styles.colorBtn}
                style={{ background: l.color }}
                title={`Label ${l.id}`}
                onClick={() => onToggle(l.id)}
                aria-label={`Toggle label ${l.id}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
