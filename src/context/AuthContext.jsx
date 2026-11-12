import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gymcore_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('gymcore_token') || localStorage.getItem('token') || null;
  });

  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('gymcore_user', JSON.stringify(data.user));
      localStorage.setItem('gymcore_token', data.token);
      localStorage.setItem('token', data.token);

      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      console.warn('Error during logout:', e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('gymcore_user');
      localStorage.removeItem('gymcore_token');
      localStorage.removeItem('token');
    }
  };

  const authFetch = (url, options = {}) => {
    const headers = options.headers || {};
    const activeToken = token || localStorage.getItem('gymcore_token') || localStorage.getItem('token');
    if (activeToken) {
      if (headers instanceof Headers) {
        headers.set('Authorization', `Bearer ${activeToken}`);
      } else {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }
    }
    return fetch(url, { ...options, headers });
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    authFetch,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
