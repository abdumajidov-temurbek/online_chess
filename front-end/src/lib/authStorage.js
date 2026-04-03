const ACCESS_TOKEN_KEY = 'castle.auth.access';
const REFRESH_TOKEN_KEY = 'castle.auth.refresh';
const USER_KEY = 'castle.auth.user';

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || '';
}

export function getRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) || '';
}

export function getStoredUser() {
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (_error) {
    clearAuthStorage();
    return null;
  }
}

export function setAuthStorage({ access, refresh, user }) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthStorage() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
