import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiFetch } from './fetcher';

// --- mocks ---
vi.mock('@/auth/token', () => ({
  getAccessToken: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/config/api', () => ({
  API_BASE_URL: 'http://api.test',
}));

import { getAccessToken, logout } from '@/auth/token';

describe('apiFetch', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    // mock global fetch
    (globalThis as any).fetch = fetchMock;

    // mock window.location.replace
    // (location is not always writable in jsdom, so we define it)
    Object.defineProperty(window, 'location', {
      value: { replace: vi.fn() },
      writable: true,
    });
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it('calls fetch with API_BASE_URL + path and sets Content-Type header', async () => {
    (getAccessToken as any).mockReturnValue(null);

    const res = { status: 200 } as Response;
    fetchMock.mockResolvedValue(res);

    const out = await apiFetch('/ping');

    expect(out).toBe(res);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/ping');

    expect(init).toBeDefined();
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
    });
  });

  it('adds Authorization header when token exists', async () => {
    (getAccessToken as any).mockReturnValue('abc123');

    const res = { status: 200 } as Response;
    fetchMock.mockResolvedValue(res);

    await apiFetch('/secure');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer abc123',
    });
  });

  it('does not add Authorization header when token is missing', async () => {
    (getAccessToken as any).mockReturnValue('');

    const res = { status: 200 } as Response;
    fetchMock.mockResolvedValue(res);

    await apiFetch('/public');

    const [, init] = fetchMock.mock.calls[0];
    // Ensure Authorization is not present
    expect((init.headers as any).Authorization).toBeUndefined();
  });

  it('merges user-provided headers and allows overriding Content-Type', async () => {
    (getAccessToken as any).mockReturnValue('t');

    const res = { status: 200 } as Response;
    fetchMock.mockResolvedValue(res);

    await apiFetch('/headers', {
      headers: {
        'Content-Type': 'text/plain',
        'X-Custom': 'hello',
      },
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toMatchObject({
      // user override should win because ...options.headers is last in your code
      'Content-Type': 'text/plain',
      'X-Custom': 'hello',
      Authorization: 'Bearer t',
    });
  });

  it('passes through other fetch options (method/body)', async () => {
    (getAccessToken as any).mockReturnValue(null);

    const res = { status: 200 } as Response;
    fetchMock.mockResolvedValue(res);

    await apiFetch('/post', {
      method: 'POST',
      body: JSON.stringify({ a: 1 }),
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
  });

  it('on 401: logs out, redirects to /login and throws', async () => {
    (getAccessToken as any).mockReturnValue('abc');

    const res = { status: 401 } as Response;
    fetchMock.mockResolvedValue(res);

    await expect(apiFetch('/secure')).rejects.toThrow('Unauthorized');

    expect(logout).toHaveBeenCalledTimes(1);
    expect(window.location.replace).toHaveBeenCalledWith('/login');
  });
});
