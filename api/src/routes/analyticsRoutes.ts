import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { AnalyticsController } from '../controllers/analyticsController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  technicianPerformanceValidation,
  revenueReportValidation,
  revenueTrendsValidation,
  paymentAnalysisValidation,
  deviceAnalysisValidation,
  issueAnalysisValidation,
  partsUsageValidation,
  branchComparisonValidation,
  dailySummaryValidation,
  weeklyReportValidation,
  monthlyAnalyticsValidation,
  quarterlyReviewValidation,
  yoyComparisonValidation,
  technicianRankingsValidation,
  completionRateTrendsValidation,
  avgServiceValueTrendsValidation,
  exportReportValidation,
} from '../validators/analyticsValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/analytics/technician-performance
 * @desc    Get technician performance metrics
 * @access  Private (Manager+, or Technician for their own data)
 */
router.get(
  '/technician-performance',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TECHNICIAN
  ),
  validate(technicianPerformanceValidation),
  AnalyticsController.getTechnicianPerformance
);

/**
 * @route   GET /api/v1/analytics/revenue
 * @desc    Get revenue report
 * @access  Private (Manager+)
 */
router.get(
  '/revenue',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  validate(revenueReportValidation),
  AnalyticsController.getRevenueReport
);

/**
 * @route   GET /api/v1/analytics/revenue-trends
 * @desc    Get revenue trends over time
 * @access  Private (Manager+)
 */
router.get(
  '/revenue-trends',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  validate(revenueTrendsValidation),
  AnalyticsController.getRevenueTrends
);

/**
 * @route   GET /api/v1/analytics/payment-analysis
 * @desc    Get payment collection analysis
 * @access  Private (Manager+)
 */
router.get(
  '/payment-analysis',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  validate(paymentAnalysisValidation),
  AnalyticsController.getPaymentAnalysis
);

/**
 * @route   GET /api/v1/analytics/devices
 * @desc    Get device analysis report
 * @access  Private (All authenticated users)
 */
router.get(
  '/devices',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN
  ),
  validate(deviceAnalysisValidation),
  AnalyticsController.getDeviceAnalysis
);

/**
 * @route   GET /api/v1/analytics/issues
 * @desc    Get issue analysis report
 * @access  Private (All authenticated users)
 */
router.get(
  '/issues',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN
  ),
  validate(issueAnalysisValidation),
  AnalyticsController.getIssueAnalysis
);

/**
 * @route   GET /api/v1/analytics/parts-usage
 * @desc    Get parts usage report
 * @access  Private (Manager+, Technician)
 */
router.get(
  '/parts-usage',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TECHNICIAN
  ),
  validate(partsUsageValidation),
  AnalyticsController.getPartsUsage
);

/**
 * @route   GET /api/v1/analytics/branch-comparison
 * @desc    Get branch comparison report
 * @access  Private (Admin only)
 */
router.get(
  '/branch-comparison',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN
  ),
  validate(branchComparisonValidation),
  AnalyticsController.getBranchComparison
);

/**
 * @route   GET /api/v1/analytics/daily-summary
 * @desc    Get daily summary for a specific date
 * @access  Private (Manager+, Receptionist)
 */
router.get(
  '/daily-summary',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST
  ),
  validate(dailySummaryValidation),
  AnalyticsController.getDailySummary
);

/**
 * @route   GET /api/v1/analytics/weekly-report
 * @desc    Get weekly report
 * @access  Private (Manager+)
 */
router.get(
  '/weekly-report',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  validate(weeklyReportValidation),
  AnalyticsController.getWeeklyReport
);

/**
 * @route   GET /api/v1/analytics/monthly-analytics
 * @desc    Get monthly analytics
 * @access  Private (Manager+)
 */
router.get(
  '/monthly-analytics',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  validate(monthlyAnalyticsValidation),
  AnalyticsController.getMonthlyAnalytics
);

/**
 * @route   GET /api/v1/analytics/quarterly-review
 * @desc    Get quarterly review
 * @access  Private (Admin only)
 */
router.get(
  '/quarterly-review',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN
  ),
  validate(quarterlyReviewValidation),
  AnalyticsController.getQuarterlyReview
);

/**
 * @route   GET /api/v1/analytics/yoy-comparison
 * @desc    Get year-over-year comparison
 * @access  Private (Admin only)
 */
router.get(
  '/yoy-comparison',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN
  ),
  validate(yoyComparisonValidation),
  AnalyticsController.getYoYComparison
);

/**
 * @route   GET /api/v1/analytics/technician-rankings
 * @desc    Get technician rankings/leaderboard
 * @access  Private (Manager+)
 */
router.get(
  '/technician-rankings',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  validate(technicianRankingsValidation),
  AnalyticsController.getTechnicianRankings
);

/**
 * @route   GET /api/v1/analytics/completion-rate-trends
 * @desc    Get completion rate trends over time
 * @access  Private (Manager+)
 */
router.get(
  '/completion-rate-trends',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  validate(completionRateTrendsValidation),
  AnalyticsController.getCompletionRateTrends
);

/**
 * @route   GET /api/v1/analytics/avg-service-value-trends
 * @desc    Get average service value trends over time
 * @access  Private (Manager+)
 */
router.get(
  '/avg-service-value-trends',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  validate(avgServiceValueTrendsValidation),
  AnalyticsController.getAvgServiceValueTrends
);

/**
 * @route   POST /api/v1/analytics/export
 * @desc    Export report in specified format (PDF, Excel, CSV)
 * @access  Private (Manager+)
 */
router.post(
  '/export',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  validate(exportReportValidation),
  AnalyticsController.exportReport
);

export default router;
