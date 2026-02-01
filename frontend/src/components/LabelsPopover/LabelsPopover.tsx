import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './LabelsPopover.module.css';

import { PencilSquareIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export type LabelItem = {
  id: string;
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

  selectedIds: string[];

  onToggle: (id: string) => void;
}) {
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const [labelQuery, setLabelQuery] = useState('');

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filteredLabels = useMemo(() => {
    const q = labelQuery.trim().toLowerCase();
    if (!q) return labels;

    return labels.filter((l) => l.id.toLowerCase().includes(q));
  }, [labels, labelQuery]);

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

      <div className={styles.searchRow}>
        <MagnifyingGlassIcon className={styles.searchIcon} />
        <input
          className={styles.search}
          value={labelQuery}
          onChange={(e) => setLabelQuery(e.target.value)}
          placeholder="Search labels..."
          aria-label="Search labels"
        />
      </div>

      <div className={styles.sectionTitle}>Labels</div>

      <div className={styles.list}>
        {filteredLabels.map((l) => {
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
                title={l.id}
                onClick={() => onToggle(l.id)}
                aria-label={`Toggle ${l.id}`}
              />

              <button type="button" className={styles.editBtn} aria-label={`Edit ${l.id}`}>
                <PencilSquareIcon className={styles.editIcon} />
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.footerBtn}>
          Create a new label
        </button>
        <button type="button" className={styles.footerBtn}>
          Enable colorblind friendly mode
        </button>
      </div>
    </div>
  );
}
