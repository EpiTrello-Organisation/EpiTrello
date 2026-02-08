import { useEffect, useRef, useState } from 'react';
import styles from './BoardTopBar.module.css';
import EditableText from '../EditableText/EditableText';

export default function BoardTopBar({
  title,
  onRename,
  onDeleteBoard,
}: {
  title: string;
  onRename: (nextTitle: string) => void;
  onDeleteBoard: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const wrapperEl = menuWrapperRef.current;
      const clickedInWrapper = !!wrapperEl && wrapperEl.contains(target);

      if (!clickedInWrapper) setMenuOpen(false);
    }

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  return (
    <div className={styles.boardTopBar}>
      <EditableText
        value={title}
        ariaLabel="Edit board title"
        className={styles.boardNameButton}
        inputClassName={styles.boardNameInput}
        onChange={onRename}
      />

      <div className={styles.boardTopBarRight}>
        <div className={styles.avatars} aria-label="Board members">
          <div className={styles.avatar} title="Member A">
            A
          </div>
          <div className={styles.avatar} title="Member B">
            B
          </div>
          <div className={styles.avatar} title="Member C">
            C
          </div>
        </div>

        <button type="button" className={styles.topbarIconBtn} aria-label="Filter" title="Filter">
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
            <path
              d="M4 6h16M7 12h10M10 18h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.0"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <button
          type="button"
          className={styles.topbarIconBtn}
          aria-label="Change visibility"
          title="Visibility"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
            <path
              d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.0"
            />
            <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="2.0" />
          </svg>
        </button>

        <button type="button" className={styles.shareBtn} aria-label="Share">
          + Share
        </button>

        <div className={styles.boardMenuWrapper} ref={menuWrapperRef}>
          <button
            type="button"
            className={styles.topbarIconBtn}
            aria-label="Board menu"
            title="Board menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
              <circle cx="6" cy="12" r="1.7" fill="#fff" />
              <circle cx="12" cy="12" r="1.7" fill="#fff" />
              <circle cx="18" cy="12" r="1.7" fill="#fff" />
            </svg>
          </button>

          {menuOpen && (
            <div className={styles.boardMenu}>
              <button
                type="button"
                className={styles.boardMenuItemDanger}
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteBoard();
                }}
              >
                Delete Board
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
