import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import type { User, AuthState, LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth';

const TOKEN_KEY = 'clearmind_token';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
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
    console.log('Checking authentication...');
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
      console.log('No token found in localStorage');
      setAuthState({
        user: null,
        token: null,
        loading: false,
        error: null,
      });
      return;
    }

    try {
      console.log('Fetching user profile with token');
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('Token validation failed:', response.status);
        localStorage.removeItem(TOKEN_KEY);
        setAuthState({
          user: null,
          token: null,
          loading: false,
          error: null,
        });
        return;
      }

      const user: User = await response.json();
      console.log('User authenticated successfully:', user.displayName);
      setAuthState({
        user,
        token,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem(TOKEN_KEY);
      setAuthState({
        user: null,
        token: null,
        loading: false,
        error: null,
      });
    }
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    console.log('Attempting login for:', credentials.email);
    
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
      console.log('Login successful for:', data.user.displayName);
      setUser(data.user, data.token);
      
      // No page reload - let React handle state update
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    console.log('Attempting registration for:', userData.email);
    
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
      console.log('Registration successful for:', data.user.displayName);
      setUser(data.user, data.token);
      
      // No page reload - let React handle state update
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    }
  };

  const logout = useCallback(async () => {
    console.log('Logging out user');
    
    try {
      // Call logout endpoint if available
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authState.token}`,
        },
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with client-side logout even if API fails
    }
    
    // Clear local state and token
    localStorage.removeItem(TOKEN_KEY);
    setAuthState({
      user: null,
      token: null,
      loading: false,
      error: null,
    });
    
    console.log('User logged out successfully');
  }, [authState.token]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user: authState.user,
    token: authState.token,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user && !!authState.token,
    login,
    register,
    logout,
    checkAuth,
  };
}