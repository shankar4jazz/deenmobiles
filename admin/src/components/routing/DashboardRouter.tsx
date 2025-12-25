import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import AdminDashboard from '../../pages/dashboard/AdminDashboard';
import SuperAdminDashboard from '../../pages/dashboard/SuperAdminDashboard';
import { UserRole } from '../../types';

/**
 * DashboardRouter - Routes users to role-specific dashboards
 *
 * This component implements strict role-based access control by routing
 * authenticated users to their appropriate dashboard based on their role.
 */
const DashboardRouter = () => {
  const { user, isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Route to role-specific dashboard
  switch (user.role) {
    case UserRole.SUPER_ADMIN:
      // SUPER_ADMIN gets comprehensive SuperAdminDashboard with all branches
      return <SuperAdminDashboard />;

    case UserRole.ADMIN:
      // ADMIN users: redirect to branch dashboard if they have a branch
      // Otherwise show AdminDashboard for full system access
      if (user.managedBranchId || user.branchId) {
        return <Navigate to="/branch/dashboard" replace />;
      }
      // ADMIN without branch gets full AdminDashboard
      return <AdminDashboard />;

    case UserRole.TECHNICIAN:
      // Route technicians to their specialized dashboard showing assigned services
      return <Navigate to="/branch/technician-dashboard" replace />;

    case UserRole.MANAGER:
    case UserRole.RECEPTIONIST:
      // Route branch users to their branch-specific dashboard
      // This shows only their branch data with separate sidebar/topbar
      return <Navigate to="/branch/dashboard" replace />;

    default:
      // Fallback for unknown roles
      console.warn(`Unknown user role: ${user.role}`);
      return <Navigate to="/login" replace />;
  }
};

export default DashboardRouter;
