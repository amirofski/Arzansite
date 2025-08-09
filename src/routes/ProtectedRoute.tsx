import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, loading, userRole, roleLoading } = useAuth();
  const location = useLocation();
  if (loading || roleLoading) return null;
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;
  if (requireAdmin && userRole?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}


