import { describe, it, expect, beforeEach } from 'vitest';
import { getAccessToken, isAuthenticated, logout } from './token';

describe('auth/token', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getAccessToken returns null if missing', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('getAccessToken returns token if present', () => {
    localStorage.setItem('access_token', 'abc');
    expect(getAccessToken()).toBe('abc');
  });

  it('isAuthenticated is false when no token', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('isAuthenticated is true when token exists', () => {
    localStorage.setItem('access_token', 'abc');
    expect(isAuthenticated()).toBe(true);
  });

  it('logout removes token', () => {
    localStorage.setItem('access_token', 'abc');
    logout();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('isAuthenticated is false when token is empty string', () => {
    localStorage.setItem('access_token', '');
    expect(isAuthenticated()).toBe(false);
  });
});
