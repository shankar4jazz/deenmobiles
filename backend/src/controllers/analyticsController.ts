import { Response } from 'express';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import analyticsService from '../services/analyticsService';
import reportExportService from '../services/reportExportService';

export class AnalyticsController {
  /**
   * GET /api/v1/analytics/technician-performance
   * Get technician performance metrics
   */
  static getTechnicianPerformance = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    const params = {
      companyId,
      branchId: req.query.branchId as string | undefined,
      technicianId: req.query.technicianId as string | undefined,
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
      period: (req.query.period as 'daily' | 'weekly' | 'monthly') || 'monthly',
    };

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      params.branchId = req.user!.branchId;
    }

    // Technicians can only see their own performance
    if (userRole === 'TECHNICIAN') {
      params.technicianId = req.user!.userId;
    }

    const report = await analyticsService.getTechnicianPerformance(params);

    return ApiResponse.success(res, report, 'Technician performance retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/revenue
   * Get revenue report
   */
  static getRevenueReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    const params = {
      companyId,
      branchId: req.query.branchId as string | undefined,
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
      groupBy: (req.query.groupBy as 'day' | 'week' | 'month' | 'service_type' | 'branch') || 'month',
    };

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      params.branchId = req.user!.branchId;
    }

    const report = await analyticsService.getRevenueReport(params);

    return ApiResponse.success(res, report, 'Revenue report retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/revenue-trends
   * Get revenue trends over time
   */
  static getRevenueTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const trends = await analyticsService.getRevenueTrends(
      companyId,
      branchId,
      new Date(req.query.startDate as string),
      new Date(req.query.endDate as string),
      (req.query.interval as 'day' | 'week' | 'month') || 'day'
    );

    return ApiResponse.success(res, trends, 'Revenue trends retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/payment-analysis
   * Get payment collection analysis
   */
  static getPaymentAnalysis = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const analysis = await analyticsService.getPaymentAnalysis(
      companyId,
      branchId,
      new Date(req.query.startDate as string),
      new Date(req.query.endDate as string)
    );

    return ApiResponse.success(res, analysis, 'Payment analysis retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/devices
   * Get device analysis report
   */
  static getDeviceAnalysis = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    const params = {
      companyId,
      branchId: req.query.branchId as string | undefined,
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      params.branchId = req.user!.branchId;
    }

    const report = await analyticsService.getDeviceAnalysis(params);

    return ApiResponse.success(res, report, 'Device analysis retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/issues
   * Get issue analysis report
   */
  static getIssueAnalysis = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const report = await analyticsService.getIssueAnalysis(
      companyId,
      branchId,
      new Date(req.query.startDate as string),
      new Date(req.query.endDate as string),
      req.query.limit ? parseInt(req.query.limit as string) : 20
    );

    return ApiResponse.success(res, report, 'Issue analysis retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/parts-usage
   * Get parts usage report
   */
  static getPartsUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const report = await analyticsService.getPartsUsage(
      companyId,
      branchId,
      new Date(req.query.startDate as string),
      new Date(req.query.endDate as string),
      req.query.limit ? parseInt(req.query.limit as string) : 50
    );

    return ApiResponse.success(res, report, 'Parts usage retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/branch-comparison
   * Get branch comparison report
   */
  static getBranchComparison = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    // Only SUPER_ADMIN and ADMIN can access branch comparison
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return ApiResponse.forbidden(res, 'Access denied to branch comparison reports');
    }

    const params = {
      companyId,
      branchIds: req.query.branchIds ? (req.query.branchIds as string).split(',') : undefined,
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
      metrics: req.query.metrics ? (req.query.metrics as string).split(',') : ['revenue', 'services'],
    };

    const report = await analyticsService.getBranchComparison(params);

    return ApiResponse.success(res, report, 'Branch comparison retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/daily-summary
   * Get daily summary for a specific date
   */
  static getDailySummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const summary = await analyticsService.getDailySummary(
      companyId,
      branchId,
      new Date(req.query.date as string)
    );

    return ApiResponse.success(res, summary, 'Daily summary retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/weekly-report
   * Get weekly report
   */
  static getWeeklyReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const report = await analyticsService.getWeeklyReport(
      companyId,
      branchId,
      new Date(req.query.weekStart as string),
      new Date(req.query.weekEnd as string)
    );

    return ApiResponse.success(res, report, 'Weekly report retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/monthly-analytics
   * Get monthly analytics
   */
  static getMonthlyAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const analytics = await analyticsService.getMonthlyAnalytics(
      companyId,
      branchId,
      parseInt(req.query.month as string),
      parseInt(req.query.year as string)
    );

    return ApiResponse.success(res, analytics, 'Monthly analytics retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/quarterly-review
   * Get quarterly review
   */
  static getQuarterlyReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const review = await analyticsService.getQuarterlyReview(
      companyId,
      branchId,
      parseInt(req.query.quarter as string),
      parseInt(req.query.year as string)
    );

    return ApiResponse.success(res, review, 'Quarterly review retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/yoy-comparison
   * Get year-over-year comparison
   */
  static getYoYComparison = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const comparison = await analyticsService.getYoYComparison(
      companyId,
      branchId,
      parseInt(req.query.currentYear as string),
      (req.query.compareYears as string).split(',').map((y) => parseInt(y))
    );

    return ApiResponse.success(res, comparison, 'Year-over-year comparison retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/technician-rankings
   * Get technician rankings/leaderboard
   */
  static getTechnicianRankings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const rankings = await analyticsService.getTechnicianRankings(
      companyId,
      branchId,
      new Date(req.query.startDate as string),
      new Date(req.query.endDate as string),
      (req.query.sortBy as 'services' | 'revenue' | 'rating') || 'revenue',
      req.query.limit ? parseInt(req.query.limit as string) : 10
    );

    return ApiResponse.success(res, rankings, 'Technician rankings retrieved successfully');
  });

  /**
   * POST /api/v1/analytics/export
   * Export report in specified format (PDF, Excel, CSV)
   */
  static exportReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reportType, format, data, options } = req.body;

    // Validate format
    if (!['pdf', 'excel', 'csv'].includes(format)) {
      return ApiResponse.badRequest(res, 'Invalid export format. Must be pdf, excel, or csv.');
    }

    const result = await reportExportService.exportReport(reportType, data, format, options);

    // Set appropriate headers based on format
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
      return res.send(result);
    } else if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.xlsx"`);
      return res.send(result);
    } else {
      // CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.csv"`);
      return res.send(result);
    }
  });

  /**
   * GET /api/v1/analytics/completion-rate-trends
   * Get completion rate trends over time
   */
  static getCompletionRateTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const trends = await analyticsService.getCompletionRateTrends(
      companyId,
      branchId,
      new Date(req.query.startDate as string),
      new Date(req.query.endDate as string),
      (req.query.interval as 'day' | 'week' | 'month') || 'day'
    );

    return ApiResponse.success(res, trends, 'Completion rate trends retrieved successfully');
  });

  /**
   * GET /api/v1/analytics/avg-service-value-trends
   * Get average service value trends over time
   */
  static getAvgServiceValueTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const trends = await analyticsService.getAvgServiceValueTrends(
      companyId,
      branchId,
      new Date(req.query.startDate as string),
      new Date(req.query.endDate as string),
      (req.query.interval as 'day' | 'week' | 'month') || 'day'
    );

    return ApiResponse.success(res, trends, 'Average service value trends retrieved successfully');
  });
}
