export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function logout() {
  localStorage.removeItem('access_token');
}
