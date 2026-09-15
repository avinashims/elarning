import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

function storeAuth({ user, accessToken, refreshToken }) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (stored && accessToken) {
      setUser(JSON.parse(stored));
      api.get('/auth/profile')
        .then((res) => {
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        })
        .catch(() => {
          clearAuth();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, accessToken, refreshToken } = res.data.data;
    storeAuth({ user: userData, accessToken, refreshToken });
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password, role = 'STUDENT') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { user: userData, accessToken, refreshToken } = res.data.data;
    storeAuth({ user: userData, accessToken, refreshToken });
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // proceed with local logout even if API call fails
    } finally {
      clearAuth();
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isTeacher: user?.role === 'TEACHER' || user?.role === 'ADMIN',
    isStudent: user?.role === 'STUDENT',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
