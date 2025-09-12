import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type User = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  emailVerified: boolean | null;
  profileImageUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Query to get current user
  const {
    data: userResponse,
    isLoading: isLoadingUser,
    error,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: isInitialized,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const user = (userResponse as any)?.user || null;
  const isAuthenticated = !!user;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
    },
    onSuccess: () => {
      // Refresh user data after successful login
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      // Invalidate all cached data to ensure fresh data for the new user
      queryClient.invalidateQueries();
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/auth/logout', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
  });

  // Refresh token mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/auth/refresh', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      // Refresh user data after token refresh
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Auto-refresh tokens when they're about to expire
  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh token every 12 minutes (access token expires in 15 minutes)
    const interval = setInterval(() => {
      refreshMutation.mutate();
    }, 12 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshMutation]);

  // Initialize authentication state on mount
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Auto-retry authentication on auth errors
  useEffect(() => {
    if (error && !isLoadingUser) {
      // If we get an auth error, try refreshing the token once
      if (error.message?.includes('TOKEN_EXPIRED') || error.message?.includes('INVALID_TOKEN')) {
        refreshMutation.mutate(undefined, {
          onError: () => {
            // If refresh fails, user needs to log in again
            queryClient.clear();
          },
        });
      }
    }
  }, [error, isLoadingUser, refreshMutation, queryClient]);

  const contextValue: AuthContextType = {
    user,
    isLoading: isLoadingUser && isInitialized,
    isAuthenticated,
    login: async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    refresh: async () => {
      await refreshMutation.mutateAsync();
    },
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}