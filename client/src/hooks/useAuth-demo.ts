import { useState, useEffect } from 'react';
import type { User, AuthState } from '@/types/auth';

// Mock user for demo purposes
const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@example.com',
  username: 'demo',
  displayName: 'Demo User',
  emailVerified: true,
  profileImageUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: DEMO_USER,
    token: 'demo-token',
    loading: false,
    error: null,
  });

  const setError = (error: string | null) => {
    setAuthState(prev => ({ ...prev, error, loading: false }));
  };

  const setUser = (user: User | null, token: string | null) => {
    setAuthState({
      user,
      token,
      loading: false,
      error: null,
    });
  };

  const login = async (credentials: any): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Always succeed with demo user
    setUser(DEMO_USER, 'demo-token');
  };

  const register = async (userData: any): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Always succeed with demo user
    setUser(DEMO_USER, 'demo-token');
  };

  const logout = async () => {
    setAuthState({
      user: null,
      token: null,
      loading: false,
      error: null,
    });
  };

  const checkAuth = async () => {
    // Always authenticated in demo
    setUser(DEMO_USER, 'demo-token');
  };

  // Auto-authenticate on mount for demo
  useEffect(() => {
    setUser(DEMO_USER, 'demo-token');
  }, []);

  return {
    user: authState.user,
    token: authState.token,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: true, // Always authenticated in demo
    login,
    register,
    logout,
    checkAuth,
  };
}