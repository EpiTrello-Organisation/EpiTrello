import { getAccessToken, logout } from '@/auth/token';
import { API_BASE_URL } from '@/config/api';

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const token = getAccessToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    logout();
    window.location.replace('/login');
    throw new Error('Unauthorized');
  }

  return res;
}
