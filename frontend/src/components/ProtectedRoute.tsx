import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'patient' | 'doctor';
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (requireRole && userRole !== requireRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">
          Access denied. Required role: {requireRole}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}