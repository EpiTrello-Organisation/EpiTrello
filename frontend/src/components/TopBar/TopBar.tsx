import { Link } from 'react-router-dom';
import styles from './TopBar.module.css';

function TrelloMark() {
  return (
    <svg className={styles.trelloIcon} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <rect x="7" y="7" width="4.5" height="9" rx="1.2" className={styles.trelloIconInner} />
      <rect x="12.5" y="7" width="4.5" height="6.5" rx="1.2" className={styles.trelloIconInner} />
    </svg>
  );
}

export default function TopBar() {
  return (
    <header className={styles.bar}>
      <Link to="/boards" className={styles.trelloButton} aria-label="Go to boards">
        <TrelloMark />
        <span className={styles.trelloText}>EpiTrello</span>
      </Link>

      <div className={styles.center}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search"
          aria-label="Search boards"
        />
        <button type="button" className={styles.createButton}>
          Create
        </button>
      </div>

      <button type="button" className={styles.profileButton} aria-label="Profile">
        <span className={styles.avatar} />
      </button>
    </header>
  );
}
