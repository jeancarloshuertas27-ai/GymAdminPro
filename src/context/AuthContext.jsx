import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../utils/api';

const AuthContext = createContext(null);

export function getPortalFromPath(path = window.location.pathname) {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/recepcion')) return 'recepcion';
  if (path.startsWith('/miembro')) return 'miembro';
  return null;
}

export function getStorageKeyForPortal(portal) {
  switch (portal) {
    case 'admin':
      return 'gym_admin_session';
    case 'recepcion':
      return 'gym_recepcion_session';
    case 'miembro':
      return 'gym_miembro_session';
    default:
      return 'gym_general_session';
  }
}

export function readPortalSession(portal) {
  if (!portal) return { user: null, token: null };
  try {
    const key = getStorageKeyForPortal(portal);
    const raw = localStorage.getItem(key);
    if (!raw) return { user: null, token: null };
    const parsed = JSON.parse(raw);
    return {
      user: parsed.user || null,
      token: parsed.token || null,
    };
  } catch {
    return { user: null, token: null };
  }
}

export function writePortalSession(portal, user, token) {
  if (!portal) return;
  const key = getStorageKeyForPortal(portal);
  if (!user && !token) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify({ user, token, timestamp: Date.now() }));
  }
}

export function AuthProvider({ children }) {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  // Mantener sesiones independientes por portal en memoria
  const [sessions, setSessions] = useState(() => ({
    admin: readPortalSession('admin'),
    recepcion: readPortalSession('recepcion'),
    miembro: readPortalSession('miembro'),
  }));

  const [loading, setLoading] = useState(false);

  // Escuchar cambios de navegación (pushState/popState)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const envPortalMode = import.meta.env?.VITE_PORTAL_MODE;
  const fallbackPortal = ['admin', 'recepcion', 'miembro'].includes(envPortalMode) ? envPortalMode : null;
  const activePortal = getPortalFromPath(currentPath) || fallbackPortal;
  const activeSession = activePortal ? sessions[activePortal] : { user: null, token: null };
  const user = activeSession.user;
  const token = activeSession.token;

  const login = async (username, password, portal = activePortal) => {
    setLoading(true);
    try {
      const endpoint = getApiUrl(portal ? `/api/auth/login/${portal}` : '/api/auth/login');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, portal }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      const targetPortal = portal || getPortalFromPath(data.user.redirectTo);
      if (targetPortal) {
        if (targetPortal === 'miembro' && data.user?.id) {
          sessionStorage.removeItem(`gym_promo_popup_shown_${data.user.id}`);
        }
        writePortalSession(targetPortal, data.user, data.token);
        setSessions(prev => ({
          ...prev,
          [targetPortal]: { user: data.user, token: data.token }
        }));
      }

      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (portal = activePortal) => {
    try {
      const session = portal ? sessions[portal] : activeSession;
      if (session.token) {
        await fetch(getApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` },
        });
      }
    } catch (e) {
      console.warn('Error en logout:', e);
    } finally {
      if (portal) {
        if (portal === 'miembro') {
          Object.keys(sessionStorage).forEach((k) => {
            if (k.startsWith('gym_promo_popup_shown_')) {
              sessionStorage.removeItem(k);
            }
          });
        }
        writePortalSession(portal, null, null);
        setSessions(prev => ({
          ...prev,
          [portal]: { user: null, token: null }
        }));
      }
    }
  };

  const authFetch = useCallback((url, options = {}, portal = activePortal) => {
    const headers = options.headers || {};
    const session = portal ? sessions[portal] : activeSession;
    const activeToken = session?.token;

    if (activeToken) {
      if (headers instanceof Headers) {
        headers.set('Authorization', `Bearer ${activeToken}`);
      } else {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }
    }
    return fetch(getApiUrl(url), { ...options, headers });
  }, [sessions, activePortal, activeSession]);

  const value = {
    user,
    token,
    activePortal,
    isAdmin: user?.rol === 'ADMINISTRADOR' || activePortal === 'admin',
    sessions,
    loading,
    login,
    logout,
    authFetch,
    setCurrentPath,
    getPortalSession: (p) => sessions[p] || { user: null, token: null },
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
