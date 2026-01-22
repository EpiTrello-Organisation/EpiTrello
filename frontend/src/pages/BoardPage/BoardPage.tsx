import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '@/api/fetcher';

import TopBar from '../../components/TopBar/TopBar';
import styles from './BoardPage.module.css';
import BoardList, { type ListModel } from '../../components/BoardList/BoardList';
import AddListComposer from '../../components/AddListComposer/AddListComposer';
import type { CardModel } from '../../components/BoardCard/BoardCard';

export default function BoardPage() {
  const { boardId } = useParams();

  const [lists, setLists] = useState<ListModel[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [cardsByListId, setCardsByListId] = useState<Record<string, CardModel[]>>({});
  const [loadingCards, setLoadingCards] = useState(false);

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadListsAndCards() {
      if (!boardId) return;

      setLoadingLists(true);
      setLoadingCards(true);

      try {
        // 1) lists
        const resLists = await apiFetch(`/api/lists/board/${boardId}`);
        const listsData = (await resLists.json()) as ListModel[];
        const safeLists = Array.isArray(listsData) ? listsData : [];

        if (cancelled) return;

        setLists(safeLists);

        // 2) cards for each list (parallel)
        const entries = await Promise.all(
          safeLists.map(async (l) => {
            const resCards = await apiFetch(`/api/cards/?list_id=${encodeURIComponent(l.id)}`);
            const cards = (await resCards.json()) as CardModel[];
            return [l.id, Array.isArray(cards) ? cards : []] as const;
          }),
        );

        if (cancelled) return;

        setCardsByListId(Object.fromEntries(entries));
      } catch {
        // 401 handled in fetcher
        if (!cancelled) {
          setLists([]);
          setCardsByListId({});
        }
      } finally {
        if (!cancelled) {
          setLoadingLists(false);
          setLoadingCards(false);
        }
      }
    }

    loadListsAndCards();
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

      <main className={styles.kanban} aria-busy={loadingLists || loadingCards}>
        <div className={styles.listsRow}>
          {lists.map((list) => (
            <BoardList
              key={list.id}
              list={list}
              cards={cardsByListId[list.id] ?? []}
              onRename={renameList}
            />
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
