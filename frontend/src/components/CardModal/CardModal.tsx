import { useEffect, useMemo, useRef, useState } from 'react';
import { LABELS } from '@/constants/labels';
import styles from './CardModal.module.css';
import type { CardModel } from '../BoardCard/BoardCard';
import EditableText from '../EditableText/EditableText';
import LabelsPopover from '../LabelsPopover/LabelsPopover';
import RichTextEditor from './RichTextEditor';
import { TagIcon, CalendarIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';

function IconDots() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <circle cx="6" cy="12" r="1.7" fill="#fff" />
      <circle cx="12" cy="12" r="1.7" fill="#fff" />
      <circle cx="18" cy="12" r="1.7" fill="#fff" />
    </svg>
  );
}

export default function CardModal({
  card,
  onClose,
  onRename,
  onDeleteCard,
  onUpdateLabels,
  onEditDescription,
}: {
  card: CardModel;
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

  const [draftLabelIds, setDraftLabelIds] = useState<number[]>([]);

  const [editingDescription, setEditingDescription] = useState(false);

  const popoverLabels = useMemo(() => LABELS.map((l, idx) => ({ id: idx, color: l.color })), []);

  const activeLabels = draftLabelIds
    .filter((id) => id >= 0 && id < LABELS.length)
    .map((id) => ({ id, color: LABELS[id].color }));

  function toggleLabel(labelId: number) {
    setDraftLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  }

  useEffect(() => {
    setDraftLabelIds(card.label_ids ?? []);
  }, [card.id, card.label_ids]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // If the rich editor is open, let it close itself via its Cancel/Escape behavior.
        // Otherwise close the modal.
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
    };
  }, []);

  async function closeLabelsPopover() {
    setLabelsOpen(false);

    // évite les PUT inutiles
    const prev = card.label_ids ?? [];
    const next = draftLabelIds;

    if (prev.length === next.length && prev.every((v, i) => v === next[i])) {
      return;
    }

    onUpdateLabels(next);
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
              onClick={() => setLabelsOpen((v) => !v)}
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

          <button className={styles.quickActionBtn} type="button">
            <CalendarIcon className={styles.quickActionIcon} />
            Dates
          </button>

          <button className={styles.quickActionBtn} type="button">
            <CheckCircleIcon className={styles.quickActionIcon} />
            Checklist
          </button>

          <button className={styles.quickActionBtn} type="button">
            <UserIcon className={styles.quickActionIcon} />
            Members
          </button>
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
