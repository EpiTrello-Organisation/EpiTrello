import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { logout } from '@/auth/token';
import styles from './TopBar.module.css';
import { UserIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/theme/ThemeProvider';
import { getBoardBackgroundStyle, useBoards } from '@/hooks/useBoards';
import CreateBoardModal from '@/components/CreateBoardModal/CreateBoardModal';

function TrelloMark() {
  return (
    <svg className={styles.trelloIcon} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <rect x="7" y="7" width="4.5" height="9" rx="1.2" className={styles.trelloIconInner} />
      <rect x="12.5" y="7" width="4.5" height="6.5" rx="1.2" className={styles.trelloIconInner} />
    </svg>
  );
}

function normalizeQuery(v: string) {
  return v.trim().toLowerCase();
}

export default function TopBar() {
  const navigate = useNavigate();
  const { preference, setPreference } = useTheme();

  const { boards, createBoard } = useBoards();

  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const themeRef = useRef<HTMLDivElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!searchOpen) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const wrap = searchWrapRef.current;
      if (wrap && wrap.contains(target)) return;
      setSearchOpen(false);
    }

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [searchOpen]);

  function pickTheme(next: 'light' | 'dark' | 'system') {
    setPreference(next);
    setThemeOpen(false);
    setMenuOpen(false);
  }

  const results = useMemo(() => {
    const query = normalizeQuery(q);
    if (!query) return [];
    return boards
      .filter((b) => normalizeQuery(b.title).includes(query))
      .slice(0, 8);
  }, [boards, q]);

  function openBoard(id: string) {
    setSearchOpen(false);
    setQ('');
    navigate(`/boards/${id}`);
  }

  async function handleCreateBoard(payload: {
    title: string;
    background_kind: 'gradient' | 'unsplash';
    background_value: string;
    background_thumb_url?: string | null;
  }) {
    const created = await createBoard(payload);
    setCreateOpen(false);
    navigate(`/boards/${created.id}`);
  }

  return (
    <>
      <header className={styles.bar}>
        <Link to="/boards" className={styles.trelloButton} aria-label="Go to boards">
          <TrelloMark />
          <span className={styles.trelloText}>EpiTrello</span>
        </Link>

        <div className={styles.center}>
          <div className={styles.searchWrap} ref={searchWrapRef}>
            <input
              className={styles.search}
              type="search"
              placeholder="Search"
              aria-label="Search boards"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchOpen(false);
                if (e.key === 'Enter' && results.length > 0) {
                  openBoard(results[0].id);
                }
              }}
            />

            {searchOpen && q.trim().length > 0 && (
              <div className={styles.searchResults}>
                {results.length === 0 ? (
                  <div className={styles.searchEmpty}>No results</div>
                ) : (
                  results.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={styles.searchItem}
                      onClick={() => openBoard(b.id)}
                    >
                      <div
                        className={styles.searchThumb}
                        style={getBoardBackgroundStyle(b)}
                      />
                      <div className={styles.searchName}>{b.title}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.createButton}
            onClick={() => setCreateOpen(true)}
          >
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
            <UserIcon className={styles.avatarIcon} aria-hidden="true" />
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
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => pickTheme('light')}
                    aria-pressed={preference === 'light'}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => pickTheme('dark')}
                    aria-pressed={preference === 'dark'}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => pickTheme('system')}
                    aria-pressed={preference === 'system'}
                  >
                    Match system
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <CreateBoardModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateBoard}
      />
    </>
  );
}
