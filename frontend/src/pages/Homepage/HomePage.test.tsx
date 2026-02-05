import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from './HomePage';

const nav = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => nav.navigate,
  };
});

describe('pages/HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.navigate = vi.fn();
  });

  it('renders nav and buttons', () => {
    render(<HomePage />);

    expect(screen.getByText('EpiTrello')).toBeTruthy();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /log in/i })).toBeTruthy();
    expect(screen.getByText(/homepage très simple/i)).toBeTruthy();
  });

  it('navigates to /signup when clicking "Sign up"', () => {
    render(<HomePage />);

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('/signup');
  });

  it('navigates to /login when clicking "Log in"', () => {
    render(<HomePage />);

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('/login');
  });
});
