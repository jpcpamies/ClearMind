import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import type { User, AuthState, LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth';

const TOKEN_KEY = 'clearmind_token';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem(TOKEN_KEY),
    loading: true,
    error: null,
  });

  const setError = (error: string | null) => {
    setAuthState(prev => ({ ...prev, error, loading: false }));
  };

  const setUser = (user: User | null, token: string | null) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    setAuthState({
      user,
      token,
      loading: false,
      error: null,
    });
  };

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setAuthState(prev => ({ ...prev, user: null, token: null, loading: false }));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem(TOKEN_KEY);
      setAuthState(prev => ({ ...prev, user: null, token: null, loading: false }));
    }
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data: AuthResponse = await response.json();
      setUser(data.user, data.token);
      
      // Force page reload to trigger auth check
      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const data: AuthResponse = await response.json();
      setUser(data.user, data.token);
      
      // Force page reload to trigger auth check
      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null, null);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user: authState.user,
    token: authState.token,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    login,
    register,
    logout,
    checkAuth,
  };
}