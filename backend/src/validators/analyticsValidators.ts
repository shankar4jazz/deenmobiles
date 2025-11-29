import { query, body, ValidationChain } from 'express-validator';

/**
 * Common date range validation
 */
const dateRangeValidation: ValidationChain[] = [
  query('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format. Use ISO 8601 format'),

  query('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Invalid end date format. Use ISO 8601 format')
    .custom((value, { req }) => {
      const startDate = new Date(req.query?.startDate as string);
      const endDate = new Date(value);
      if (endDate < startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
];

/**
 * Optional branch ID validation
 */
const optionalBranchIdValidation: ValidationChain = query('branchId')
  .optional()
  .isUUID()
  .withMessage('Invalid branch ID format');

/**
 * Validation for technician performance endpoint
 */
export const technicianPerformanceValidation: ValidationChain[] = [
  ...dateRangeValidation,
  optionalBranchIdValidation,

  query('technicianId')
    .optional()
    .isUUID()
    .withMessage('Invalid technician ID format'),

  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Period must be one of: daily, weekly, monthly'),
];

/**
 * Validation for revenue report endpoint
 */
export const revenueReportValidation: ValidationChain[] = [
  ...dateRangeValidation,
  optionalBranchIdValidation,

  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month', 'service_type', 'branch'])
    .withMessage('groupBy must be one of: day, week, month, service_type, branch'),
];

/**
 * Validation for revenue trends endpoint
 */
export const revenueTrendsValidation: ValidationChain[] = [
  ...dateRangeValidation,
  optionalBranchIdValidation,

  query('interval')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('Interval must be one of: day, week, month'),
];

/**
 * Validation for payment analysis endpoint
 */
export const paymentAnalysisValidation: ValidationChain[] = [
  ...dateRangeValidation,
  optionalBranchIdValidation,
];

/**
 * Validation for device analysis endpoint
 */
export const deviceAnalysisValidation: ValidationChain[] = [
  ...dateRangeValidation,
  optionalBranchIdValidation,

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Validation for issue analysis endpoint
 */
export const issueAnalysisValidation: ValidationChain[] = [
  ...dateRangeValidation,
  optionalBranchIdValidation,

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Validation for parts usage endpoint
 */
export const partsUsageValidation: ValidationChain[] = [
  ...dateRangeValidation,
  optionalBranchIdValidation,

  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be between 1 and 200'),
];

/**
 * Validation for branch comparison endpoint
 */
export const branchComparisonValidation: ValidationChain[] = [
  ...dateRangeValidation,

  query('branchIds')
    .optional()
    .custom((value) => {
      if (typeof value !== 'string') return true;
      const ids = value.split(',');
      if (ids.length > 20) {
        throw new Error('Cannot compare more than 20 branches at once');
      }
      return true;
    }),

  query('metrics')
    .optional()
    .custom((value) => {
      if (typeof value !== 'string') return true;
      const allowedMetrics = ['revenue', 'services', 'efficiency', 'satisfaction'];
      const requestedMetrics = value.split(',');
      const invalid = requestedMetrics.filter((m) => !allowedMetrics.includes(m));
      if (invalid.length > 0) {
        throw new Error(`Invalid metrics: ${invalid.join(', ')}`);
      }
      return true;
    }),
];

/**
 * Validation for daily summary endpoint
 */
export const dailySummaryValidation: ValidationChain[] = [
  optionalBranchIdValidation,

  query('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format'),
];

/**
 * Validation for weekly report endpoint
 */
export const weeklyReportValidation: ValidationChain[] = [
  optionalBranchIdValidation,

  query('weekStart')
    .notEmpty()
    .withMessage('Week start date is required')
    .isISO8601()
    .withMessage('Invalid week start date format'),

  query('weekEnd')
    .notEmpty()
    .withMessage('Week end date is required')
    .isISO8601()
    .withMessage('Invalid week end date format')
    .custom((value, { req }) => {
      const weekStart = new Date(req.query?.weekStart as string);
      const weekEnd = new Date(value);
      if (weekEnd < weekStart) {
        throw new Error('Week end must be after week start');
      }
      const diffDays = Math.ceil((weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 7) {
        throw new Error('Week range cannot exceed 7 days');
      }
      return true;
    }),
];

/**
 * Validation for monthly analytics endpoint
 */
export const monthlyAnalyticsValidation: ValidationChain[] = [
  optionalBranchIdValidation,

  query('month')
    .notEmpty()
    .withMessage('Month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),

  query('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
];

/**
 * Validation for quarterly review endpoint
 */
export const quarterlyReviewValidation: ValidationChain[] = [
  optionalBranchIdValidation,

  query('quarter')
    .notEmpty()
    .withMessage('Quarter is required')
    .isInt({ min: 1, max: 4 })
    .withMessage('Quarter must be between 1 and 4'),

  query('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
];

/**
 * Validation for year-over-year comparison endpoint
 */
export const yoyComparisonValidation: ValidationChain[] = [
  optionalBranchIdValidation,

  query('currentYear')
    .notEmpty()
    .withMessage('Current year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Current year must be between 2000 and 2100'),

  query('compareYears')
    .notEmpty()
    .withMessage('Comparison years are required')
    .custom((value) => {
      if (typeof value !== 'string') {
        throw new Error('compareYears must be a comma-separated list of years');
      }
      const years = value.split(',').map((y) => parseInt(y.trim()));
      if (years.some((y) => isNaN(y) || y < 2000 || y > 2100)) {
        throw new Error('All years must be valid numbers between 2000 and 2100');
      }
      if (years.length > 5) {
        throw new Error('Cannot compare more than 5 years at once');
      }
      return true;
    }),
];

/**
 * Validation for technician rankings endpoint
 */
export const technicianRankingsValidation: ValidationChain[] = [
  ...dateRangeValidation,
  optionalBranchIdValidation,

  query('sortBy')
    .optional()
    .isIn(['services', 'revenue', 'rating'])
    .withMessage('sortBy must be one of: services, revenue, rating'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];

/**
 * Validation for completion rate trends endpoint
 */
export const completionRateTrendsValidation: ValidationChain[] = [
  ...dateRangeValidation,
  optionalBranchIdValidation,

  query('interval')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('Interval must be one of: day, week, month'),
];

/**
 * Validation for avg service value trends endpoint
 */
export const avgServiceValueTrendsValidation: ValidationChain[] = [
  ...dateRangeValidation,
  optionalBranchIdValidation,

  query('interval')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('Interval must be one of: day, week, month'),
];

/**
 * Validation for export report endpoint
 */
export const exportReportValidation: ValidationChain[] = [
  body('reportType')
    .trim()
    .notEmpty()
    .withMessage('Report type is required')
    .isIn([
      'revenue',
      'technician_performance',
      'branch_comparison',
      'device_analysis',
      'issue_analysis',
      'parts_usage',
      'monthly_analytics',
    ])
    .withMessage('Invalid report type'),

  body('format')
    .trim()
    .notEmpty()
    .withMessage('Export format is required')
    .isIn(['pdf', 'excel', 'csv'])
    .withMessage('Format must be one of: pdf, excel, csv'),

  body('data')
    .notEmpty()
    .withMessage('Report data is required')
    .custom((value) => {
      if (typeof value !== 'object') {
        throw new Error('Data must be an object');
      }
      return true;
    }),

  body('options')
    .optional()
    .custom((value) => {
      if (value && typeof value !== 'object') {
        throw new Error('Options must be an object');
      }
      return true;
    }),
];
