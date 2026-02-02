import { useEffect, useRef } from 'react';
import styles from './AddCardComposer.module.css';

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

export default function AddCardComposer({
  open,
  value,
  onOpen,
  onChange,
  onCancel,
  onSubmit,
  showActions = true,
}: {
  open: boolean;
  value: string;
  onOpen: () => void;
  onChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  showActions?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) {
    return (
      <button type="button" className={styles.addCardBtn} onClick={onOpen}>
        + <span>Add a card</span>
      </button>
    );
  }

  return (
    <div className={styles.addCardComposer}>
      <input
        ref={inputRef}
        className={styles.addCardInput}
        placeholder="Enter a title for this card..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        aria-label="Card title"
      />

      {showActions ? (
        <div className={styles.addCardActions}>
          <button type="button" className={styles.addCardPrimary} onClick={onSubmit}>
            Add card
          </button>

          <button
            type="button"
            className={styles.addCardCancel}
            onClick={onCancel}
            aria-label="Cancel"
          >
            <IconX />
          </button>
        </div>
      ) : null}
    </div>
  );
}
