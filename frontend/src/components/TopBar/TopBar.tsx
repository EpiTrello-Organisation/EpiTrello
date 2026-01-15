import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { logout } from '@/auth/token';
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
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const themeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;

      const wrapperEl = wrapperRef.current;
      const themeEl = themeRef.current;

      const clickedInWrapper = !!wrapperEl && wrapperEl.contains(target);
      const clickedInTheme = !!themeEl && themeEl.contains(target);

      if (!clickedInWrapper && !clickedInTheme) {
        setMenuOpen(false);
        setThemeOpen(false);
      }
    }

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

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

      <div className={styles.profileWrapper} ref={wrapperRef}>
        <button
          type="button"
          className={styles.profileButton}
          aria-label="Profile"
          onClick={() => {
            setMenuOpen((v) => !v);
            setThemeOpen(false);
          }}
        >
          <span className={styles.avatar} />
        </button>

        {menuOpen && (
          <div className={styles.profileMenu}>
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => setThemeOpen((v) => !v)}
            >
              Theme
            </button>

            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Log Out
            </button>

            {themeOpen && (
              <div className={styles.themeMenu} ref={themeRef}>
                <button type="button" className={styles.menuItem}>
                  Light
                </button>
                <button type="button" className={styles.menuItem}>
                  Dark
                </button>
                <button type="button" className={styles.menuItem}>
                  Match system
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
