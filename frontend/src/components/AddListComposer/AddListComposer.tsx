import { useEffect, useRef } from 'react';
import styles from './AddListComposer.module.css';

function IconX() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path
        d="M7 7l10 10M17 7L7 17"
        fill="none"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AddListComposer({
  open,
  value,
  onOpen,
  onChange,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  value: string;
  onOpen: () => void;
  onChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const opts: AddEventListenerOptions = { capture: true };

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const el = wrapperRef.current;

      if (el && !el.contains(target)) onCancel();
    }

    window.addEventListener('pointerdown', onPointerDown, opts);
    return () => window.removeEventListener('pointerdown', onPointerDown, opts);
  }, [open, onCancel]);

  return (
    <div ref={wrapperRef}>
      {!open ? (
        <button type="button" className={styles.addListBtn} onClick={onOpen}>
          + <span>Add another list</span>
        </button>
      ) : (
        <div className={styles.addListComposer}>
          <input
            ref={inputRef}
            className={styles.addListInput}
            placeholder="Enter list name..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit();
              if (e.key === 'Escape') onCancel();
            }}
            aria-label="List name"
          />

          <div className={styles.addListActions}>
            <button type="button" className={styles.addListPrimary} onClick={onSubmit}>
              Add list
            </button>

            <button
              type="button"
              className={styles.addListCancel}
              onClick={onCancel}
              aria-label="Cancel"
            >
              <IconX />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
