import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext.js';
import { auth } from '../api.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function loadUser(signal) {
  let res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include', signal });

  if (res.status === 401) {
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      signal,
    });
    if (!refreshRes.ok) return null;
    res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include', signal });
  }

  if (!res.ok) return null;
  const data = await res.json();
  return data.user || data;
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    loadUser(controller.signal)
      .then((u) => { setUser(u); setLoading(false); })
      .catch((err) => { if (err.name !== 'AbortError') { setUser(null); setLoading(false); } });

    const handleExpired = () => setUser(null);
    window.addEventListener('auth:expired', handleExpired);

    return () => {
      controller.abort();
      window.removeEventListener('auth:expired', handleExpired);
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await loadUser(new AbortController().signal);
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  const login = async (credentials) => {
    const data = await auth.login(credentials);
    setUser(data.user || data);
    return data;
  };

  const register = async (payload) => {
    const data = await auth.register(payload);
    return data;
  };

  const logout = async () => {
    try { await auth.logout(); } finally { setUser(null); }
  };

  const isAuthenticated = !!user;
  const isAdmin         = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, isAdmin, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
