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
    // reorderCards,
    moveCardBetweenListsPreview,
    commitCardsMove,
  } = useLists(boardId);

  const { sensors, onDragEnd } = useSortableLists({
    lists,
    onReorder: reorderLists,
  });

  const [selectedCard, setSelectedCard] = useState<CardModel | null>(null);

  function updateCardLabels(cardId: string, listId: string, nextLabelIds: string[]) {
    setSelectedCard((prev) =>
      prev && prev.id === cardId ? { ...prev, labelIds: nextLabelIds } : prev,
    );

    // Mise à jour visuelle immédiate dans les listes
    cardsByListId[listId] = cardsByListId[listId].map((c) =>
      c.id === cardId ? { ...c, labelIds: nextLabelIds } : c,
    );
  }

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
        // onReorderCards={reorderCards}
        onMoveCardBetweenLists={moveCardBetweenListsPreview}
        onCommitCards={commitCardsMove}
      />

      {selectedCard ? (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onRename={(nextTitle) => renameCard(selectedCard.id, selectedCard.list_id, nextTitle)}
          onDeleteCard={async () => {
            await deleteCard(selectedCard.id, selectedCard.list_id);
            setSelectedCard(null);
          }}
          onUpdateLabels={(nextLabelIds) => {
            updateCardLabels(selectedCard.id, selectedCard.list_id, nextLabelIds);
          }}
        />
      ) : null}
    </div>
  );
}
