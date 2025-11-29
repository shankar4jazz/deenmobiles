import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/dashboard/data
 * @desc    Get complete dashboard data (stats + charts + activity)
 * @access  Private (all authenticated users)
 */
router.get('/data', DashboardController.getDashboardData);

/**
 * @route   GET /api/v1/dashboard/stats
 * @desc    Get dashboard statistics only
 * @access  Private (all authenticated users)
 */
router.get('/stats', DashboardController.getStats);

/**
 * @route   GET /api/v1/dashboard/charts
 * @desc    Get chart data
 * @access  Private (all authenticated users)
 */
router.get('/charts', DashboardController.getCharts);

/**
 * @route   GET /api/v1/dashboard/activity
 * @desc    Get recent activity
 * @access  Private (all authenticated users)
 */
router.get('/activity', DashboardController.getRecentActivity);

/**
 * @route   GET /api/v1/dashboard/admin
 * @desc    Get Admin dashboard with company-wide overview
 * @access  Private (Admin only)
 */
router.get('/admin', authorize('ADMIN', 'SUPER_ADMIN'), DashboardController.getAdminDashboard);

/**
 * @route   GET /api/v1/dashboard/manager
 * @desc    Get Branch Manager dashboard
 * @access  Private (Manager only)
 */
router.get('/manager', authorize('MANAGER'), DashboardController.getManagerDashboard);

/**
 * @route   GET /api/v1/dashboard/receptionist
 * @desc    Get Receptionist dashboard
 * @access  Private (Receptionist only)
 */
router.get('/receptionist', authorize('RECEPTIONIST'), DashboardController.getReceptionistDashboard);

/**
 * @route   GET /api/v1/dashboard/technician-manager
 * @desc    Get Technician Manager dashboard
 * @access  Private (Manager only - for technician management)
 */
router.get('/technician-manager', authorize('MANAGER'), DashboardController.getTechnicianManagerDashboard);

/**
 * @route   GET /api/v1/dashboard/technician
 * @desc    Get Technician dashboard
 * @access  Private (Technician only)
 */
router.get('/technician', authorize('TECHNICIAN'), DashboardController.getTechnicianDashboard);

/**
 * @route   GET /api/v1/dashboard/super-admin
 * @desc    Get Super Admin dashboard with all branches summary
 * @access  Private (Super Admin and Admin only)
 */
router.get('/super-admin', authorize('SUPER_ADMIN', 'ADMIN'), DashboardController.getSuperAdminDashboard);

/**
 * @route   GET /api/v1/dashboard/branch/:branchId/analytics
 * @desc    Get detailed analytics for a specific branch
 * @access  Private (Super Admin and Admin only)
 */
router.get('/branch/:branchId/analytics', authorize('SUPER_ADMIN', 'ADMIN'), DashboardController.getBranchAnalytics);

/**
 * @route   GET /api/v1/dashboard/branch/:branchId/financial
 * @desc    Get financial report for a specific branch
 * @access  Private (Super Admin and Admin only)
 */
router.get('/branch/:branchId/financial', authorize('SUPER_ADMIN', 'ADMIN'), DashboardController.getBranchFinancialReport);

/**
 * @route   GET /api/v1/dashboard/branch/:branchId/inventory
 * @desc    Get inventory report for a specific branch
 * @access  Private (Super Admin and Admin only)
 */
router.get('/branch/:branchId/inventory', authorize('SUPER_ADMIN', 'ADMIN'), DashboardController.getBranchInventoryReport);

/**
 * @route   GET /api/v1/dashboard/branch/:branchId/operations
 * @desc    Get operations report for a specific branch
 * @access  Private (Super Admin and Admin only)
 */
router.get('/branch/:branchId/operations', authorize('SUPER_ADMIN', 'ADMIN'), DashboardController.getBranchOperationsReport);

/**
 * @route   GET /api/v1/dashboard/branch/:branchId/customers
 * @desc    Get customer report for a specific branch
 * @access  Private (Super Admin and Admin only)
 */
router.get('/branch/:branchId/customers', authorize('SUPER_ADMIN', 'ADMIN'), DashboardController.getBranchCustomerReport);

export default router;
