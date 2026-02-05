import { describe, it, expect, vi } from 'vitest';

describe('api.ts', () => {
  it('exports API_BASE_URL from import.meta.env.VITE_API_BASE_URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000');

    const mod = await import('./api');

    expect(mod.API_BASE_URL).toBe('http://localhost:8000');

    vi.unstubAllEnvs();
  });
});
