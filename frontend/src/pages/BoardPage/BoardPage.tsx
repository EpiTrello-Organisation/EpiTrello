import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { apiFetch } from '@/api/fetcher';

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import type { CardModel } from '../../components/BoardCard/BoardCard';
import BoardList, { type ListModel } from '../../components/BoardList/BoardList';
import CardModal from '../../components/CardModal/CardModal';
import AddListComposer from '../../components/AddListComposer/AddListComposer';
import BoardTopBar from '../../components/BoardTopBar/BoardTopBar';
import TopBar from '../../components/TopBar/TopBar';

import styles from './BoardPage.module.css';

type BoardModel = {
  id: string;
  title: string;
};

export default function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState<BoardModel | null>(null);
  const [lists, setLists] = useState<ListModel[]>([]);
  const [cardsByListId, setCardsByListId] = useState<Record<string, CardModel[]>>({});
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardModel | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBoard() {
      if (!boardId) return;

      try {
        const res = await apiFetch(`/api/boards/${encodeURIComponent(boardId)}`);
        const data = (await res.json()) as BoardModel;

        if (!cancelled) setBoard(data);
      } catch {
        // 401 handled in fetcher
        if (!cancelled) setBoard(null);
      }
    }

    loadBoard();
    return () => {
      cancelled = true;
    };
  }, [boardId]);

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

  async function renameBoard(nextTitle: string) {
    const title = nextTitle.trim();
    if (!title) return;
    if (!boardId) return;

    const prevTitle = board?.title ?? 'Board';

    setBoard((prev) => (prev ? { ...prev, title } : { id: boardId, title }));

    try {
      await apiFetch(`/api/boards/${encodeURIComponent(boardId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
    } catch {
      setBoard((prev) => (prev ? { ...prev, title: prevTitle } : prev));
    }
  }

  async function deleteBoard() {
    if (!boardId) return;

    try {
      await apiFetch(`/api/boards/${encodeURIComponent(boardId)}`, {
        method: 'DELETE',
      });

      navigate('/boards');
    } catch {
      // 401 handled in fetcher
    }
  }

  async function deleteList(listId: string) {
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setCardsByListId((prev) => {
      const next = { ...prev };
      delete next[listId];
      return next;
    });

    try {
      await apiFetch(`/api/lists/${encodeURIComponent(listId)}`, {
        method: 'DELETE',
      });
    } catch {
      // 401 handled in fetcher
    }
  }

  async function renameCard(cardId: string, listId: string, nextTitle: string) {
    const title = nextTitle.trim();
    if (!title) return;

    const prevTitle =
      cardsByListId[listId]?.find((c) => c.id === cardId)?.title ?? selectedCard?.title ?? '';

    setCardsByListId((prev) => ({
      ...prev,
      [listId]: (prev[listId] ?? []).map((c) => (c.id === cardId ? { ...c, title } : c)),
    }));

    setSelectedCard((prev) => (prev && prev.id === cardId ? { ...prev, title } : prev));

    try {
      await apiFetch(`/api/cards/${encodeURIComponent(cardId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
    } catch {
      // rollback en cas d'erreur (hors 401 déjà géré)
      setCardsByListId((prev) => ({
        ...prev,
        [listId]: (prev[listId] ?? []).map((c) =>
          c.id === cardId ? { ...c, title: prevTitle } : c,
        ),
      }));
      setSelectedCard((prev) =>
        prev && prev.id === cardId ? { ...prev, title: prevTitle } : prev,
      );
    }
  }

  async function deleteCard(cardId: string, listId: string) {
    setCardsByListId((prev) => ({
      ...prev,
      [listId]: (prev[listId] ?? []).filter((c) => c.id !== cardId),
    }));
    setSelectedCard(null);

    try {
      await apiFetch(`/api/cards/${encodeURIComponent(cardId)}`, {
        method: 'DELETE',
      });
    } catch {
      // 401 handled in fetcher
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

  async function addCard(listId: string, title: string) {
    try {
      const res = await apiFetch(`/api/cards/?list_id=${encodeURIComponent(listId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      const created = (await res.json()) as CardModel;

      setCardsByListId((prev) => ({
        ...prev,
        [listId]: [...(prev[listId] ?? []), created],
      }));
    } catch {
      // 401 handled in fetcher
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function persistListPositions(nextLists: ListModel[]) {
    await Promise.all(
      nextLists.map((l, index) =>
        apiFetch(`/api/lists/${encodeURIComponent(l.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: index }),
        }),
      ),
    );
  }

  function onDragEndLists(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    if (active.id === over.id) return;

    setLists((prev) => {
      const oldIndex = prev.findIndex((l) => l.id === String(active.id));
      const newIndex = prev.findIndex((l) => l.id === String(over.id));
      if (oldIndex < 0 || newIndex < 0) return prev;

      const next = arrayMove(prev, oldIndex, newIndex);

      queueMicrotask(() => {
        persistListPositions(next).catch(() => {
          // Optionnel: rollback
        });
      });

      return next;
    });
  }

  return (
    <div className={styles.page}>
      <TopBar />
      <BoardTopBar
        title={board?.title ?? 'Board'}
        onRename={renameBoard}
        onDeleteBoard={deleteBoard}
      />

      <main className={styles.kanban} aria-busy={loadingLists || loadingCards}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndLists}>
          <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
            <div className={styles.listsRow}>
              {lists.map((list) => (
                <BoardList
                  key={list.id}
                  list={list}
                  cards={cardsByListId[list.id] ?? []}
                  onRename={renameList}
                  onOpenCard={openCard}
                  onDelete={deleteList}
                  onAddCard={addCard}
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
          </SortableContext>
        </DndContext>
      </main>

      {selectedCard ? (
        <CardModal
          card={selectedCard}
          onClose={closeCard}
          onRename={(nextTitle) => renameCard(selectedCard.id, selectedCard.list_id, nextTitle)}
          onDeleteCard={() => deleteCard(selectedCard.id, selectedCard.list_id)}
        />
      ) : null}
    </div>
  );
}
