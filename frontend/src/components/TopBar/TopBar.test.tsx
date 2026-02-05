import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopBar from './TopBar';

const navigateMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/auth/token', () => ({
  logout: () => logoutMock(),
}));

function renderTopBar() {
  return render(
    <MemoryRouter>
      <TopBar />
    </MemoryRouter>,
  );
}

function firePointerDown(target: EventTarget) {
  const ev = new PointerEvent('pointerdown', { bubbles: true });
  Object.defineProperty(ev, 'target', { value: target });
  window.dispatchEvent(ev);
}

describe('components/TopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('renders base UI: link to boards, search input, Create button', () => {
    renderTopBar();

    expect(screen.getByRole('link', { name: /go to boards/i })).toBeTruthy();
    expect(screen.getByRole('searchbox', { name: /search boards/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /create/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /profile/i })).toBeTruthy();
  });

  it('toggles profile menu when clicking Profile', () => {
    renderTopBar();

    expect(screen.queryByRole('button', { name: /^theme$/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(screen.getByRole('button', { name: /^theme$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /log out/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(screen.queryByRole('button', { name: /^theme$/i })).toBeNull();
  });

  it('Theme button toggles theme submenu', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));

    expect(screen.queryByRole('button', { name: /match system/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));

    expect(screen.getByRole('button', { name: /light/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /dark/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /match system/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));
    expect(screen.queryByRole('button', { name: /match system/i })).toBeNull();
  });

  it('clicking Profile closes theme submenu (setThemeOpen(false))', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));
    expect(screen.getByRole('button', { name: /match system/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(screen.queryByRole('button', { name: /match system/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(screen.queryByRole('button', { name: /match system/i })).toBeNull();
  });

//   it('clicking outside closes menu and theme when menuOpen is true', () => {
//     const { container } = renderTopBar();

//     fireEvent.click(screen.getByRole('button', { name: /profile/i }));
//     fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));
//     expect(screen.getByRole('button', { name: /match system/i })).toBeTruthy();

//     const outside = document.createElement('div');
//     document.body.appendChild(outside);

//     firePointerDown(outside);

//     expect(screen.queryByRole('button', { name: /^theme$/i })).toBeNull();
//     expect(screen.queryByRole('button', { name: /match system/i })).toBeNull();

//     expect(container.querySelector('header')).toBeTruthy();
//   });

  it('clicking inside wrapper does not close menu', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(screen.getByRole('button', { name: /^theme$/i })).toBeTruthy();

    firePointerDown(screen.getByRole('button', { name: /profile/i }));

    expect(screen.getByRole('button', { name: /^theme$/i })).toBeTruthy();
  });

  it('clicking inside theme menu does not close menu', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /^theme$/i }));

    const darkBtn = screen.getByRole('button', { name: /dark/i });
    firePointerDown(darkBtn);

    expect(screen.getByRole('button', { name: /^theme$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /match system/i })).toBeTruthy();
  });

  it('Log Out calls logout() and navigates to /login', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));

    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
});
