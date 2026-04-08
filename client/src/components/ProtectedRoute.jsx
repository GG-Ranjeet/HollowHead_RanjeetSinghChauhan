import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ requiredRole }) {
  const { currentUser, dbUser, loading } = useAuth();

  if (loading) {
    // Return a sleek loading spinner or blank page while checking auth
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading Security Checks...</p>
      </div>
    );
  }

  // Not logged in? Go to login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Wait for dbUser to be populated from backend sync before checking strict roles
  if (requiredRole && !dbUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Syncing Profile...</p>
      </div>
    );
  }

  // Logged in, but wrong role?
  if (requiredRole) {
    const userRole = dbUser?.role || 'attendee';
    // 'client' route mapped to 'attendee' for backwards compatibility
    const isClientMatch = requiredRole === 'client' && userRole === 'attendee';
    
    if (userRole !== requiredRole && !isClientMatch) {
      return <Navigate to="/" replace />; // You can redirect to an "Access Denied" page if preferred
    }
  }

  // All good, render the child routes!
  return <Outlet />;
}

export default ProtectedRoute;
