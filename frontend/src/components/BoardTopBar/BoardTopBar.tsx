// BoardTopBar.tsx (patch)
import { useEffect, useRef, useState } from 'react';
import styles from './BoardTopBar.module.css';
import EditableText from '../EditableText/EditableText';
import ShareModal from '../ShareModal/ShareModal';
import FilterMembersModal, {
  type FilterMemberItem,
} from '../FilterMembersModal/FilterMembersModal';
import ChangeBgModal, { type ChangeBgPayload } from '../ChangeBgModal/ChangeBgModal';

export default function BoardTopBar({
  boardId,
  title,
  onRename,
  onDeleteBoard,
  onChangeBg,
  currentBgId,

  // NEW
  filterMembers,
  filterSelectedIds,
  onToggleFilterMember,
  onClearFilter,
}: {
  boardId?: string;
  title: string;
  onRename: (nextTitle: string) => void;
  onDeleteBoard: () => void;
  onChangeBg: (payload: ChangeBgPayload) => void;
  currentBgId?: string | null;

  // NEW
  filterMembers: FilterMemberItem[];
  filterSelectedIds: string[];
  onToggleFilterMember: (id: string) => void;
  onClearFilter: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [changeBgOpen, setChangeBgOpen] = useState(false);

  // NEW
  const [filterOpen, setFilterOpen] = useState(false);
  const filterAnchorRef = useRef<HTMLDivElement | null>(null);

  const menuWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const wrapperEl = menuWrapperRef.current;
      const clickedInWrapper = !!wrapperEl && wrapperEl.contains(target);

      if (!clickedInWrapper) setMenuOpen(false);
    }

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  return (
    <div className={styles.boardTopBar}>
      <EditableText
        value={title}
        ariaLabel="Edit board title"
        className={styles.boardNameButton}
        inputClassName={styles.boardNameInput}
        onChange={onRename}
      />

      <div className={styles.boardTopBarRight}>
        {/* NEW: wrapper anchor */}
        <div ref={filterAnchorRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.topbarIconBtn}
            aria-label="Filter"
            title="Filter"
            onClick={() => setFilterOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
              <path
                d="M4 6h16M7 12h10M10 18h4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.0"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <FilterMembersModal
            open={filterOpen}
            anchorRef={filterAnchorRef}
            onClose={() => setFilterOpen(false)}
            members={filterMembers}
            selectedIds={filterSelectedIds}
            onToggle={onToggleFilterMember}
            onClear={onClearFilter}
          />
        </div>

        <button
          type="button"
          className={styles.shareBtn}
          aria-label="Share"
          onClick={() => setShareOpen(true)}
        >
          + Share
        </button>

        <div className={styles.boardMenuWrapper} ref={menuWrapperRef}>
          <button
            type="button"
            className={styles.topbarIconBtn}
            aria-label="Board menu"
            title="Board menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
              <circle cx="6" cy="12" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="18" cy="12" r="1.7" />
            </svg>
          </button>

          {menuOpen && (
            <div className={styles.boardMenu}>
              <button
                type="button"
                className={styles.boardMenuItem}
                onClick={() => {
                  setMenuOpen(false);
                  setChangeBgOpen(true);
                }}
              >
                Change background
              </button>
              <button
                type="button"
                className={styles.boardMenuItemDanger}
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteBoard();
                }}
              >
                Delete Board
              </button>
            </div>
          )}
        </div>
      </div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} boardId={boardId} />
      <ChangeBgModal
        open={changeBgOpen}
        currentBgId={currentBgId}
        onClose={() => setChangeBgOpen(false)}
        onSelect={(payload) => {
          onChangeBg(payload);
        }}
      />
    </div>
  );
}
