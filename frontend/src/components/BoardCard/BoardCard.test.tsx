import { render, screen } from '@testing-library/react';
import BoardCard, { type CardModel } from './BoardCard';
import { vi } from 'vitest';

vi.mock('@/constants/labels', () => ({
  LABELS: [{ color: '#1' }, { color: '#2' }, { color: '#3' }, { color: '#4' }],
}));

function makeCard(partial: Partial<CardModel> = {}): CardModel {
  return {
    id: partial.id ?? '1',
    title: partial.title ?? 'My card',
    description: partial.description ?? null,
    position: partial.position ?? 0,
    list_id: partial.list_id ?? 'list-1',
    creator_id: partial.creator_id ?? 'user-1',
    created_at: partial.created_at ?? new Date().toISOString(),
    label_ids: partial.label_ids ?? [],
    members: partial.members,
  };
}

test('renders card title', () => {
  render(<BoardCard card={makeCard({ label_ids: [0, 3] })} onOpen={() => {}} />);
  expect(screen.getByText('My card')).toBeInTheDocument();
});

test('renders label stripes when activeLabels exist', () => {
  const { container } = render(
    <BoardCard card={makeCard({ label_ids: [0, 3] })} onOpen={() => {}} />,
  );

  const stripesWrap = container.querySelector('[aria-hidden="true"]');
  expect(stripesWrap).toBeTruthy();

  const stripes = container.querySelectorAll('span');
  expect(stripes.length).toBe(2);
});

test('does NOT render label stripes when label_ids is empty', () => {
  const { container } = render(<BoardCard card={makeCard({ label_ids: [] })} onOpen={() => {}} />);

  const stripesWrap = container.querySelector('[aria-hidden="true"]');
  expect(stripesWrap).toBeNull();
});

test('treats missing label_ids as empty array (covers ?? [])', () => {
  const { container } = render(
    <BoardCard card={makeCard({ label_ids: undefined as any })} onOpen={() => {}} />,
  );

  expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
});

test('covers label_ids ?? [] branch when label_ids is missing', () => {
  const c: any = {
    id: '1',
    title: 'My card',
    description: null,
    position: 0,
    list_id: 'list-1',
    creator_id: 'user-1',
    created_at: new Date().toISOString(),
  };

  const { container } = render(<BoardCard card={c} onOpen={() => {}} />);

  expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
});

test('renders member avatars with initials', () => {
  const card = makeCard({
    members: [
      { user_id: 'u1', username: 'Alice Bob' },
      { user_id: 'u2', username: 'Charlie' },
    ],
  });
  render(<BoardCard card={card} onOpen={() => {}} />);

  expect(screen.getByLabelText('Alice Bob')).toHaveTextContent('AB');
  expect(screen.getByLabelText('Charlie')).toHaveTextContent('C');
});

test('initialsForName handles single word name', () => {
  const card = makeCard({ members: [{ user_id: 'u1', username: 'Zoe' }] });
  render(<BoardCard card={card} onOpen={() => {}} />);
  expect(screen.getByLabelText('Zoe')).toHaveTextContent('Z');
});

test('initialsForName handles empty/whitespace name', () => {
  const card = makeCard({ members: [{ user_id: 'u1', username: '   ' }] });
  const { container } = render(<BoardCard card={card} onOpen={() => {}} />);
  const avatar = container.querySelector('[class*="memberAvatar"]');
  expect(avatar).toBeTruthy();
  expect(avatar!.textContent).toBe('U');
});

test('does not render members section when members is empty', () => {
  const card = makeCard({ members: [] });
  const { container } = render(<BoardCard card={card} onOpen={() => {}} />);
  expect(container.querySelectorAll('[class*="memberAvatar"]')).toHaveLength(0);
});

test('calls onOpen when card is clicked', () => {
  const onOpen = vi.fn();
  render(<BoardCard card={makeCard()} onOpen={onOpen} />);
  screen.getByRole('button', { name: /open card/i }).click();
  expect(onOpen).toHaveBeenCalledTimes(1);
});
