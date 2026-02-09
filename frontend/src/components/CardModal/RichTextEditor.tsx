import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import styles from './RichTextEditor.module.css';

import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

type Props = {
  value: string;
  onSave: (html: string) => void;
  onCancel: () => void;
};

function isEmptyHtml(html: string) {
  const normalized = html
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<\/?p>/gi, '')
    .trim();
  return normalized.length === 0;
}

export default function RichTextEditor({ value, onSave, onCancel }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value && value.trim().length > 0 ? value : '<p></p>',
    autofocus: true,
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
  });

  // Sync when switching cards
  useEffect(() => {
    if (!editor) return;
    const next = value && value.trim().length > 0 ? value : '<p></p>';
    if (editor.getHTML() !== next) editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  function handleSave() {
    const html = editor.getHTML();
    onSave(isEmptyHtml(html) ? '' : html);
  }

  function setLink() {
    const previousUrl = editor.getAttributes('link')?.href as string | undefined;
    const url = window.prompt('Link URL', previousUrl ?? '');
    if (url === null) return; // cancelled
    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url.trim() }).run();
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.group}>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('bold') ? styles.toolBtnActive : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
            title="Bold"
          >
            <BoldIcon className={styles.toolIcon} />
          </button>

          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('italic') ? styles.toolBtnActive : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
            title="Italic"
          >
            <ItalicIcon className={styles.toolIcon} />
          </button>

          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('strike') ? styles.toolBtnActive : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
            title="Strikethrough"
          >
            <StrikethroughIcon className={styles.toolIcon} />
          </button>
        </div>

        <div className={styles.sep} />

        <div className={styles.group}>
          <button
            type="button"
            className={`${styles.toolBtn} ${
              editor.isActive('bulletList') ? styles.toolBtnActive : ''
            }`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet list"
            title="Bullet list"
          >
            <ListBulletIcon className={styles.toolIcon} />
          </button>

          <button
            type="button"
            className={`${styles.toolBtn} ${
              editor.isActive('orderedList') ? styles.toolBtnActive : ''
            }`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Numbered list"
            title="Numbered list"
          >
            <NumberedListIcon className={styles.toolIcon} />
          </button>
        </div>

        <div className={styles.sep} />

        <div className={styles.group}>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('link') ? styles.toolBtnActive : ''}`}
            onClick={setLink}
            aria-label="Link"
            title="Link"
          >
            <LinkIcon className={styles.toolIcon} />
          </button>
        </div>
      </div>

      <div className={styles.editorArea}>
        <div className={styles.editor}>
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.actionsLeft}>
          <button type="button" className={styles.saveBtn} onClick={handleSave}>
            Save
          </button>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
        </div>

        <button
          type="button"
          className={styles.formatHelpBtn}
          onClick={() =>
            window.open('https://commonmark.org/help/', '_blank', 'noopener,noreferrer')
          }
        >
          Formatting help
        </button>
      </div>
    </div>
  );
}
