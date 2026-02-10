import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import TopBar from '../../components/TopBar/TopBar';
import SideMenu from '../../components/SideMenu/SideMenu';

import styles from './OtherBoardsPage.module.css';
import { getBoardBackgroundStyle, useBoards } from '@/hooks/useBoards';
import { apiFetch } from '@/api/fetcher';

type MeResponse = {
  id: string;
};

export default function OtherBoardsPage() {
  const navigate = useNavigate();

  const { boards, loading } = useBoards();
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch('/api/users/me');
        if (!res.ok) return;
        const data = (await res.json()) as MeResponse;
        if (!cancelled) setMeId(data.id);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const memberBoards = useMemo(() => {
    if (!meId) return [];
    return boards.filter((b) => b.owner_id !== meId);
  }, [boards, meId]);

  return (
    <div className={styles.page}>
      <TopBar />
      <div className={styles.shell}>
        <SideMenu />

        <main className={styles.main}>
          {!loading && memberBoards.length === 0 ? (
            <div className={styles.empty}>Nobody has invited you to any of their boards yet.</div>
          ) : (
            <div className={styles.grid} aria-busy={loading}>
              {memberBoards.map((b) => {
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
