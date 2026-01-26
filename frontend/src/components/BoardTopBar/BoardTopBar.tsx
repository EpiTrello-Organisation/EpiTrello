import styles from './BoardTopBar.module.css';
import EditableText from '../EditableText/EditableText';

export default function BoardTopBar({
  title,
  onRename,
}: {
  title: string;
  onRename: (nextTitle: string) => void;
}) {
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
              strokeWidth="1.8"
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
              strokeWidth="1.8"
            />
            <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>

        <button type="button" className={styles.shareBtn} aria-label="Share">
          Share
        </button>

        <button type="button" className={styles.topbarIconBtn} aria-label="Board menu" title="Board menu">
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
            <circle cx="6" cy="12" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="18" cy="12" r="1.7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
