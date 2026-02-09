import { test as base, type Page } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Shared helpers & fixtures                                          */
/* ------------------------------------------------------------------ */

const API = 'http://127.0.0.1:8000';

/** Generate a unique email for each test run to avoid collisions. */
export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}+${Date.now()}+${Math.random().toString(36).slice(2, 7)}@test.com`;
}

export interface TestUser {
  email: string;
  username: string;
  password: string;
}

/** Register a user directly via the API (fast, no UI). */
export async function registerViaApi(user: TestUser): Promise<void> {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (res.status !== 200 && res.status !== 400) {
    throw new Error(`Register failed: ${res.status}`);
  }
}

/** Login via API and return the JWT. */
export async function loginViaApi(email: string, password: string): Promise<string> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/** Inject the JWT into the page's localStorage so navigation is authenticated. */
export async function injectToken(page: Page, token: string): Promise<void> {
  await page.addInitScript((t) => {
    localStorage.setItem('access_token', t);
  }, token);
}

/** Register + login + inject token – the full "authenticated page" shortcut. */
export async function setupAuthenticatedUser(
  page: Page,
  user?: Partial<TestUser>,
): Promise<TestUser & { token: string }> {
  const u: TestUser = {
    email: user?.email ?? uniqueEmail(),
    username: user?.username ?? `user_${Date.now()}`,
    password: user?.password ?? 'Password123!',
  };

  await registerViaApi(u);
  const token = await loginViaApi(u.email, u.password);
  await injectToken(page, token);

  return { ...u, token };
}

/** Create a board via API and return its id + title. */
export async function createBoardViaApi(
  token: string,
  title = 'E2E Board',
): Promise<{ id: string; title: string }> {
  const res = await fetch(`${API}/api/boards/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, background_kind: 'gradient', background_value: 'g-1' }),
  });
  if (!res.ok) throw new Error(`Create board failed: ${res.status}`);
  const data = (await res.json()) as { id: string; title: string };
  return data;
}

/** Create a list via API. */
export async function createListViaApi(
  token: string,
  boardId: string,
  title = 'E2E List',
): Promise<{ id: string; title: string }> {
  const res = await fetch(`${API}/api/lists/?board_id=${boardId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Create list failed: ${res.status}`);
  return (await res.json()) as { id: string; title: string };
}

/** Create a card via API. */
export async function createCardViaApi(
  token: string,
  listId: string,
  title = 'E2E Card',
): Promise<{ id: string; title: string }> {
  const res = await fetch(`${API}/api/cards/?list_id=${listId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Create card failed: ${res.status}`);
  return (await res.json()) as { id: string; title: string };
}

/* Re-export base test so every spec can import from here. */
export { base as test };
export { expect } from '@playwright/test';
