import React, { createContext, useContext, useEffect, useState } from 'react';

import api from '../lib/api';
import { clearAuthStorage, getRefreshToken, getStoredUser, setAuthStorage } from '../lib/authStorage';
import { clearGuestSession, ensureGuestSession, isGuestModeEnabled } from '../lib/guestStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [guestMode, setGuestMode] = useState(() => isGuestModeEnabled());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const storedUser = getStoredUser();
      if (!storedUser) {
        if (active) {
          setGuestMode(isGuestModeEnabled());
          setReady(true);
        }
        return;
      }

      try {
        const response = await api.get('/auth/me/');
        if (active) {
          setUser(response.data.user);
        }
      } catch (_error) {
        clearAuthStorage();
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setReady(true);
        }
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const persistAuth = (payload) => {
    clearGuestSession();
    setAuthStorage(payload);
    setUser(payload.user);
    setGuestMode(false);
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    persistAuth(response.data);
    return response.data.user;
  };

  const register = async ({ email, password, name }) => {
    const response = await api.post('/auth/register/', { email, password, name });
    persistAuth(response.data);
    return response.data.user;
  };

  const loginWithGoogle = async (credential) => {
    const response = await api.post('/auth/google/', { credential });
    persistAuth(response.data);
    return response.data.user;
  };

  const logout = async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } catch (_error) {
      // Local cleanup is still the important part for JWT-based logout on the client.
    } finally {
      clearAuthStorage();
      clearGuestSession();
      setUser(null);
      setGuestMode(false);
    }
  };

  const enterGuestMode = () => {
    clearAuthStorage();
    ensureGuestSession();
    setUser(null);
    setGuestMode(true);
  };

  const exitGuestMode = () => {
    clearGuestSession();
    setGuestMode(false);
  };

  const value = {
    ready,
    user,
    isAuthenticated: Boolean(user),
    isGuest: guestMode && !user,
    canPlay: Boolean(user) || guestMode,
    login,
    register,
    loginWithGoogle,
    logout,
    enterGuestMode,
    exitGuestMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return value;
}
