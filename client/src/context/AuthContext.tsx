import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, AuthState, LoginRequest, AuthResponse } from '@/types/auth';

const TOKEN_KEY = 'clearmind_token';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
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
      setAuthState(prev => ({ ...prev, user: null, token: null, loading: false }));
      return;
    }

    console.log('Fetching user profile with token');
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log('Token validation failed:', response.status);
        localStorage.removeItem(TOKEN_KEY);
        setAuthState(prev => ({ ...prev, user: null, token: null, loading: false }));
        return;
      }

      const data = await response.json();
      console.log('User authenticated successfully:', data.user.displayName);
      setAuthState({
        user: data.user,
        token,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem(TOKEN_KEY);
      setAuthState(prev => ({ ...prev, user: null, token: null, loading: false }));
    }
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    console.log('Attempting login for:', credentials.email);
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
        console.log('Login error:', errorData);
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data: AuthResponse = await response.json();
      console.log('Login successful for:', data.user.displayName);
      setUser(data.user, data.token);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  };

  const logout = useCallback(async () => {
    console.log('Logging out user');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authState.token}`,
        },
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    
    localStorage.removeItem(TOKEN_KEY);
    setAuthState({
      user: null,
      token: null,
      loading: false,
      error: null,
    });
    console.log('User logged out successfully');
  }, [authState.token]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    user: authState.user,
    token: authState.token,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user && !!authState.token,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}