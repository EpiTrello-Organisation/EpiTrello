import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LogInPage from './LogInPage';

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

function makeFetchResJson(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn(async () => data),
  } as any;
}

describe('pages/LogInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.navigate = vi.fn();
    localStorage.clear();

    vi.stubGlobal('fetch', vi.fn());
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <LogInPage />
      </MemoryRouter>,
    );
  }

  it('renders inputs, submit button, and signup link', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /epitrello/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /log in to continue/i })).toBeTruthy();

    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();

    expect(screen.getByRole('button', { name: /continue/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeTruthy();
  });

  it('submits to /api/auth/login with email/password', async () => {
    (fetch as any).mockResolvedValueOnce(makeFetchResJson({ access_token: 't' }, true));

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('http://api.test/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'secret' }),
    });
  });

  it('shows "Invalid email or password" when res.ok=false', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: false, status: 401 });

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'bad' } });

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /continue/i }).closest('form')!);
    });

    expect(screen.getByText(/invalid email or password/i)).toBeTruthy();
    expect(nav.navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('stores access_token and navigates to /boards when login succeeds', async () => {
    (fetch as any).mockResolvedValueOnce(makeFetchResJson({ access_token: 'jwt-123' }, true));

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    });

    expect(localStorage.getItem('access_token')).toBe('jwt-123');
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('/boards');
  });

  it('shows "Unexpected server response" when ok=true but access_token missing', async () => {
    (fetch as any).mockResolvedValueOnce(makeFetchResJson({ token_type: 'bearer' }, true));

    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    });

    expect(screen.getByText(/unexpected server response/i)).toBeTruthy();
    expect(nav.navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
