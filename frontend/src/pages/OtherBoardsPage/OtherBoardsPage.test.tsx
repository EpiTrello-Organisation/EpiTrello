import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OtherBoardsPage from './OtherBoardsPage';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual: any = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../components/TopBar/TopBar', () => ({
  default: () => <div data-testid="TopBar" />,
}));
vi.mock('../../components/SideMenu/SideMenu', () => ({
  default: () => <div data-testid="SideMenu" />,
}));

const apiFetchMock = vi.fn();
vi.mock('@/api/fetcher', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

const useBoardsMock = vi.fn();
const getBoardBackgroundStyleMock = vi.fn();
vi.mock('@/hooks/useBoards', () => ({
  useBoards: (...args: any[]) => useBoardsMock(...args),
  getBoardBackgroundStyle: (...args: any[]) => getBoardBackgroundStyleMock(...args),
}));

type Board = {
  id: string;
  title: string;
  owner_id: string;
};

function mkRes(ok: boolean, json: any) {
  return { ok, json: vi.fn().mockResolvedValue(json) };
}

function mkBoards() {
  const mine: Board = { id: 'b1', title: 'My board', owner_id: 'me' };
  const other1: Board = { id: 'b2', title: 'Other 1', owner_id: 'u2' };
  const other2: Board = { id: 'b3', title: 'Other 2', owner_id: 'u3' };
  return { mine, other1, other2 };
}

beforeEach(() => {
  navigateMock.mockReset();
  apiFetchMock.mockReset();
  useBoardsMock.mockReset();
  getBoardBackgroundStyleMock.mockReset();
});

afterEach(() => cleanup());

describe('OtherBoardsPage', () => {
  it('renders layout skeleton (TopBar + SideMenu) always', () => {
    useBoardsMock.mockReturnValue({ boards: [], loading: false });
    apiFetchMock.mockResolvedValue(mkRes(false, {}));

    render(<OtherBoardsPage />);

    expect(screen.getByTestId('TopBar')).toBeInTheDocument();
    expect(screen.getByTestId('SideMenu')).toBeInTheDocument();
  });

  it('sets aria-busy based on loading', () => {
    useBoardsMock.mockReturnValue({ boards: [], loading: true });
    apiFetchMock.mockResolvedValue(mkRes(false, {}));

    render(<OtherBoardsPage />);

    const grid = screen.getByRole('generic', { busy: true });
    expect(grid).toHaveAttribute('aria-busy', 'true');
  });

  it('does not show any cards before meId is known (memberBoards empty)', async () => {
    const { mine, other1 } = mkBoards();
    useBoardsMock.mockReturnValue({ boards: [mine, other1], loading: false });

    apiFetchMock.mockResolvedValue(mkRes(false, {}));

    render(<OtherBoardsPage />);

    expect(screen.queryByRole('button', { name: /My board/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Other 1/i })).not.toBeInTheDocument();
  });

  it('filters out boards owned by me (shows only member boards)', async () => {
    const { mine, other1, other2 } = mkBoards();
    useBoardsMock.mockReturnValue({ boards: [mine, other1, other2], loading: false });

    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'me' }));

    getBoardBackgroundStyleMock.mockImplementation((b: Board) => ({
      backgroundImage: `url(${b.id})`,
    }));

    render(<OtherBoardsPage />);

    const btnOther1 = await screen.findByRole('button', { name: /Other 1/i });
    const btnOther2 = screen.getByRole('button', { name: /Other 2/i });

    expect(screen.queryByRole('button', { name: /My board/i })).not.toBeInTheDocument();

    const preview1 = btnOther1.querySelector('div') as HTMLDivElement;
    expect(preview1.getAttribute('style') || '').toContain('url("b2")');

    const preview2 = btnOther2.querySelector('div') as HTMLDivElement;
    expect(preview2.getAttribute('style') || '').toContain('url("b3")');

    expect(getBoardBackgroundStyleMock).toHaveBeenCalledTimes(2);
    expect(getBoardBackgroundStyleMock).toHaveBeenCalledWith(other1);
    expect(getBoardBackgroundStyleMock).toHaveBeenCalledWith(other2);
  });

  it('clicking a board navigates to /boards/:id', async () => {
    const { other1 } = mkBoards();
    useBoardsMock.mockReturnValue({ boards: [other1], loading: false });

    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'me' }));
    getBoardBackgroundStyleMock.mockReturnValue({});

    render(<OtherBoardsPage />);

    const btn = await screen.findByRole('button', { name: /Other 1/i });
    await userEvent.click(btn);

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/boards/b2');
  });

  it('ignores apiFetch throw (catch block) and keeps page stable', async () => {
    const { other1 } = mkBoards();
    useBoardsMock.mockReturnValue({ boards: [other1], loading: false });

    apiFetchMock.mockRejectedValue(new Error('network'));
    getBoardBackgroundStyleMock.mockReturnValue({});

    render(<OtherBoardsPage />);

    expect(screen.getByTestId('TopBar')).toBeInTheDocument();
    expect(screen.getByTestId('SideMenu')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /Other 1/i })).not.toBeInTheDocument();
  });

  it('if /api/users/me returns ok but missing/invalid json, it should not crash (defensive)', async () => {
    const { other1 } = mkBoards();
    useBoardsMock.mockReturnValue({ boards: [other1], loading: false });

    apiFetchMock.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({}) });
    getBoardBackgroundStyleMock.mockReturnValue({});

    render(<OtherBoardsPage />);

    expect(await screen.findByTestId('TopBar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Other 1/i })).not.toBeInTheDocument();
  });

  it('cancellation: unmount before me fetch resolves should not set state (no React act warning)', async () => {
    const { other1 } = mkBoards();
    useBoardsMock.mockReturnValue({ boards: [other1], loading: false });

    let resolve!: (v: any) => void;
    const pending = new Promise((r) => (resolve = r));
    apiFetchMock.mockReturnValue(pending);

    getBoardBackgroundStyleMock.mockReturnValue({});

    const { unmount } = render(<OtherBoardsPage />);
    unmount();

    resolve(mkRes(true, { id: 'me' }));

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
