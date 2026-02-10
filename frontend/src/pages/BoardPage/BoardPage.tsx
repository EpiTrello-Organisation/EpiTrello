import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import CardModal from '@/components/CardModal/CardModal';
import BoardTopBar from '@/components/BoardTopBar/BoardTopBar';
import TopBar from '@/components/TopBar/TopBar';
import BoardKanban from '@/components/BoardKanban/BoardKanban';

import { useBoard } from '@/hooks/useBoard';
import { useList } from '@/hooks/useList';
import { useCard } from '@/hooks/useCard';
import { useSortableLists } from '@/hooks/useSortableLists';
import { useMember } from '@/hooks/useMember';
import { apiFetch } from '@/api/fetcher';

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

type MemberItem = { id: string; username: string; email: string };

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

  const memberHook = useMember(boardId);

  const [boardMembers, setBoardMembers] = useState<MemberItem[]>([]);
  const [filterSelectedIds, setFilterSelectedIds] = useState<string[]>([]);

  const [cardMembersByCardId, setCardMembersByCardId] = useState<Record<string, string[]>>({});
  const [loadingCardMembers, setLoadingCardMembers] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      if (!boardId) return;
      try {
        const ms = await memberHook.actions.getBoardMembers();
        if (cancelled) return;

        setBoardMembers(
          (Array.isArray(ms) ? ms : []).map((m) => ({
            id: m.user_id,
            username: m.username,
            email: m.email,
          })),
        );
      } catch {
        if (!cancelled) setBoardMembers([]);
      }
    }

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [boardId, memberHook.actions]);

  function toggleFilterMember(id: string) {
    setFilterSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function clearFilter() {
    setFilterSelectedIds([]);
  }

  async function fetchCardMemberIds(cardId: string): Promise<string[]> {
    const res = await apiFetch(`/api/cards/${encodeURIComponent(cardId)}/members/`);
    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as Array<{ user_id?: unknown }>;
    if (!Array.isArray(data)) return [];

    return data
      .map((x) => (typeof x?.user_id === 'string' ? x.user_id : null))
      .filter((x): x is string => !!x);
  }

  useEffect(() => {
    let cancelled = false;

    async function ensureMembersForLoadedCards() {
      const allCards = Object.values(cardsByListId).flat();
      const uniqueCardIds = Array.from(new Set(allCards.map((c) => c.id)));

      const missing = uniqueCardIds.filter((id) => cardMembersByCardId[id] == null);
      if (missing.length === 0) {
        setLoadingCardMembers(false);
        return;
      }

      setLoadingCardMembers(true);

      try {
        const entries = await Promise.all(
          missing.map(async (cardId) => [cardId, await fetchCardMemberIds(cardId)] as const),
        );

        if (cancelled) return;

        setCardMembersByCardId((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      } finally {
        if (!cancelled) setLoadingCardMembers(false);
      }
    }

    ensureMembersForLoadedCards();
    return () => {
      cancelled = true;
    };
  }, [cardsByListId, cardMembersByCardId]);

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

  const boardMembersById = useMemo(() => {
    const map = new Map<string, { username: string; email: string }>();
    for (const m of boardMembers) map.set(m.id, { username: m.username, email: m.email });
    return map;
  }, [boardMembers]);

  const enrichedCardsByListId = useMemo(() => {
    const next: Record<string, (typeof cardsByListId)[string]> = {};

    for (const [listId, cards] of Object.entries(cardsByListId)) {
      next[listId] = (cards ?? []).map((c) => {
        const memberIds = cardMembersByCardId[c.id];
        if (!memberIds || memberIds.length === 0) return c;
        return {
          ...c,
          members: memberIds
            .map((uid) => {
              const info = boardMembersById.get(uid);
              return info ? { user_id: uid, username: info.username } : null;
            })
            .filter((m): m is NonNullable<typeof m> => m !== null),
        };
      });
    }

    return next;
  }, [cardsByListId, cardMembersByCardId, boardMembersById]);

  const filteredCardsByListId = useMemo(() => {
    if (filterSelectedIds.length === 0) return enrichedCardsByListId;

    const want = new Set(filterSelectedIds);

    const next: Record<string, (typeof enrichedCardsByListId)[string]> = {};

    for (const [listId, cards] of Object.entries(enrichedCardsByListId)) {
      next[listId] = (cards ?? []).filter((c) => {
        const ids = cardMembersByCardId[c.id];

        if (!ids) return true;

        return ids.some((id) => want.has(id));
      });
    }

    return next;
  }, [enrichedCardsByListId, filterSelectedIds, cardMembersByCardId]);

  return (
    <div className={styles.page} style={pageStyle}>
      <TopBar />

      <BoardTopBar
        boardId={boardId}
        title={board?.title ?? 'Board'}
        onRename={boardActions.renameBoard}
        onDeleteBoard={async () => {
          const ok = await boardActions.deleteBoard();
          if (ok) navigate('/boards');
        }}
        filterMembers={boardMembers}
        filterSelectedIds={filterSelectedIds}
        onToggleFilterMember={toggleFilterMember}
        onClearFilter={clearFilter}
      />

      <div className={styles.kanban}>
        <BoardKanban
          lists={lists}
          cardsByListId={filteredCardsByListId}
          loading={
            loadingBoard ||
            loadingLists ||
            loadingCards ||
            (filterSelectedIds.length > 0 && loadingCardMembers)
          }
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
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          boardId={boardId}
          onClose={() => {
            setSelectedCardId(null);
            // Invalidate card members cache so avatars refresh
            setCardMembersByCardId((prev) => {
              const next = { ...prev };
              delete next[selectedCard.id];
              return next;
            });
          }}
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
