import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import TopBar from '../../components/TopBar/TopBar';
import SideMenu from '../../components/SideMenu/SideMenu';
import CreateBoardModal from '@/components/CreateBoardModal/CreateBoardModal';

import styles from './BoardsPage.module.css';
import { getBoardBackgroundStyle, useBoards } from '@/hooks/useBoards';

export default function BoardsPage() {
  const navigate = useNavigate();

  const { boards, loading, createBoard } = useBoards();

  const [createOpen, setCreateOpen] = useState(false);

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
    <div className={styles.page}>
      <TopBar />
      <div className={styles.shell}>
        <SideMenu />

        <main className={styles.main}>
          <div className={styles.grid} aria-busy={loading}>
            {boards.map((b) => {
              const style = getBoardBackgroundStyle(b);

              return (
                <button
                  key={b.id}
                  type="button"
                  className={styles.card}
                  onClick={() => navigate(`/boards/${b.id}`)}
                >
                  <div className={styles.preview} style={style} />
                  <div className={styles.titleBar}>
                    <span className={styles.title}>{b.title}</span>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              className={`${styles.card} ${styles.createCard}`}
              onClick={() => setCreateOpen(true)}
              aria-label="Create new board"
            >
              <div className={styles.createInner}>Create new board</div>
            </button>
          </div>
        </main>

        <CreateBoardModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreateBoard}
        />
      </div>
    </div>
  );
}
