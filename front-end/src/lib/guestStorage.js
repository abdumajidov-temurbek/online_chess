const GUEST_MODE_KEY = 'castle.guest.enabled';
const GUEST_SESSION_KEY = 'guest_session_id';
const LEGACY_GUEST_SESSION_KEY = 'castle.guest.session';

function createGuestSessionId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isGuestModeEnabled() {
  return window.localStorage.getItem(GUEST_MODE_KEY) === 'true';
}

export function getGuestSessionId() {
  return window.localStorage.getItem(GUEST_SESSION_KEY) || window.localStorage.getItem(LEGACY_GUEST_SESSION_KEY) || '';
}

export function ensureGuestSession() {
  let guestSessionId = getGuestSessionId();
  if (!guestSessionId) {
    guestSessionId = createGuestSessionId();
  }
  window.localStorage.setItem(GUEST_SESSION_KEY, guestSessionId);
  window.localStorage.removeItem(LEGACY_GUEST_SESSION_KEY);
  window.localStorage.setItem(GUEST_MODE_KEY, 'true');
  return guestSessionId;
}

export function setGuestSessionId(guestSessionId) {
  if (!guestSessionId) {
    return;
  }

  window.localStorage.setItem(GUEST_SESSION_KEY, guestSessionId);
  window.localStorage.removeItem(LEGACY_GUEST_SESSION_KEY);
}

export function clearGuestSession() {
  window.localStorage.removeItem(GUEST_MODE_KEY);
  window.localStorage.removeItem(GUEST_SESSION_KEY);
  window.localStorage.removeItem(LEGACY_GUEST_SESSION_KEY);
}
