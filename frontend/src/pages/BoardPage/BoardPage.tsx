import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '@/api/fetcher';

import TopBar from '../../components/TopBar/TopBar';
import styles from './BoardPage.module.css';
import BoardList, { type ListModel } from '../../components/BoardList/BoardList';
import AddListComposer from '../../components/AddListComposer/AddListComposer';

export default function BoardPage() {
  const { boardId } = useParams();

  const [lists, setLists] = useState<ListModel[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

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

  async function submitAddList() {
    const title = newListTitle.trim();
    if (!title) return;
    if (!boardId) return;

    try {
      const res = await apiFetch(`/api/lists/?board_id=${encodeURIComponent(boardId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      const created = (await res.json()) as ListModel;

      setLists((prev) => [...prev, created]);

      setNewListTitle('');
      setIsAddingList(false);
    } catch {
      // 401 handled in fetcher
    }
  }

  return (
    <div className={styles.page}>
      <TopBar />

      <div className={styles.boardTopBar}>
        <div className={styles.boardName}>{boardId ?? 'Board'}</div>
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
