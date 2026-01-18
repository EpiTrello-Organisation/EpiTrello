import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '@/api/fetcher';

import TopBar from '../../components/TopBar/TopBar';
import styles from './BoardPage.module.css';

type Board = {
  id: string;
  title: string;
};

type ListModel = {
  id: string;
  title: string;
};

function IconDots() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <circle cx="6" cy="12" r="1.7" fill="#fff" />
      <circle cx="12" cy="12" r="1.7" fill="#fff" />
      <circle cx="18" cy="12" r="1.7" fill="#fff" />
    </svg>
  );
}

function IconTemplate() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.iconSmall}>
      <path
        d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 8h6M9 12h6M9 16h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditableText({
  value,
  className,
  inputClassName,
  onChange,
  ariaLabel,
}: {
  value: string;
  className: string;
  inputClassName: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  function commit() {
    const next = draft.trim();
    if (next.length > 0 && next !== value) onChange(next);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => setEditing(true)}
        aria-label={ariaLabel}
      >
        {value}
      </button>
    );
  }

  return (
    <input
      className={inputClassName}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setEditing(false);
      }}
      aria-label={ariaLabel}
      autoFocus
    />
  );
}

export default function BoardPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<ListModel[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadBoard() {
      if (!boardId) return;
      try {
        const res = await apiFetch(`/api/boards/${boardId}`);
        const data = (await res.json()) as Board;
        if (!cancelled) setBoard(data);
      } catch {}
    }

    loadBoard();
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  useEffect(() => {
    let cancelled = false;

    async function loadLists() {
      if (!boardId) return;

      setLoadingLists(true);
      try {
        const res = await apiFetch(`/api/lists/board/${boardId}`);
        const data = (await res.json()) as ListModel[];

        if (!cancelled) setLists(Array.isArray(data) ? data : []);
      } catch {
      } finally {
        if (!cancelled) setLoadingLists(false);
      }
    }

    loadLists();
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  function setListTitle(listId: string, nextTitle: string) {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, title: nextTitle } : l)));
  }

  return (
    <div className={styles.page}>
      <TopBar />

      {/* BoardTopBar : tu peux remettre ton vrai topbar board ici */}
      <div className={styles.boardTopBar}>
        <div className={styles.boardName}>{board?.title ?? 'Board'}</div>
      </div>

      <main className={styles.kanban} aria-busy={loadingLists}>
        <div className={styles.listsRow}>
          {lists.map((list) => (
            <section key={list.id} className={styles.list}>
              <div className={styles.listRow1}>
                <EditableText
                  value={list.title}
                  ariaLabel="Edit list title"
                  className={styles.listTitleButton}
                  inputClassName={styles.listTitleInput}
                  onChange={(v) => setListTitle(list.id, v)}
                />

                <button type="button" className={styles.iconBtn} aria-label="List menu">
                  <IconDots />
                </button>
              </div>

              <div className={styles.listRow2}>
                <button type="button" className={styles.addCardBtn}>
                  + <span>Add a card</span>
                </button>

                <button
                  type="button"
                  className={styles.templateBtn}
                  aria-label="Create from template"
                  title="Create from a template..."
                >
                  <IconTemplate />
                </button>
              </div>
            </section>
          ))}

          {/* Inactif pour l’instant */}
          <button type="button" className={styles.addListBtn} disabled aria-disabled="true">
            + <span>Add another list</span>
          </button>
        </div>
      </main>
    </div>
  );
}
