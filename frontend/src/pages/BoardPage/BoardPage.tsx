import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import CardModal from '@/components/CardModal/CardModal';
import BoardTopBar from '@/components/BoardTopBar/BoardTopBar';
import TopBar from '@/components/TopBar/TopBar';
import BoardKanban from '@/components/BoardKanban/BoardKanban';

import { useBoard } from '@/hooks/useBoard';
import { useList } from '@/hooks/useList';
import { useCard } from '@/hooks/useCard';
import { useSortableLists } from '@/hooks/useSortableLists';

import styles from './BoardPage.module.css';

function gradientCssForKey(key?: string | null): string | null {
  switch (key) {
    case 'g-1':
      return 'linear-gradient(135deg, #e6f0ff, #cfe2ff)';
    case 'g-2':
      return 'linear-gradient(135deg, #1fb6ff, #2dd4bf)';
    case 'g-3':
      return 'linear-gradient(135deg, #0ea5e9, #2563eb)';
    case 'g-4':
      return 'linear-gradient(135deg, #334155, #0f172a)';
    case 'g-5':
      return 'linear-gradient(135deg, #6d28d9, #ec4899)';
    case 'g-6':
      return 'linear-gradient(135deg, #7b5cff, #f17ac6)';
    default:
      return null;
  }
}

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

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const selectedCard = useMemo(() => {
    if (!selectedCardId) return null;

    for (const cards of Object.values(cardsByListId)) {
      const found = cards.find((c) => c.id === selectedCardId);
      if (found) return found;
    }

    return null;
  }, [selectedCardId, cardsByListId]);

  const pageStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!board) return undefined;

    if (board.background_kind === 'unsplash') {
      const url = board.background_thumb_url;
      return url ? { backgroundImage: `url(${url})` } : undefined;
    }

    if (board.background_kind === 'gradient') {
      const css = gradientCssForKey(board.background_value);
      return css ? { backgroundImage: css } : undefined;
    }

    return undefined;
  }, [board]);

  return (
    <div className={styles.page} style={pageStyle}>
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
        onOpenCard={(card) => setSelectedCardId(card.id)}
        onAddList={listActions.addList}
        listsRowClassName={styles.listsRow}
        onMoveCardBetweenLists={cardDnd.moveCardBetweenListsPreview}
        onCommitCards={cardDnd.commitCardsMove}
      />

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCardId(null)}
          onRename={(nextTitle) =>
            cardActions.renameCard(selectedCard.id, selectedCard.list_id, nextTitle)
          }
          onDeleteCard={async () => {
            await cardActions.deleteCard(selectedCard.id, selectedCard.list_id);
            setSelectedCardId(null);
          }}
          onUpdateLabels={(nextLabelIds) =>
            cardActions.updateCardLabels(selectedCard.id, selectedCard.list_id, nextLabelIds)
          }
          onEditDescription={(nextDescription) =>
            cardActions.editDescription(selectedCard.id, selectedCard.list_id, nextDescription)
          }
        />
      )}
    </div>
  );
}
