import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '@/api/fetcher';

import TopBar from '../../components/TopBar/TopBar';
import styles from './BoardPage.module.css';

type Board = {
  id: string;
  title: string;
  background?: {
    type: 'image' | 'gradient';
    value: string;
  };
};

export default function BoardPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState<Board | null>(null);

  useEffect(() => {
    async function loadBoard() {
      const res = await apiFetch(`/api/boards/${boardId}`);
      const data = await res.json();
      setBoard(data);
    }

    loadBoard();
  }, [boardId]);

  return (
    <div className={styles.page}>
      <TopBar />

      <main
        className={styles.main}
        style={
          board?.background
            ? board.background.type === 'image'
              ? { backgroundImage: `url(${board.background.value})` }
              : { backgroundImage: board.background.value }
            : undefined
        }
      >
        {/* Kanban viendra ici plus tard */}
      </main>
    </div>
  );
}
