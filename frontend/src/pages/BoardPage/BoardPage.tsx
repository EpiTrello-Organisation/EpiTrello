import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '@/api/fetcher';

import TopBar from '../../components/TopBar/TopBar';
import styles from './BoardPage.module.css';
import BoardList, { type ListModel } from '../../components/BoardList/BoardList';
import AddListComposer from '../../components/AddListComposer/AddListComposer';

type Board = {
  id: string;
  title: string;
};

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function BoardPage() {
  const { boardId } = useParams();

  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<ListModel[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadBoard() {
      if (!boardId) return;
      try {
        const res = await apiFetch(`/api/boards/${boardId}`);
        const data = (await res.json()) as Board;
        if (!cancelled) setBoard(data);
      } catch {
        // 401 handled in fetcher
      }
    }

    loadBoard();
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  useEffect(() => {
    let cancelled = false;

    async function loadLists() {
      if (!boardId) return;

      setLoadingLists(true);
      try {
        const res = await apiFetch(`/api/lists/board/${boardId}`);
        const data = (await res.json()) as ListModel[];
        if (!cancelled) setLists(Array.isArray(data) ? data : []);
      } catch {
        // 401 handled in fetcher
      } finally {
        if (!cancelled) setLoadingLists(false);
      }
    }

    loadLists();
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  function renameList(listId: string, nextTitle: string) {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, title: nextTitle } : l)));
  }

  function openAddList() {
    setIsAddingList(true);
  }

  function cancelAddList() {
    setIsAddingList(false);
    setNewListTitle('');
  }

  function submitAddList() {
    const title = newListTitle.trim();
    if (!title) return;

    setLists((prev) => [...prev, { id: uid(), title }]);

    setNewListTitle('');
    setIsAddingList(false);
  }

  return (
    <div className={styles.page}>
      <TopBar />

      <div className={styles.boardTopBar}>
        <div className={styles.boardName}>{board?.title ?? 'Board'}</div>
      </div>

      <main className={styles.kanban} aria-busy={loadingLists}>
        <div className={styles.listsRow}>
          {lists.map((list) => (
            <BoardList key={list.id} list={list} onRename={renameList} />
          ))}

          <AddListComposer
            open={isAddingList}
            value={newListTitle}
            onOpen={openAddList}
            onChange={setNewListTitle}
            onCancel={cancelAddList}
            onSubmit={submitAddList}
          />
        </div>
      </main>
    </div>
  );
}
