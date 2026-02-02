import { render, screen } from '@testing-library/react';
import BoardCard, { type CardModel } from './BoardCard';

const card: CardModel = {
  id: '1',
  title: 'My card',
  description: null,
  position: 0,
  list_id: 'list-1',
  creator_id: 'user-1',
  created_at: new Date().toISOString(),
  labelIds: ['green', 'red'],
};

test('renders card title', () => {
  render(<BoardCard card={card} onOpen={() => {}} />);
  expect(screen.getByText('My card')).toBeInTheDocument();
});
