import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ShareModal from './ShareModal';

const apiFetchMock = vi.fn();
vi.mock('@/api/fetcher', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

type UseMemberReturn = {
  loading: boolean;
  actions: {
    getMembers: () => Promise<any[]>;
    addMember: (email: string) => Promise<any>;
    deleteMember: (email: string) => Promise<any>;
  };
};

const useMemberMock = vi.fn();
vi.mock('@/hooks/useMember', () => ({
  useMember: (...args: any[]) => useMemberMock(...args),
}));

function mkRes(ok: boolean, json: any) {
  return { ok, json: vi.fn().mockResolvedValue(json) };
}

function memberApi(user_id: string, email: string, username: string, role: 'owner' | 'member') {
  return { user_id, email, username, role };
}

function renderModal(p?: Partial<React.ComponentProps<typeof ShareModal>>) {
  const onClose = vi.fn();
  const props: React.ComponentProps<typeof ShareModal> = {
    open: true,
    onClose,
    boardId: 'b1',
    ...p,
  };
  render(<ShareModal {...props} />);
  return { onClose };
}

beforeEach(() => {
  apiFetchMock.mockReset();
  useMemberMock.mockReset();
});

afterEach(() => cleanup());

describe('ShareModal', () => {
  it('returns null when open=false', () => {
    useMemberMock.mockReturnValue({
      loading: false,
      actions: { getMembers: vi.fn(), addMember: vi.fn(), deleteMember: vi.fn() },
    } satisfies UseMemberReturn);

    const { container } = render(<ShareModal open={false} onClose={vi.fn()} boardId="b1" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows error when boardId missing', async () => {
    useMemberMock.mockReturnValue({
      loading: false,
      actions: { getMembers: vi.fn(), addMember: vi.fn(), deleteMember: vi.fn() },
    } satisfies UseMemberReturn);

    renderModal({ boardId: undefined });

    expect(await screen.findByText('Missing board id.')).toBeInTheDocument();
    expect(screen.getByLabelText('Share board')).toBeInTheDocument();
  });

  it('fetches me + members on open and renders list + count', async () => {
    const getMembers = vi
      .fn()
      .mockResolvedValue([
        memberApi('u1', 'owner@x.com', 'Owner', 'owner'),
        memberApi('u2', 'm@x.com', 'Member', 'member'),
      ]);
    useMemberMock.mockReturnValue({
      loading: false,
      actions: { getMembers, addMember: vi.fn(), deleteMember: vi.fn() },
    } satisfies UseMemberReturn);

    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u1' }));

    renderModal();

    expect(await screen.findByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();

    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByLabelText('Remove m@x.com')).toBeInTheDocument();

    expect(screen.getByLabelText('Remove owner@x.com')).toBeDisabled();

    expect(getMembers).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith('/api/users/me');
  });

  it('handles getMembers/me failure and shows error', async () => {
    const getMembers = vi.fn().mockRejectedValue({ detail: 'Boom' });
    useMemberMock.mockReturnValue({
      loading: false,
      actions: { getMembers, addMember: vi.fn(), deleteMember: vi.fn() },
    } satisfies UseMemberReturn);

    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u1' }));

    renderModal();

    expect(await screen.findByText('Boom')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('close button calls onClose', async () => {
    useMemberMock.mockReturnValue({
      loading: false,
      actions: {
        getMembers: vi.fn().mockResolvedValue([]),
        addMember: vi.fn(),
        deleteMember: vi.fn(),
      },
    } satisfies UseMemberReturn);
    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u1' }));

    const { onClose } = renderModal();

    await userEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop click closes only if no confirmation overlay', async () => {
    const getMembers = vi
      .fn()
      .mockResolvedValue([
        memberApi('u1', 'owner@x.com', 'Owner', 'owner'),
        memberApi('u2', 'm@x.com', 'Member', 'member'),
      ]);
    useMemberMock.mockReturnValue({
      loading: false,
      actions: { getMembers, addMember: vi.fn(), deleteMember: vi.fn() },
    } satisfies UseMemberReturn);
    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u1' }));

    const { onClose } = renderModal();

    await screen.findByText('Member');

    await userEvent.click(screen.getByLabelText('Remove m@x.com'));
    expect(screen.getByLabelText('Confirm remove member')).toBeInTheDocument();

    await userEvent.pointer({
      keys: '[MouseLeft>]',
      target: screen.getAllByRole('presentation')[0],
    });
    expect(onClose).toHaveBeenCalledTimes(0);

    await userEvent.pointer({
      keys: '[MouseLeft>]',
      target: screen.getAllByRole('presentation')[1],
    });
    await waitFor(() =>
      expect(screen.queryByLabelText('Confirm remove member')).not.toBeInTheDocument(),
    );

    await userEvent.pointer({
      keys: '[MouseLeft>]',
      target: screen.getAllByRole('presentation')[0],
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape closes confirm first, then closes modal', async () => {
    const getMembers = vi
      .fn()
      .mockResolvedValue([
        memberApi('u1', 'owner@x.com', 'Owner', 'owner'),
        memberApi('u2', 'm@x.com', 'Member', 'member'),
      ]);
    useMemberMock.mockReturnValue({
      loading: false,
      actions: { getMembers, addMember: vi.fn(), deleteMember: vi.fn() },
    } satisfies UseMemberReturn);
    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u1' }));

    const { onClose } = renderModal();
    await screen.findByText('Member');

    await userEvent.click(screen.getByLabelText('Remove m@x.com'));
    expect(screen.getByLabelText('Confirm remove member')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByLabelText('Confirm remove member')).not.toBeInTheDocument(),
    );
    expect(onClose).toHaveBeenCalledTimes(0);

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('share button enabled only for valid email; Enter triggers share; trims/lowercases', async () => {
    const addMember = vi.fn().mockResolvedValue({ status: 201, detail: 'ok' });
    useMemberMock.mockReturnValue({
      loading: false,
      actions: { getMembers: vi.fn().mockResolvedValue([]), addMember, deleteMember: vi.fn() },
    } satisfies UseMemberReturn);
    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u1' }));

    renderModal();
    const input = screen.getByLabelText('Email address or name');
    const share = screen.getByRole('button', { name: 'Share' });

    expect(share).toBeDisabled();

    await userEvent.type(input, 'not-an-email');
    expect(share).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, '  TeSt@Example.com  ');
    expect(share).toBeEnabled();

    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(addMember).toHaveBeenCalledTimes(1));
    expect(addMember).toHaveBeenCalledWith('test@example.com');

    expect(await screen.findByText('ok')).toBeInTheDocument();

    expect(await screen.findByText('test')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    expect((input as HTMLInputElement).value).toBe('');
  });

  it('share shows validation error on invalid email even if clicked', async () => {
    useMemberMock.mockReturnValue({
      loading: false,
      actions: {
        getMembers: vi.fn().mockResolvedValue([]),
        addMember: vi.fn(),
        deleteMember: vi.fn(),
      },
    } satisfies UseMemberReturn);
    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u1' }));

    renderModal();

    const input = screen.getByLabelText('Email address or name');
    await userEvent.type(input, 'bad');

    await userEvent.keyboard('{Enter}');

    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
  });

  it('share blocks if email already in members', async () => {
    const getMembers = vi.fn().mockResolvedValue([memberApi('u2', 'm@x.com', 'Member', 'member')]);
    useMemberMock.mockReturnValue({
      loading: false,
      actions: { getMembers, addMember: vi.fn(), deleteMember: vi.fn() },
    } satisfies UseMemberReturn);
    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u1' }));

    renderModal();
    await screen.findByText('Member');

    const input = screen.getByLabelText('Email address or name');
    await userEvent.type(input, '  M@X.com ');
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByText('User already member of this board')).toBeInTheDocument();
  });

  it('share: non-201 resolves still shows success (covers else branch)', async () => {
    const addMember = vi.fn().mockResolvedValue({ status: 200, detail: 'Added anyway' });
    useMemberMock.mockReturnValue({
      loading: false,
      actions: { getMembers: vi.fn().mockResolvedValue([]), addMember, deleteMember: vi.fn() },
    } satisfies UseMemberReturn);
    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u1' }));

    renderModal();

    const input = screen.getByLabelText('Email address or name');
    await userEvent.type(input, 'x@y.com');
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByText('Added anyway')).toBeInTheDocument();
  });

  it('share: handles error 400 already member, 404 not found, and default error', async () => {
    const addMember = vi
      .fn()
      .mockRejectedValueOnce({ status: 400, detail: 'User already member of this board' })
      .mockRejectedValueOnce({ status: 404, detail: 'User not found' })
      .mockRejectedValueOnce({ status: 500, detail: 'Nope' });

    useMemberMock.mockReturnValue({
      loading: false,
      actions: { getMembers: vi.fn().mockResolvedValue([]), addMember, deleteMember: vi.fn() },
    } satisfies UseMemberReturn);
    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u1' }));

    renderModal();
    const input = screen.getByLabelText('Email address or name');

    await userEvent.type(input, 'a@b.com');
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(await screen.findByText('User already member of this board')).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, 'c@d.com');
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(await screen.findByText('User not found')).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, 'e@f.com');
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(await screen.findByText('Nope')).toBeInTheDocument();
  });

  it('kick flow: opens confirm, cancel closes, remove calls deleteMember and removes row', async () => {
    const getMembers = vi
      .fn()
      .mockResolvedValue([
        memberApi('u1', 'owner@x.com', 'Owner', 'owner'),
        memberApi('u2', 'm@x.com', 'Member', 'member'),
      ]);
    const deleteMember = vi.fn().mockResolvedValue({ ok: true });

    useMemberMock.mockReturnValue({
      loading: false,
      actions: { getMembers, addMember: vi.fn(), deleteMember },
    } satisfies UseMemberReturn);
    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u1' }));

    renderModal();
    await screen.findByText('Member');

    await userEvent.click(screen.getByLabelText('Remove m@x.com'));
    expect(screen.getByText('Remove member?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByLabelText('Confirm remove member')).not.toBeInTheDocument(),
    );

    await userEvent.click(screen.getByLabelText('Remove m@x.com'));
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(deleteMember).toHaveBeenCalledWith('m@x.com'));

    await waitFor(() => expect(screen.queryByText('m@x.com')).not.toBeInTheDocument());
  });

  it('kick flow: handles delete 403 owner-only and default error', async () => {
    const getMembers = vi
      .fn()
      .mockResolvedValue([
        memberApi('u1', 'owner@x.com', 'Owner', 'owner'),
        memberApi('u2', 'm@x.com', 'Member', 'member'),
      ]);
    const deleteMember = vi
      .fn()
      .mockRejectedValueOnce({ status: 403, detail: 'Only board owner can perform this action' })
      .mockRejectedValueOnce({ status: 500, detail: 'Fail' });

    useMemberMock.mockReturnValue({
      loading: false,
      actions: { getMembers, addMember: vi.fn(), deleteMember },
    } satisfies UseMemberReturn);
    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u1' }));

    renderModal();
    await screen.findByText('Member');

    await userEvent.click(screen.getByLabelText('Remove m@x.com'));
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Only board owner can perform this action')).toBeInTheDocument();

    expect(screen.queryByLabelText('Confirm remove member')).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Remove m@x.com'));
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Fail')).toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm remove member')).not.toBeInTheDocument();
  });

  it('non-owner does not see kick buttons', async () => {
    const getMembers = vi
      .fn()
      .mockResolvedValue([
        memberApi('u1', 'owner@x.com', 'Owner', 'owner'),
        memberApi('u2', 'm@x.com', 'Member', 'member'),
      ]);

    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u2' }));

    useMemberMock.mockReturnValue({
      loading: false,
      actions: { getMembers, addMember: vi.fn(), deleteMember: vi.fn() },
    } satisfies UseMemberReturn);

    renderModal();

    await screen.findByText('Member');

    expect(screen.queryByLabelText('Remove owner@x.com')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Remove m@x.com')).not.toBeInTheDocument();
  });

  it('when loading=true, disables input + prevents share/kick actions', async () => {
    const getMembers = vi
      .fn()
      .mockResolvedValue([
        memberApi('u1', 'owner@x.com', 'Owner', 'owner'),
        memberApi('u2', 'm@x.com', 'Member', 'member'),
      ]);
    const addMember = vi.fn();
    const deleteMember = vi.fn();

    useMemberMock.mockReturnValue({
      loading: true,
      actions: { getMembers, addMember, deleteMember },
    } satisfies UseMemberReturn);

    apiFetchMock.mockResolvedValue(mkRes(true, { id: 'u1' }));

    renderModal();

    const input = screen.getByLabelText('Email address or name') as HTMLInputElement;
    expect(input).toBeDisabled();

    const share = screen.getByRole('button', { name: 'Share' });
    expect(share).toBeDisabled();

    await userEvent.click(share);
    expect(addMember).not.toHaveBeenCalled();

    await waitFor(() => expect(getMembers).toHaveBeenCalledTimes(1));
  });
});
