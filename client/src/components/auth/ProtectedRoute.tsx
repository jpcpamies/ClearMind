import { useAuth } from '@/hooks/useAuth';
import AuthLayout from './AuthLayout';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user, token } = useAuth();

  // Debug authentication state
  console.log('ProtectedRoute - Auth state:', { isAuthenticated, loading, user: user?.displayName, hasToken: !!token });

  if (loading) {
    console.log('ProtectedRoute - Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute - User not authenticated, showing AuthLayout');
    return <AuthLayout />;
  }

  console.log('ProtectedRoute - User authenticated, showing main app for:', user?.displayName);
  return <>{children}</>;
}