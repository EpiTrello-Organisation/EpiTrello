import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { CardModel } from '@/components/BoardCard/BoardCard';
import CardModal from '@/components/CardModal/CardModal';
import BoardTopBar from '@/components/BoardTopBar/BoardTopBar';
import TopBar from '@/components/TopBar/TopBar';
import BoardKanban from '@/components/BoardKanban/BoardKanban';

import { useBoard } from '@/hooks/useBoard';
import { useLists } from '@/hooks/useLists';
import { useSortableLists } from '@/hooks/useSortableLists';

import styles from './BoardPage.module.css';

export default function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const { board, renameBoard, deleteBoard } = useBoard(boardId);

  const {
    lists,
    cardsByListId,
    loadingLists,
    loadingCards,
    addList,
    renameList,
    deleteList,
    addCard,
    renameCard,
    deleteCard,
    reorderLists,
    reorderCards,
  } = useLists(boardId);

  const { sensors, onDragEnd } = useSortableLists({
    lists,
    onReorder: reorderLists,
  });

  const [selectedCard, setSelectedCard] = useState<CardModel | null>(null);

  return (
    <div className={styles.page}>
      <TopBar />

      <BoardTopBar
        title={board?.title ?? 'Board'}
        onRename={renameBoard}
        onDeleteBoard={async () => {
          const ok = await deleteBoard();
          if (ok) navigate('/boards');
        }}
      />

      <BoardKanban
        lists={lists}
        cardsByListId={cardsByListId}
        loading={loadingLists || loadingCards}
        sensors={sensors}
        onDragEnd={onDragEnd}
        onRenameList={renameList}
        onDeleteList={deleteList}
        onAddCard={addCard}
        onOpenCard={setSelectedCard}
        onAddList={addList}
        listsRowClassName={styles.listsRow}
        onReorderCards={reorderCards}
      />

      {selectedCard ? (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onRename={(nextTitle) =>
            renameCard(selectedCard.id, selectedCard.list_id, nextTitle)
          }
          onDeleteCard={async () => {
            await deleteCard(selectedCard.id, selectedCard.list_id);
            setSelectedCard(null);
          }}
        />
      ) : null}
    </div>
  );
}
