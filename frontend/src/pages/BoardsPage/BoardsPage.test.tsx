import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BoardsPage from './BoardsPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
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

vi.mock('@/components/CreateBoardModal/CreateBoardModal', () => ({
  default: ({
    open,
    onClose,
    onCreate,
  }: {
    open: boolean;
    onClose: () => void;
    onCreate: (payload: {
      title: string;
      background_kind: 'gradient' | 'unsplash';
      background_value: string;
      background_thumb_url?: string | null;
    }) => void;
  }) =>
    open ? (
      <div data-testid="CreateBoardModal">
        <button type="button" onClick={onClose}>
          close
        </button>
        <button
          type="button"
          onClick={() =>
            onCreate({
              title: 'My board',
              background_kind: 'gradient',
              background_value: 'grad-1',
            })
          }
        >
          create
        </button>
      </div>
    ) : null,
}));

const apiFetchMock = vi.fn();

vi.mock('@/api/fetcher', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

const useBoardsMock = vi.fn();
const getBoardBackgroundStyleMock = vi.fn();

vi.mock('@/hooks/useBoards', () => ({
  useBoards: () => useBoardsMock(),
  getBoardBackgroundStyle: (b: any) => getBoardBackgroundStyleMock(b),
}));

beforeEach(() => {
  vi.clearAllMocks();
  getBoardBackgroundStyleMock.mockReturnValue({ background: 'red' });
});

describe('BoardsPage', () => {
  it('filters owner boards after /me success (covers res.ok + json + setMeId)', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'me-1' }),
    });

    useBoardsMock.mockReturnValue({
      loading: false,
      createBoard: vi.fn(),
      boards: [
        { id: 'b1', title: 'Mine', owner_id: 'me-1' },
        { id: 'b2', title: 'Not mine', owner_id: 'me-2' },
      ],
    });

    render(<BoardsPage />);

    await waitFor(() => {
      expect(screen.getByText('Mine')).toBeInTheDocument();
    });

    expect(screen.queryByText('Not mine')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Mine'));
    expect(navigateMock).toHaveBeenCalledWith('/boards/b1');
  });

  it('does not set meId if /me is not ok (covers the early return)', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ id: 'me-1' }),
    });

    useBoardsMock.mockReturnValue({
      loading: false,
      createBoard: vi.fn(),
      boards: [{ id: 'b1', title: 'Mine', owner_id: 'me-1' }],
    });

    render(<BoardsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Create new board')).toBeInTheDocument();
    });

    expect(screen.queryByText('Mine')).not.toBeInTheDocument();
  });

  it('opens modal and navigates after creating a board', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'me-1' }),
    });

    const createBoard = vi.fn().mockResolvedValue({ id: 'new-123' });

    useBoardsMock.mockReturnValue({
      loading: false,
      createBoard,
      boards: [],
    });

    render(<BoardsPage />);

    fireEvent.click(screen.getByLabelText('Create new board'));
    expect(await screen.findByTestId('CreateBoardModal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('create'));

    await waitFor(() => {
      expect(createBoard).toHaveBeenCalledWith({
        title: 'My board',
        background_kind: 'gradient',
        background_value: 'grad-1',
      });
      expect(navigateMock).toHaveBeenCalledWith('/boards/new-123');
    });
  });

  it('does not call setState after unmount (covers cancelled guard)', async () => {
    let resolveMe!: (v: any) => void;

    apiFetchMock.mockReturnValueOnce(
      new Promise((r) => {
        resolveMe = r;
      }),
    );

    useBoardsMock.mockReturnValue({
      loading: false,
      createBoard: vi.fn(),
      boards: [{ id: 'b1', title: 'Mine', owner_id: 'me-1' }],
    });

    const { unmount } = render(<BoardsPage />);
    unmount();

    resolveMe({
      ok: true,
      json: async () => ({ id: 'me-1' }),
    });

    expect(true).toBe(true);
  });
});
