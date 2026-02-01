import { useEffect, useRef, useState } from 'react';
import styles from './CardModal.module.css';
import type { CardModel } from '../BoardCard/BoardCard';
import EditableText from '../EditableText/EditableText';
import { TagIcon, CalendarIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';

function IconDots() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <circle cx="6" cy="12" r="1.7" fill="#fff" />
      <circle cx="12" cy="12" r="1.7" fill="#fff" />
      <circle cx="18" cy="12" r="1.7" fill="#fff" />
    </svg>
  );
}

export default function CardModal({
  card,
  onClose,
  onRename,
  onDeleteCard,
}: {
  card: CardModel;
  onClose: () => void;
  onRename: (nextTitle: string) => void;
  onDeleteCard: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    requestAnimationFrame(() => dialogRef.current?.focus());
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const opts: AddEventListenerOptions = { capture: true };

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const wrapperEl = menuWrapperRef.current;
      const clickedInWrapper = !!wrapperEl && wrapperEl.contains(target);
      if (!clickedInWrapper) setMenuOpen(false);
    }

    window.addEventListener('pointerdown', onPointerDown, opts);
    return () => window.removeEventListener('pointerdown', onPointerDown, opts);
  }, [menuOpen]);

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
          <EditableText
            value={card.title}
            ariaLabel="Edit card title"
            className={styles.cardTitleButton}
            inputClassName={styles.cardTitleInput}
            onChange={onRename}
          />

          <div className={styles.headerActions}>
            <div className={styles.cardMenuWrapper} ref={menuWrapperRef}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Card menu"
                title="Card menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <IconDots />
              </button>

              {menuOpen && (
                <div className={styles.cardMenu}>
                  <button
                    type="button"
                    className={styles.cardMenuItemDanger}
                    onClick={() => {
                      setMenuOpen(false);
                      onDeleteCard();
                    }}
                  >
                    Delete card
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className={styles.iconBtn}
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className={styles.quickActions}>
          <button className={styles.quickActionBtn} type="button">
            <TagIcon className={styles.quickActionIcon} />
            Labels
          </button>

          <button className={styles.quickActionBtn} type="button">
            <CalendarIcon className={styles.quickActionIcon} />
            Dates
          </button>

          <button className={styles.quickActionBtn} type="button">
            <CheckCircleIcon className={styles.quickActionIcon} />
            Checklist
          </button>

          <button className={styles.quickActionBtn} type="button">
            <UserIcon className={styles.quickActionIcon} />
            Members
          </button>
        </div>

        <div className={styles.content}>
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
                <span className={styles.metaValue}>
                  {new Date(card.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
