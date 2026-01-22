import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { apiFetch } from '@/api/fetcher';

import type { CardModel } from '../../components/BoardCard/BoardCard';
import BoardList, { type ListModel } from '../../components/BoardList/BoardList';
import CardModal from '../../components/CardModal/CardModal';
import AddListComposer from '../../components/AddListComposer/AddListComposer';
import BoardTopBar from '../../components/BoardTopBar/BoardTopBar';
import TopBar from '../../components/TopBar/TopBar';

import styles from './BoardPage.module.css';

export default function BoardPage() {
  const { boardId } = useParams();
  const [lists, setLists] = useState<ListModel[]>([]);
  const [cardsByListId, setCardsByListId] = useState<Record<string, CardModel[]>>({});
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardModel | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadListsAndCards() {
      if (!boardId) return;

      setLoadingLists(true);
      setLoadingCards(true);

      try {
        const resLists = await apiFetch(`/api/lists/board/${encodeURIComponent(boardId)}`);
        const listsData = (await resLists.json()) as ListModel[];
        const safeLists = Array.isArray(listsData) ? listsData : [];

        if (cancelled) return;
        setLists(safeLists);

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

  async function renameList(listId: string, nextTitle: string) {
    const prevTitle = lists.find((l) => l.id === listId)?.title ?? '';

    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, title: nextTitle } : l)));

    try {
      await apiFetch(`/api/lists/${encodeURIComponent(listId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nextTitle }),
      });
    } catch {
      // 401 handled in fetcher, otherwise revert
      setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, title: prevTitle } : l)));
    }
  }

  function openAddList() {
    setIsAddingList(true);
  }

  function cancelAddList() {
    setIsAddingList(false);
    setNewListTitle('');
  }

  function openCard(card: CardModel) {
    setSelectedCard(card);
  }

  function closeCard() {
    setSelectedCard(null);
  }

  async function submitAddList() {
    const title = newListTitle.trim();
    if (!title || !boardId) return;

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
      <BoardTopBar title={boardId ?? 'Board'} />

      <main className={styles.kanban} aria-busy={loadingLists || loadingCards}>
        <div className={styles.listsRow}>
          {lists.map((list) => (
            <BoardList
              key={list.id}
              list={list}
              cards={cardsByListId[list.id] ?? []}
              onRename={renameList}
              onOpenCard={openCard}
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

      {selectedCard ? <CardModal card={selectedCard} onClose={closeCard} /> : null}
    </div>
  );
}
