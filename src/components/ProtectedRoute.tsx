import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { AnimatedLoader } from './ui/AnimatedLoader';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading, userRole, roleLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Log when ProtectedRoute is rendered
  useEffect(() => {
    console.log('ProtectedRoute: Rendered with props:', {
      requireAdmin,
      hasUser: !!user,
      isAuthenticated,
      userRole: userRole?.role,
      authLoading,
      roleLoading,
      pathname: location.pathname
    });
  }, [requireAdmin, user, userRole, authLoading, roleLoading, location.pathname]);

  // Prevent multiple redirects
  useEffect(() => {
    if (!authLoading && !user && !isRedirecting) {
      console.log('ProtectedRoute: Setting redirect flag...');
      setIsRedirecting(true);
    }
  }, [authLoading, user, isRedirecting]);

  // Show loading while we have an authenticated session but user object hasn't loaded yet
  if (authLoading || roleLoading || (isAuthenticated && !user)) {
    console.log('ProtectedRoute: Showing loading state (awaiting user profile)...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedLoader size="md" />
      </div>
    );
  }

  // Redirect to auth if not authenticated (no user and no token)
  if (!isAuthenticated && !isRedirecting) {
    console.log('ProtectedRoute: Not authenticated, redirecting to auth...');
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Redirect to auth if redirecting
  if (isRedirecting) {
    console.log('ProtectedRoute: Redirecting to auth...');
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Check admin role if required
  if (requireAdmin && userRole?.role !== 'admin') {
    console.log('ProtectedRoute: User not admin, redirecting to dashboard...');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('ProtectedRoute: Rendering protected content...');
  return <>{children}</>;
};

export default ProtectedRoute;