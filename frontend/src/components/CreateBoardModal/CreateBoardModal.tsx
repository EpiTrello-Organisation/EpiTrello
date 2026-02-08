import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './CreateBoardModal.module.css';

type BackgroundOption =
  | { id: string; kind: 'image'; value: string }
  | { id: string; kind: 'gradient'; value: string };

type CreateBoardPayload = {
  title: string;
  background_kind: 'gradient' | 'unsplash';
  background_value: string;
  background_thumb_url?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateBoardPayload) => void;
};

const BG_OPTIONS: BackgroundOption[] = [
  {
    id: 'img-1',
    kind: 'image',
    value:
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2400&q=60',
  },
  {
    id: 'img-2',
    kind: 'image',
    value:
      'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2400&q=60',
  },
  {
    id: 'img-3',
    kind: 'image',
    value:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=60',
  },
  {
    id: 'img-4',
    kind: 'image',
    value:
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2400&q=60',
  },

  { id: 'g-1', kind: 'gradient', value: 'linear-gradient(135deg, #e6f0ff, #cfe2ff)' },
  { id: 'g-2', kind: 'gradient', value: 'linear-gradient(135deg, #1fb6ff, #2dd4bf)' },
  { id: 'g-3', kind: 'gradient', value: 'linear-gradient(135deg, #0ea5e9, #2563eb)' },
  { id: 'g-4', kind: 'gradient', value: 'linear-gradient(135deg, #334155, #0f172a)' },
  { id: 'g-5', kind: 'gradient', value: 'linear-gradient(135deg, #6d28d9, #ec4899)' },
  { id: 'g-6', kind: 'gradient', value: 'linear-gradient(135deg, #7b5cff, #f17ac6)' },
];

function styleForBg(bg: BackgroundOption): React.CSSProperties {
  if (bg.kind === 'image') return { backgroundImage: `url(${bg.value})` };
  return { backgroundImage: bg.value };
}

const FALLBACK_BG: BackgroundOption = {
  id: 'g-1',
  kind: 'gradient',
  value: 'linear-gradient(135deg, #e6f0ff, #cfe2ff)',
};

export default function CreateBoardModal({ open, onClose, onCreate }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const safeOptions = useMemo<BackgroundOption[]>(
    () => (BG_OPTIONS.length > 0 ? BG_OPTIONS : [FALLBACK_BG]),
    [],
  );

  const imageOptions = useMemo(() => safeOptions.filter((b) => b.kind === 'image'), [safeOptions]);
  const gradientOptions = useMemo(
    () => safeOptions.filter((b) => b.kind === 'gradient'),
    [safeOptions],
  );

  const initialBgId = useMemo(
    () => imageOptions[0]?.id ?? gradientOptions[0]?.id ?? FALLBACK_BG.id,
    [imageOptions, gradientOptions],
  );

  const [bgId, setBgId] = useState<string>(initialBgId);
  const [title, setTitle] = useState('');
  const [touched, setTouched] = useState(false);

  const selectedBg = useMemo(
    () => safeOptions.find((b) => b.id === bgId) ?? safeOptions[0] ?? FALLBACK_BG,
    [bgId, safeOptions],
  );

  const titleError = touched && title.trim().length === 0 ? 'Board title is required' : null;
  const canCreate = title.trim().length > 0;

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setTitle('');
    setBgId(initialBgId);
  }, [open, initialBgId]);

  function handleOverlayMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function buildPayload(): CreateBoardPayload {
    const trimmedTitle = title.trim();

    if (selectedBg.kind === 'gradient') {
      return {
        title: trimmedTitle,
        background_kind: 'gradient',
        background_value: selectedBg.id,
        background_thumb_url: null,
      };
    }

    return {
      title: trimmedTitle,
      background_kind: 'unsplash',
      background_value: selectedBg.id,
      background_thumb_url: selectedBg.value,
    };
  }

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Create board"
      onMouseDown={handleOverlayMouseDown}
    >
      <div className={styles.panel} ref={panelRef}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>Create board</div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            x
          </button>
        </div>

        <div className={styles.preview} style={styleForBg(selectedBg)}>
          <div className={styles.previewMock}>
            <div className={styles.mockCol}>
              <div className={styles.mockLine} />
              <div className={styles.mockLineShort} />
              <div className={styles.mockCard} />
            </div>
            <div className={styles.mockCol}>
              <div className={styles.mockLine} />
              <div className={styles.mockLineShort} />
              <div className={styles.mockCard} />
            </div>
            <div className={styles.mockCol}>
              <div className={styles.mockLine} />
              <div className={styles.mockLineShort} />
              <div className={styles.mockCard} />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Background</div>

          {imageOptions.length > 0 && (
            <div className={styles.bgGrid}>
              {imageOptions.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  className={`${styles.bgTile} ${bgId === bg.id ? styles.bgTileActive : ''}`}
                  onClick={() => setBgId(bg.id)}
                  aria-label="Select background"
                  style={styleForBg(bg)}
                />
              ))}
            </div>
          )}

          {gradientOptions.length > 0 && (
            <div className={styles.bgGrid2}>
              {gradientOptions.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  className={`${styles.colorTile} ${bgId === bg.id ? styles.colorTileActive : ''}`}
                  onClick={() => setBgId(bg.id)}
                  aria-label="Select color"
                  style={styleForBg(bg)}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <label className={styles.label}>
            Board title <span className={styles.required}>*</span>
          </label>

          <input
            className={`${styles.input} ${titleError ? styles.inputError : ''}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched(true)}
            autoFocus
          />

          {titleError && <div className={styles.inlineError}>{titleError}</div>}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!canCreate}
            onClick={() => onCreate(buildPayload())}
          >
            Create
          </button>

          <div className={styles.footerNote}>
            By using images from Unsplash, you agree to their{' '}
            <span className={styles.linkLike}>license</span> and{' '}
            <span className={styles.linkLike}>Terms of Service</span>
          </div>
        </div>
      </div>
    </div>
  );
}
