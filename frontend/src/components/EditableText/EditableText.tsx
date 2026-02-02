import { useEffect, useState } from 'react';

type Props = {
  value: string;
  className: string;
  inputClassName: string;
  onChange: (v: string) => void;
  ariaLabel: string;
};

export default function EditableText({ value, className, inputClassName, onChange, ariaLabel }: Props) {
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
      <button type="button" className={className} onClick={() => setEditing(true)} aria-label={ariaLabel}>
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
