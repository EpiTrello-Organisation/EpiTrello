import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { CardModel } from '@/components/BoardCard/BoardCard';
import CardModal from '@/components/CardModal/CardModal';
import BoardTopBar from '@/components/BoardTopBar/BoardTopBar';
import TopBar from '@/components/TopBar/TopBar';
import BoardKanban from '@/components/BoardKanban/BoardKanban';

import { useBoard } from '@/hooks/useBoard';
import { useList } from '@/hooks/useList';
import { useCard } from '@/hooks/useCard';
import { useSortableLists } from '@/hooks/useSortableLists';

import styles from './BoardPage.module.css';

export default function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const { board, loadingBoard, actions: boardActions } = useBoard(boardId);

  const { lists, loadingLists, actions: listActions, dnd: listDnd } = useList(boardId);

  const {
    cardsByListId,
    loadingCards,
    actions: cardActions,
    dnd: cardDnd,
  } = useCard(boardId, lists);

  const { sensors, onDragEnd } = useSortableLists({
    lists,
    onReorder: listDnd.reorderLists,
  });

  const [selectedCard, setSelectedCard] = useState<CardModel | null>(null);

  function updateCardLabels(cardId: string, listId: string, nextLabelIds: string[]) {
    setSelectedCard((prev) =>
      prev && prev.id === cardId ? { ...prev, labelIds: nextLabelIds } : prev,
    );
    cardActions.setCardLabelsLocal(cardId, listId, nextLabelIds);
  }

  return (
    <div className={styles.page}>
      <TopBar />

      <BoardTopBar
        title={board?.title ?? 'Board'}
        onRename={boardActions.renameBoard}
        onDeleteBoard={async () => {
          const ok = await boardActions.deleteBoard();
          if (ok) navigate('/boards');
        }}
      />

      <BoardKanban
        lists={lists}
        cardsByListId={cardsByListId}
        loading={loadingBoard || loadingLists || loadingCards}
        sensors={sensors}
        onDragEnd={onDragEnd}
        onRenameList={listActions.renameList}
        onDeleteList={listActions.deleteList}
        onAddCard={cardActions.addCard}
        onOpenCard={setSelectedCard}
        onAddList={listActions.addList}
        listsRowClassName={styles.listsRow}
        onMoveCardBetweenLists={cardDnd.moveCardBetweenListsPreview}
        onCommitCards={cardDnd.commitCardsMove}
      />

      {selectedCard ? (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onRename={(nextTitle) =>
            cardActions.renameCard(selectedCard.id, selectedCard.list_id, nextTitle)
          }
          onDeleteCard={async () => {
            await cardActions.deleteCard(selectedCard.id, selectedCard.list_id);
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
