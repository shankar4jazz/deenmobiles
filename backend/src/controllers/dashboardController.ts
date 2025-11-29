import { Response } from 'express';
import { DashboardService } from '../services/dashboardService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class DashboardController {
  /**
   * GET /api/v1/dashboard/data
   * Get all dashboard data (stats, charts, activity)
   */
  static getDashboardData = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { userId, role, companyId, branchId } = req.user;

    // Fetch all dashboard data in parallel
    const [stats, servicesChart, statusBreakdown, weeklyTrend, recentActivity] = await Promise.all([
      DashboardService.getDashboardStats(userId, role, companyId, branchId),
      DashboardService.getServicesChartData(companyId, branchId, role, userId),
      DashboardService.getStatusBreakdown(companyId, branchId, role, userId),
      DashboardService.getWeeklyTrend(companyId, branchId, role, userId),
      DashboardService.getRecentActivity(companyId, branchId, role, userId),
    ]);

    const dashboardData = {
      stats,
      servicesChart,
      statusBreakdown,
      weeklyTrend,
      recentActivity,
    };

    return ApiResponse.success(res, dashboardData, 'Dashboard data retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/stats
   * Get only dashboard statistics
   */
  static getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { userId, role, companyId, branchId } = req.user;

    const stats = await DashboardService.getDashboardStats(userId, role, companyId, branchId);

    return ApiResponse.success(res, stats, 'Statistics retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/charts
   * Get chart data
   */
  static getCharts = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { userId, role, companyId, branchId } = req.user;

    const [servicesChart, statusBreakdown, weeklyTrend] = await Promise.all([
      DashboardService.getServicesChartData(companyId, branchId, role, userId),
      DashboardService.getStatusBreakdown(companyId, branchId, role, userId),
      DashboardService.getWeeklyTrend(companyId, branchId, role, userId),
    ]);

    const charts = {
      servicesChart,
      statusBreakdown,
      weeklyTrend,
    };

    return ApiResponse.success(res, charts, 'Chart data retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/activity
   * Get recent activity
   */
  static getRecentActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { userId, role, companyId, branchId } = req.user;
    const limit = parseInt(req.query.limit as string) || 5;

    const activity = await DashboardService.getRecentActivity(
      companyId,
      branchId,
      role,
      userId,
      limit
    );

    return ApiResponse.success(res, activity, 'Recent activity retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/admin
   * Get Admin dashboard with company-wide overview
   */
  static getAdminDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { userId, companyId } = req.user;

    const dashboardData = await DashboardService.getAdminDashboard(userId, companyId);

    return ApiResponse.success(res, dashboardData, 'Admin dashboard data retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/manager
   * Get Branch Manager dashboard
   */
  static getManagerDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { userId, companyId, branchId } = req.user;

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required for manager dashboard');
    }

    const dashboardData = await DashboardService.getManagerDashboard(userId, companyId, branchId);

    return ApiResponse.success(res, dashboardData, 'Manager dashboard data retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/receptionist
   * Get Receptionist dashboard
   */
  static getReceptionistDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { userId, companyId, branchId } = req.user;

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required for receptionist dashboard');
    }

    const dashboardData = await DashboardService.getReceptionistDashboard(userId, companyId, branchId);

    return ApiResponse.success(res, dashboardData, 'Receptionist dashboard data retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/technician-manager
   * Get Technician Manager dashboard
   */
  static getTechnicianManagerDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { userId, companyId, branchId } = req.user;

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required for technician manager dashboard');
    }

    const dashboardData = await DashboardService.getTechnicianManagerDashboard(userId, companyId, branchId);

    return ApiResponse.success(res, dashboardData, 'Technician manager dashboard data retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/technician
   * Get Technician dashboard
   */
  static getTechnicianDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { userId, companyId, branchId } = req.user;

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required for technician dashboard');
    }

    const dashboardData = await DashboardService.getTechnicianDashboard(userId, companyId, branchId);

    return ApiResponse.success(res, dashboardData, 'Technician dashboard data retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/super-admin
   * Get Super Admin dashboard with all branches summary
   */
  static getSuperAdminDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { companyId } = req.user;
    const { startDate, endDate, period } = req.query;

    const dashboardData = await DashboardService.getSuperAdminDashboard(
      companyId,
      startDate as string,
      endDate as string,
      period as string
    );

    return ApiResponse.success(res, dashboardData, 'Super admin dashboard data retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/branch/:branchId/analytics
   * Get detailed analytics for a specific branch
   */
  static getBranchAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { companyId } = req.user;
    const { branchId } = req.params;
    const { startDate, endDate, period } = req.query;

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required');
    }

    const analyticsData = await DashboardService.getBranchDetailedAnalytics(
      branchId,
      companyId,
      startDate as string,
      endDate as string,
      period as string
    );

    return ApiResponse.success(res, analyticsData, 'Branch analytics data retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/branch/:branchId/financial
   * Get financial report for a specific branch
   */
  static getBranchFinancialReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { companyId } = req.user;
    const { branchId } = req.params;
    const { startDate, endDate, period } = req.query;

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required');
    }

    const financialData = await DashboardService.getBranchFinancialReport(
      branchId,
      companyId,
      startDate as string,
      endDate as string,
      period as string
    );

    return ApiResponse.success(res, financialData, 'Branch financial report retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/branch/:branchId/inventory
   * Get inventory report for a specific branch
   */
  static getBranchInventoryReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { companyId } = req.user;
    const { branchId } = req.params;

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required');
    }

    const inventoryData = await DashboardService.getBranchInventoryReport(branchId, companyId);

    return ApiResponse.success(res, inventoryData, 'Branch inventory report retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/branch/:branchId/operations
   * Get operations report for a specific branch
   */
  static getBranchOperationsReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { companyId } = req.user;
    const { branchId } = req.params;
    const { startDate, endDate, period } = req.query;

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required');
    }

    const operationsData = await DashboardService.getBranchOperationsReport(
      branchId,
      companyId,
      startDate as string,
      endDate as string,
      period as string
    );

    return ApiResponse.success(res, operationsData, 'Branch operations report retrieved successfully');
  });

  /**
   * GET /api/v1/dashboard/branch/:branchId/customers
   * Get customer report for a specific branch
   */
  static getBranchCustomerReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const { companyId } = req.user;
    const { branchId } = req.params;
    const { startDate, endDate, period } = req.query;

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required');
    }

    const customerData = await DashboardService.getBranchCustomerReport(
      branchId,
      companyId,
      startDate as string,
      endDate as string,
      period as string
    );

    return ApiResponse.success(res, customerData, 'Branch customer report retrieved successfully');
  });
}
