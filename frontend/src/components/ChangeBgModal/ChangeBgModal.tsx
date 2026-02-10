import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ChangeBgModal.module.css';

type BackgroundOption =
  | { id: string; kind: 'image'; value: string }
  | { id: string; kind: 'gradient'; value: string };

export type ChangeBgPayload = {
  background_kind: 'gradient' | 'unsplash';
  background_value: string;
  background_thumb_url?: string | null;
};

type Props = {
  open: boolean;
  currentBgId?: string | null;
  onClose: () => void;
  onSelect: (payload: ChangeBgPayload) => void;
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

export default function ChangeBgModal({ open, currentBgId, onClose, onSelect }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const imageOptions = useMemo(() => BG_OPTIONS.filter((b) => b.kind === 'image'), []);
  const gradientOptions = useMemo(() => BG_OPTIONS.filter((b) => b.kind === 'gradient'), []);

  const [bgId, setBgId] = useState<string | null>(null);

  useEffect(() => {
    if (open) setBgId(currentBgId ?? null);
  }, [open, currentBgId]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  function handleOverlayMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSelect(bg: BackgroundOption) {
    setBgId(bg.id);

    if (bg.kind === 'gradient') {
      onSelect({
        background_kind: 'gradient',
        background_value: bg.id,
        background_thumb_url: null,
      });
    } else {
      onSelect({
        background_kind: 'unsplash',
        background_value: bg.id,
        background_thumb_url: bg.value,
      });
    }
  }

  if (!open) return null;

  const selectedBg = BG_OPTIONS.find((b) => b.id === bgId) ?? BG_OPTIONS[0];

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Change background"
      onMouseDown={handleOverlayMouseDown}
    >
      <div className={styles.panel} ref={panelRef}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>Change background</div>
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
                  onClick={() => handleSelect(bg)}
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
                  onClick={() => handleSelect(bg)}
                  aria-label="Select color"
                  style={styleForBg(bg)}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.bottomPad} />
      </div>
    </div>
  );
}
