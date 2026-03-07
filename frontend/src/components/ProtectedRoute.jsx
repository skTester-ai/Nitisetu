import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <Loader2 size={40} className="spin" style={{ color: 'var(--accent-indigo)' }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Mandatory Role Check for Industry Standard RBAC
  if (requiredRole) {
    const roleHierarchy = {
      'farmer': 1,
      'admin': 2,
      'superadmin': 3
    };
    
    const userRoleValue = roleHierarchy[user.role] || 0;
    const requiredRoleValue = roleHierarchy[requiredRole] || 0;

    if (userRoleValue < requiredRoleValue) {
      console.warn(`[ProtectedRoute] Unauthorized access attempt: ${user.role} tried to access ${requiredRole} route. Redirecting...`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

