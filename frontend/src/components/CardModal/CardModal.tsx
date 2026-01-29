import { useEffect, useRef } from 'react';
import styles from './CardModal.module.css';
import type { CardModel } from '../BoardCard/BoardCard';

export default function CardModal({ card, onClose }: { card: CardModel; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    // focus modal container for accessibility
    requestAnimationFrame(() => dialogRef.current?.focus());
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`Card details: ${card.title}`}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className={styles.header}>
          <div className={styles.title}>{card.title}</div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.sectionTitle}>Description</div>
          {card.description ? (
            <div className={styles.description}>{card.description}</div>
          ) : (
            <div className={styles.empty}>No description</div>
          )}

          <div className={styles.meta}>
            <div>
              <span className={styles.metaLabel}>Created</span>
              <span className={styles.metaValue}>{new Date(card.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
