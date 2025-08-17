import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading, userRole, roleLoading } = useAuth();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Log when ProtectedRoute is rendered
  useEffect(() => {
    console.log('ProtectedRoute: Rendered with props:', {
      requireAdmin,
      hasUser: !!user,
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

  // Show loading state while checking authentication
  if (authLoading || roleLoading) {
    console.log('ProtectedRoute: Showing loading state...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user && !isRedirecting) {
    console.log('ProtectedRoute: No user, redirecting to auth...');
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