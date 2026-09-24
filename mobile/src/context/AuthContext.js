import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { getUser, getAccessToken, getRefreshToken, storeAuth, clearAuth } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedUser = await getUser();
        const token = await getAccessToken();
        const refreshToken = await getRefreshToken();

        if (storedUser && token && refreshToken) {
          setUser(storedUser);
          const res = await api.get('/auth/profile');
          setUser(res.data.data);
          await storeAuth({ user: res.data.data, accessToken: token, refreshToken });
        }
      } catch {
        await clearAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, accessToken, refreshToken } = res.data.data;
    await storeAuth({ user: userData, accessToken, refreshToken });
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password, role = 'STUDENT') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { user: userData, accessToken, refreshToken } = res.data.data;
    await storeAuth({ user: userData, accessToken, refreshToken });
    setUser(userData);
    return userData;
  }, []);

  const loginWithGoogle = useCallback(async (idToken, role = 'STUDENT') => {
    const res = await api.post('/auth/google', { idToken, role });
    const { user: userData, accessToken, refreshToken } = res.data.data;
    await storeAuth({ user: userData, accessToken, refreshToken });
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // proceed with local logout
    } finally {
      await clearAuth();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isTeacher: user?.role === 'TEACHER' || user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
