import { useEffect, useMemo, useRef, useState } from 'react';
import { LABELS } from '@/constants/labels';
import styles from './CardModal.module.css';
import type { CardModel } from '../BoardCard/BoardCard';
import EditableText from '../EditableText/EditableText';
import LabelsPopover from '../LabelsPopover/LabelsPopover';
import MembersPopover, { type MemberItem } from '../MembersPopover/MembersPopover';
import RichTextEditor from './RichTextEditor';
import { TagIcon, UserIcon } from '@heroicons/react/24/outline';
import { useMember } from '@/hooks/useMember';

function IconDots() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <circle cx="6" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="18" cy="12" r="1.7" />
    </svg>
  );
}

function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  const first = parts[0]?.[0] ?? 'U';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export default function CardModal({
  card,
  boardId,
  onClose,
  onRename,
  onDeleteCard,
  onUpdateLabels,
  onEditDescription,
}: {
  card: CardModel;
  boardId?: string;
  onClose: () => void;
  onRename: (nextTitle: string) => void;
  onDeleteCard: () => void;
  onUpdateLabels: (nextLabelIds: number[]) => void;
  onEditDescription: (nextDescription: string) => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapperRef = useRef<HTMLDivElement | null>(null);

  const [labelsOpen, setLabelsOpen] = useState(false);
  const labelsAnchorRef = useRef<HTMLDivElement | null>(null);

  const [membersOpen, setMembersOpen] = useState(false);
  const membersAnchorRef = useRef<HTMLDivElement | null>(null);

  const [draftLabelIds, setDraftLabelIds] = useState<number[]>([]);
  const [editingDescription, setEditingDescription] = useState(false);

  const [boardMembers, setBoardMembers] = useState<MemberItem[]>([]);
  const [cardMembers, setCardMembers] = useState<
    { user_id: string; email: string; username: string }[]
  >([]);

  const [draftMemberIds, setDraftMemberIds] = useState<string[]>([]);

  const { actions: memberActions } = useMember(boardId, card.id);

  const popoverLabels = useMemo(() => LABELS.map((l, idx) => ({ id: idx, color: l.color })), []);

  const activeLabels = draftLabelIds
    .filter((id) => id >= 0 && id < LABELS.length)
    .map((id) => ({ id, color: LABELS[id].color }));

  const selectedMemberIds = useMemo(() => draftMemberIds, [draftMemberIds]);

  const activeMembers = useMemo(() => {
    const set = new Set(selectedMemberIds);
    return boardMembers.filter((m) => set.has(m.id));
  }, [boardMembers, selectedMemberIds]);

  function toggleLabel(labelId: number) {
    setDraftLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  }

  function toggleDraftMember(userId: string) {
    setDraftMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  useEffect(() => {
    setDraftLabelIds(card.label_ids ?? []);
  }, [card.id, card.label_ids]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!boardId) {
          setBoardMembers([]);
          setCardMembers([]);
          setDraftMemberIds([]);
          return;
        }

        const [bm, cm] = await Promise.all([
          memberActions.getBoardMembers(),
          memberActions.getCardMembers(),
        ]);

        if (cancelled) return;

        setBoardMembers(bm.map((m) => ({ id: m.user_id, username: m.username, email: m.email })));
        setCardMembers(cm);

        setDraftMemberIds(cm.map((m) => m.user_id));
      } catch {
        if (cancelled) return;
        setBoardMembers([]);
        setCardMembers([]);
        setDraftMemberIds([]);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, boardId]);

  useEffect(() => {
    setDraftMemberIds(cardMembers.map((m) => m.user_id));
  }, [card.id, cardMembers]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (!editingDescription) onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, editingDescription]);

  useEffect(() => {
    requestAnimationFrame(() => dialogRef.current?.focus());
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const opts: AddEventListenerOptions = { capture: true };

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const wrapperEl = menuWrapperRef.current;
      const clickedInWrapper = !!wrapperEl && wrapperEl.contains(target);
      if (!clickedInWrapper) setMenuOpen(false);
    }

    window.addEventListener('pointerdown', onPointerDown, opts);
    return () => window.removeEventListener('pointerdown', onPointerDown, opts);
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      setLabelsOpen(false);
      setMembersOpen(false);
    };
  }, []);

  async function closeLabelsPopover() {
    setLabelsOpen(false);

    const prev = card.label_ids ?? [];
    const next = draftLabelIds;

    if (prev.length === next.length && prev.every((v, i) => v === next[i])) {
      return;
    }

    onUpdateLabels(next);
  }

  async function closeMembersPopover() {
    setMembersOpen(false);

    if (!boardId) return;

    const prevIds = new Set(cardMembers.map((m) => m.user_id));
    const nextIds = new Set(draftMemberIds);

    const toAddIds = draftMemberIds.filter((id) => !prevIds.has(id));
    const toRemoveIds = cardMembers.map((m) => m.user_id).filter((id) => !nextIds.has(id));

    if (toAddIds.length === 0 && toRemoveIds.length === 0) return;

    try {
      await Promise.all(
        toAddIds.map(async (id) => {
          const target = boardMembers.find((m) => m.id === id);
          if (!target) return;
          await memberActions.addCardMember(target.email);
        }),
      );

      await Promise.all(
        toRemoveIds.map(async (id) => {
          const target = cardMembers.find((m) => m.user_id === id);
          if (!target) return;
          await memberActions.deleteCardMember(target.email);
        }),
      );

      const next = await memberActions.getCardMembers();
      setCardMembers(next);
      // draft will resync via effect
    } catch {
      // keep UI stable: best-effort resync
      try {
        const next = await memberActions.getCardMembers();
        setCardMembers(next);
      } catch {
        // ignore
      }
    }
  }

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`Card details: ${card.title}`}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className={styles.header}>
          <EditableText
            value={card.title}
            ariaLabel="Edit card title"
            className={styles.cardTitleButton}
            inputClassName={styles.cardTitleInput}
            onChange={onRename}
          />

          <div className={styles.headerActions}>
            <div className={styles.cardMenuWrapper} ref={menuWrapperRef}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Card menu"
                title="Card menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <IconDots />
              </button>

              {menuOpen && (
                <div className={styles.cardMenu}>
                  <button
                    type="button"
                    className={styles.cardMenuItemDanger}
                    onClick={() => {
                      setMenuOpen(false);
                      onDeleteCard();
                    }}
                  >
                    Delete card
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className={styles.iconBtn}
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className={styles.quickActions}>
          <div className={styles.quickActionWrapper} ref={labelsAnchorRef}>
            <button
              className={`${styles.quickActionBtn} ${
                labelsOpen ? styles.quickActionBtnActive : ''
              }`}
              type="button"
              onClick={() => {
                setLabelsOpen((v) => !v);
                setMembersOpen(false);
              }}
              aria-haspopup="dialog"
              aria-expanded={labelsOpen}
            >
              <TagIcon className={styles.quickActionIcon} />
              Labels
            </button>

            <LabelsPopover
              open={labelsOpen}
              anchorRef={labelsAnchorRef}
              onClose={closeLabelsPopover}
              labels={popoverLabels}
              selectedIds={draftLabelIds}
              onToggle={toggleLabel}
            />
          </div>

          <div className={styles.quickActionWrapper} ref={membersAnchorRef}>
            <button
              className={`${styles.quickActionBtn} ${
                membersOpen ? styles.quickActionBtnActive : ''
              }`}
              type="button"
              onClick={() => {
                setMembersOpen((v) => !v);
                setLabelsOpen(false);

                if (!membersOpen) setDraftMemberIds(cardMembers.map((m) => m.user_id));
              }}
              aria-haspopup="dialog"
              aria-expanded={membersOpen}
              disabled={!boardId}
              aria-disabled={!boardId}
            >
              <UserIcon className={styles.quickActionIcon} />
              Members
            </button>

            <MembersPopover
              open={membersOpen}
              anchorRef={membersAnchorRef}
              onClose={closeMembersPopover}
              members={boardMembers}
              selectedIds={selectedMemberIds}
              onToggle={toggleDraftMember}
            />
          </div>
        </div>

        {activeLabels.length > 0 && (
          <div className={styles.labelsCategory}>
            <div className={styles.labelsCategoryTitle}>Labels</div>

            <div className={styles.labelsSwatches}>
              {activeLabels.map((l) => (
                <div
                  key={l.id}
                  className={styles.labelsSwatch}
                  style={{ background: l.color }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        )}

        {activeMembers.length > 0 && (
          <div className={styles.membersCategory}>
            <div className={styles.membersCategoryTitle}>Members</div>

            <div className={styles.memberChips}>
              {activeMembers.map((m) => (
                <div key={m.id} className={styles.memberChip} title={m.email}>
                  <div className={styles.memberChipAvatar} aria-hidden="true">
                    {initialsForName(m.username)}
                  </div>
                  <div className={styles.memberChipName}>{m.username}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.body}>
            <div className={styles.sectionTitle}>Description</div>

            {editingDescription ? (
              <RichTextEditor
                value={card.description ?? ''}
                onSave={(html) => {
                  const normalized = html.trim().length === 0 ? 'No description' : html;
                  onEditDescription(normalized);
                  setEditingDescription(false);
                }}
                onCancel={() => setEditingDescription(false)}
              />
            ) : (
              <div
                className={`${styles.description} ${
                  !card.description || card.description.trim().length === 0 ? styles.empty : ''
                }`}
                role="button"
                tabIndex={0}
                onClick={() => setEditingDescription(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setEditingDescription(true);
                }}
                aria-label="Edit card description"
              >
                {card.description && card.description.trim().length > 0 ? (
                  <div dangerouslySetInnerHTML={{ __html: card.description }} />
                ) : (
                  'No description'
                )}
              </div>
            )}

            <div className={styles.meta}>
              <div>
                <span className={styles.metaLabel}>Created</span>
                <span className={styles.metaValue}>
                  {new Date(card.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
