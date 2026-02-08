// RichTextEditor.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RichTextEditor from './RichTextEditor';

// ---- CSS module mock (so className strings are stable in tests)
vi.mock('./RichTextEditor.module.css', () => ({
  default: {
    wrapper: 'wrapper',
    toolbar: 'toolbar',
    group: 'group',
    sep: 'sep',
    toolBtn: 'toolBtn',
    toolBtnActive: 'toolBtnActive',
    toolIcon: 'toolIcon',
    editorArea: 'editorArea',
    editor: 'editor',
    actions: 'actions',
    actionsLeft: 'actionsLeft',
    saveBtn: 'saveBtn',
    cancelBtn: 'cancelBtn',
    formatHelpBtn: 'formatHelpBtn',
  },
}));

// ---- heroicons mock
vi.mock('@heroicons/react/24/outline', () => {
  const Icon = (props: any) => <svg data-testid="icon" {...props} />;
  return {
    BoldIcon: Icon,
    ItalicIcon: Icon,
    StrikethroughIcon: Icon,
    ListBulletIcon: Icon,
    NumberedListIcon: Icon,
    LinkIcon: Icon,
  };
});

// ---- TipTap mock
type Chain = {
  focus: () => Chain;
  toggleBold: () => Chain;
  toggleItalic: () => Chain;
  toggleStrike: () => Chain;
  toggleBulletList: () => Chain;
  toggleOrderedList: () => Chain;
  unsetLink: () => Chain;
  setLink: (opts: any) => Chain;
  run: () => void;
};

type EditorMock = {
  isActive: (name: string) => boolean;
  chain: () => Chain;
  getHTML: () => string;
  commands: { setContent: (html: string, opts?: any) => void };
  getAttributes: (name: string) => any;
};

let editorMock: EditorMock | null = null;

vi.mock('@tiptap/react', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    useEditor: () => editorMock,
    EditorContent: () => React.createElement('div', { 'data-testid': 'EditorContent' }, 'Editor'),
  };
});

vi.mock('@tiptap/starter-kit', () => ({ default: {} }));

function makeEditor(overrides?: Partial<EditorMock>): EditorMock {
  const run = vi.fn();

  const chainObj: Chain = {
    focus: () => chainObj,
    toggleBold: () => chainObj,
    toggleItalic: () => chainObj,
    toggleStrike: () => chainObj,
    toggleBulletList: () => chainObj,
    toggleOrderedList: () => chainObj,
    unsetLink: () => chainObj,
    setLink: () => chainObj,
    run: () => run(),
  };

  const base: EditorMock = {
    isActive: (_name: string) => false,
    chain: () => chainObj,
    getHTML: () => '<p></p>',
    commands: { setContent: vi.fn() },
    getAttributes: (_name: string) => ({}),
  };

  return { ...base, ...overrides };
}

describe('components/CardModal/RichTextEditor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    editorMock = makeEditor();
    window.open = vi.fn();
    window.prompt = vi.fn();
  });

  it('returns null when editor is not ready', () => {
    editorMock = null;
    const { container } = render(
      <RichTextEditor value="<p>x</p>" onSave={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders toolbar, editor content and action buttons', () => {
    render(<RichTextEditor value="<p>Hello</p>" onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('EditorContent')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Formatting help' })).toBeTruthy();

    // toolbar buttons by aria-label
    expect(screen.getByRole('button', { name: 'Bold' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Strikethrough' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bullet list' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Numbered list' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Link' })).toBeTruthy();
  });

  it('applies active class when editor.isActive returns true', () => {
    editorMock = makeEditor({
      isActive: (name) => name === 'bold' || name === 'bulletList',
    });

    render(<RichTextEditor value="<p>Hello</p>" onSave={vi.fn()} onCancel={vi.fn()} />);

    const bold = screen.getByRole('button', { name: 'Bold' });
    const bullets = screen.getByRole('button', { name: 'Bullet list' });
    const italic = screen.getByRole('button', { name: 'Italic' });

    expect(bold.className).toContain('toolBtnActive');
    expect(bullets.className).toContain('toolBtnActive');
    expect(italic.className).not.toContain('toolBtnActive');
  });

  it('Save calls onSave with "" when html is considered empty', () => {
    const onSave = vi.fn();
    editorMock = makeEditor({
      getHTML: () => '<p></p>', // empty by isEmptyHtml
    });

    render(<RichTextEditor value="<p></p>" onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('');
  });

  it('Save calls onSave with html when not empty', () => {
    const onSave = vi.fn();
    editorMock = makeEditor({
      getHTML: () => '<p>Hello</p>',
    });

    render(<RichTextEditor value="<p>Hello</p>" onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith('<p>Hello</p>');
  });

  it('Cancel calls onCancel', () => {
    const onCancel = vi.fn();
    render(<RichTextEditor value="<p>Hello</p>" onSave={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Formatting help opens commonmark help in a new tab', () => {
    render(<RichTextEditor value="<p>Hello</p>" onSave={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Formatting help' }));
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(
      'https://commonmark.org/help/',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('toolbar buttons call the expected chain commands', () => {
    const run = vi.fn();

    const chainObj: Chain = {
      focus: () => chainObj,
      toggleBold: () => chainObj,
      toggleItalic: () => chainObj,
      toggleStrike: () => chainObj,
      toggleBulletList: () => chainObj,
      toggleOrderedList: () => chainObj,
      unsetLink: () => chainObj,
      setLink: (_opts: any) => chainObj,
      run: () => run(),
    };

    editorMock = makeEditor({
      chain: () => chainObj,
    });

    render(<RichTextEditor value="<p>Hello</p>" onSave={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Bold' }));
    fireEvent.click(screen.getByRole('button', { name: 'Italic' }));
    fireEvent.click(screen.getByRole('button', { name: 'Strikethrough' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bullet list' }));
    fireEvent.click(screen.getByRole('button', { name: 'Numbered list' }));

    // Each click ends with .run()
    expect(run).toHaveBeenCalledTimes(5);
  });

  it('Link button: prompt cancel does nothing', () => {
    const run = vi.fn();

    const chainObj: Chain = {
      focus: () => chainObj,
      toggleBold: () => chainObj,
      toggleItalic: () => chainObj,
      toggleStrike: () => chainObj,
      toggleBulletList: () => chainObj,
      toggleOrderedList: () => chainObj,
      unsetLink: () => chainObj,
      setLink: (_opts: any) => chainObj,
      run: () => run(),
    };

    editorMock = makeEditor({
      chain: () => chainObj,
      getAttributes: () => ({ href: 'https://old' }),
    });

    (window.prompt as any) = vi.fn(() => null);

    render(<RichTextEditor value="<p>Hello</p>" onSave={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Link' }));

    // No run since we returned early
    expect(run).toHaveBeenCalledTimes(0);
  });

  it('Link button: empty string unsets link', () => {
    const run = vi.fn();
    const unsetLink = vi.fn();
    const setLink = vi.fn();

    // chain self-referential: chaque méthode retourne le même objet
    const chain: any = {};
    chain.focus = () => chain;
    chain.unsetLink = () => {
      unsetLink();
      return chain;
    };
    chain.setLink = (_opts: any) => {
      setLink(_opts);
      return chain;
    };
    chain.run = () => run();

    editorMock = makeEditor({
      chain: () => chain,
    });

    (window.prompt as any) = vi.fn(() => '   ');

    render(<RichTextEditor value="<p>Hello</p>" onSave={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Link' }));

    expect(unsetLink).toHaveBeenCalledTimes(1);
    expect(setLink).toHaveBeenCalledTimes(0);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('Link button: non-empty url sets link (trimmed)', () => {
    const run = vi.fn();
    const unsetLink = vi.fn();
    const setLink = vi.fn();

    const chain: any = {};
    chain.focus = () => chain;
    chain.unsetLink = () => {
      unsetLink();
      return chain;
    };
    chain.setLink = (opts: any) => {
      setLink(opts);
      return chain;
    };
    chain.run = () => run();

    editorMock = makeEditor({
      chain: () => chain,
    });

    (window.prompt as any) = vi.fn(() => '  https://example.com  ');

    render(<RichTextEditor value="<p>Hello</p>" onSave={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Link' }));

    expect(setLink).toHaveBeenCalledTimes(1);
    expect(setLink).toHaveBeenCalledWith({ href: 'https://example.com' });
    expect(unsetLink).toHaveBeenCalledTimes(0);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('sync effect: when value changes and differs from editor.getHTML, setContent is called with emitUpdate:false', () => {
    const setContent = vi.fn();

    editorMock = makeEditor({
      getHTML: () => '<p>Old</p>',
      commands: { setContent },
    });

    const { rerender } = render(
      <RichTextEditor value="<p>Old</p>" onSave={vi.fn()} onCancel={vi.fn()} />,
    );

    rerender(<RichTextEditor value="<p>New</p>" onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(setContent).toHaveBeenCalledTimes(1);
    expect(setContent).toHaveBeenCalledWith('<p>New</p>', { emitUpdate: false });
  });

  it('sync effect: when value is blank, it uses <p></p>', () => {
    const setContent = vi.fn();

    editorMock = makeEditor({
      getHTML: () => '<p>Old</p>',
      commands: { setContent },
    });

    const { rerender } = render(
      <RichTextEditor value="<p>Old</p>" onSave={vi.fn()} onCancel={vi.fn()} />,
    );

    rerender(<RichTextEditor value="   " onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(setContent).toHaveBeenCalledWith('<p></p>', { emitUpdate: false });
  });
});
