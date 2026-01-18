import { useEffect, useState } from 'react';
import { apiFetch } from '@/api/fetcher';

import TopBar from '../../components/TopBar/TopBar';
import SideMenu from '../../components/SideMenu/SideMenu';
import styles from './BoardsPage.module.css';
import CreateBoardModal from '@/components/CreateBoardModal/CreateBoardModal';

type Board = {
  id: string;
  title: string;
  // optionnel : si ton API fournit une image/cover
  backgroundUrl?: string | null;
  background_url?: string | null; // tolérance snake_case si backend python
};

function getBoardBackgroundUrl(board: Board): string | null {
  return board.backgroundUrl ?? board.background_url ?? null;
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBoards() {
      try {
        const res = await apiFetch('/api/boards');
        const data = (await res.json()) as Board[];

        if (!cancelled) setBoards(Array.isArray(data) ? data : []);
      } catch {
        // 401 est déjà géré dans apiFetch (logout + redirect /login)
        // ici on ne fait rien
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBoards();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleCreateClick() {
    setCreateOpen(true);
  }

  return (
    <div className={styles.page}>
      <TopBar />
      <div className={styles.shell}>
        <SideMenu />

        <main className={styles.main}>
          <div className={styles.grid} aria-busy={loading}>
            {boards.map((b) => {
              const bg = getBoardBackgroundUrl(b);

              return (
                <button
                  key={b.id}
                  type="button"
                  className={styles.card}
                  // plus tard: navigate(`/boards/${b.id}`)
                  onClick={() => {}}
                >
                  <div
                    className={styles.preview}
                    style={bg ? { backgroundImage: `url(${bg})` } : undefined}
                  />
                  <div className={styles.titleBar}>
                    <span className={styles.title}>{b.title}</span>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              className={`${styles.card} ${styles.createCard}`}
              onClick={handleCreateClick}
              aria-label="Create new board"
            >
              <div className={styles.createInner}>Create new board</div>
            </button>
          </div>
        </main>
        <CreateBoardModal open={createOpen} onClose={() => setCreateOpen(false)} />
      </div>
    </div>
  );
}
