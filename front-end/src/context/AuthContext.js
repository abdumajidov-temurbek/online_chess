import React, { createContext, useEffect, useMemo, useState } from 'react';

import api from '../lib/api';
import { disconnectSocket } from '../lib/socket';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const authAction = async (request) => {
    const response = await request;
    setUser(response.data.user);
    return response.data.user;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshUser,
      register: (payload) => authAction(api.post('/auth/register', payload)),
      login: (payload) => authAction(api.post('/auth/login', payload)),
      googleLogin: (payload) => authAction(api.post('/auth/google', payload)),
      forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
      resetPassword: (payload) => api.post('/auth/reset-password', payload),
      logout: async () => {
        await api.post('/auth/logout');
        disconnectSocket();
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
