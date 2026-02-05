import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUpPage from './SignUpPage';

vi.mock('@/config/api', () => ({
  API_BASE_URL: 'http://api.test',
}));

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

describe('pages/SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.navigate = vi.fn();
    vi.stubGlobal('fetch', vi.fn());
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>,
    );
  }

  function fillForm({
    email = 'a@b.com',
    username = 'dylan',
    password = 'password123',
    confirmPassword = 'password123',
  } = {}) {
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: username } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: password } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: confirmPassword },
    });
  }

  it('renders inputs, submit button, and login link', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /epitrello/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /sign up to continue/i })).toBeTruthy();

    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/username/i)).toBeTruthy();
    expect(screen.getByLabelText(/^password/i)).toBeTruthy();
    expect(screen.getByLabelText(/confirm password/i)).toBeTruthy();

    expect(screen.getByRole('button', { name: /sign up/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /log in/i })).toBeTruthy();
  });

  it('shows "Tous les champs sont requis" when any field is missing', async () => {
    renderPage();

    // leave empty, submit
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });

    expect(screen.getByText(/tous les champs sont requis/i)).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('shows password length error when password < 8', async () => {
    renderPage();
    fillForm({ password: '1234567', confirmPassword: '1234567' });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });

    expect(screen.getByText(/au moins 8 caractères/i)).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('shows mismatch error when password !== confirmPassword', async () => {
    renderPage();
    fillForm({ password: 'password123', confirmPassword: 'password124' });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });

    expect(screen.getByText(/ne correspondent pas/i)).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('calls register endpoint with expected payload when form valid', async () => {
    (fetch as any).mockResolvedValueOnce({ status: 200 });

    renderPage();
    fillForm({
      email: 'x@y.com',
      username: 'user1',
      password: 'password123',
      confirmPassword: 'password123',
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('http://api.test/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'x@y.com', username: 'user1', password: 'password123' }),
    });
  });

  it('navigates to /login when server returns status 200', async () => {
    (fetch as any).mockResolvedValueOnce({ status: 200 });

    renderPage();
    fillForm();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });

    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('/login');
    expect(screen.queryByText(/email already used/i)).toBeNull();
  });

  it('shows "Email already used" when server returns status 400', async () => {
    (fetch as any).mockResolvedValueOnce({ status: 400 });

    renderPage();
    fillForm();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });

    expect(nav.navigate).not.toHaveBeenCalled();
    expect(screen.getByText(/email already used/i)).toBeTruthy();
  });

  it('shows generic error when server returns unexpected status', async () => {
    (fetch as any).mockResolvedValueOnce({ status: 500 });

    renderPage();
    fillForm();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });

    expect(nav.navigate).not.toHaveBeenCalled();
    expect(screen.getByText(/une erreur est survenue/i)).toBeTruthy();
  });

  it('shows generic error when fetch throws', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('network'));

    renderPage();
    fillForm();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });

    expect(nav.navigate).not.toHaveBeenCalled();
    expect(screen.getByText(/une erreur est survenue/i)).toBeTruthy();
  });
});
