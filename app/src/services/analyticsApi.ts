import { api } from './api';
import type {
  TechnicianPerformanceParams,
  TechnicianPerformanceReport,
  RevenueReportParams,
  RevenueReport,
  RevenueTrendData,
  PaymentAnalysis,
  DeviceAnalysisParams,
  DeviceAnalysisReport,
  IssueAnalysisReport,
  PartsUsageReport,
  BranchComparisonParams,
  BranchComparisonReport,
  DailySummary,
  WeeklyReport,
  MonthlyAnalytics,
  QuarterlyReview,
  YoYComparison,
  TechnicianMetrics,
  ExportOptions,
} from '../types/analytics';

export const analyticsApi = {
  /**
   * Get technician performance metrics
   */
  getTechnicianPerformance: async (
    params: TechnicianPerformanceParams
  ): Promise<TechnicianPerformanceReport> => {
    const response = await api.get('/analytics/technician-performance', { params });
    return response.data.data;
  },

  /**
   * Get revenue report
   */
  getRevenueReport: async (params: RevenueReportParams): Promise<RevenueReport> => {
    const response = await api.get('/analytics/revenue', { params });
    return response.data.data;
  },

  /**
   * Get revenue trends over time
   */
  getRevenueTrends: async (params: {
    branchId?: string;
    startDate: string;
    endDate: string;
    interval?: 'day' | 'week' | 'month';
  }): Promise<RevenueTrendData[]> => {
    const response = await api.get('/analytics/revenue-trends', { params });
    return response.data.data;
  },

  /**
   * Get payment analysis
   */
  getPaymentAnalysis: async (params: {
    branchId?: string;
    startDate: string;
    endDate: string;
  }): Promise<PaymentAnalysis> => {
    const response = await api.get('/analytics/payment-analysis', { params });
    return response.data.data;
  },

  /**
   * Get device analysis report
   */
  getDeviceAnalysis: async (params: DeviceAnalysisParams): Promise<DeviceAnalysisReport> => {
    const response = await api.get('/analytics/devices', { params });
    return response.data.data;
  },

  /**
   * Get issue analysis report
   */
  getIssueAnalysis: async (params: {
    branchId?: string;
    startDate: string;
    endDate: string;
    limit?: number;
  }): Promise<IssueAnalysisReport> => {
    const response = await api.get('/analytics/issues', { params });
    return response.data.data;
  },

  /**
   * Get parts usage report
   */
  getPartsUsage: async (params: {
    branchId?: string;
    startDate: string;
    endDate: string;
    limit?: number;
  }): Promise<PartsUsageReport> => {
    const response = await api.get('/analytics/parts-usage', { params });
    return response.data.data;
  },

  /**
   * Get branch comparison report
   */
  getBranchComparison: async (params: BranchComparisonParams): Promise<BranchComparisonReport> => {
    const response = await api.get('/analytics/branch-comparison', { params });
    return response.data.data;
  },

  /**
   * Get daily summary for a specific date
   */
  getDailySummary: async (params: {
    branchId?: string;
    date: string;
  }): Promise<DailySummary> => {
    const response = await api.get('/analytics/daily-summary', { params });
    return response.data.data;
  },

  /**
   * Get weekly report
   */
  getWeeklyReport: async (params: {
    branchId?: string;
    weekStart: string;
    weekEnd: string;
  }): Promise<WeeklyReport> => {
    const response = await api.get('/analytics/weekly-report', { params });
    return response.data.data;
  },

  /**
   * Get monthly analytics
   */
  getMonthlyAnalytics: async (params: {
    branchId?: string;
    month: number;
    year: number;
  }): Promise<MonthlyAnalytics> => {
    const response = await api.get('/analytics/monthly-analytics', { params });
    return response.data.data;
  },

  /**
   * Get quarterly review
   */
  getQuarterlyReview: async (params: {
    branchId?: string;
    quarter: number;
    year: number;
  }): Promise<QuarterlyReview> => {
    const response = await api.get('/analytics/quarterly-review', { params });
    return response.data.data;
  },

  /**
   * Get year-over-year comparison
   */
  getYoYComparison: async (params: {
    branchId?: string;
    currentYear: number;
    compareYears: number[];
  }): Promise<YoYComparison> => {
    const response = await api.get('/analytics/yoy-comparison', {
      params: {
        ...params,
        compareYears: params.compareYears.join(','),
      },
    });
    return response.data.data;
  },

  /**
   * Get technician rankings/leaderboard
   */
  getTechnicianRankings: async (params: {
    branchId?: string;
    startDate: string;
    endDate: string;
    sortBy?: 'services' | 'revenue' | 'rating';
    limit?: number;
  }): Promise<TechnicianMetrics[]> => {
    const response = await api.get('/analytics/technician-rankings', { params });
    return response.data.data;
  },

  /**
   * Get completion rate trends over time
   */
  getCompletionRateTrends: async (params: {
    branchId?: string;
    startDate: string;
    endDate: string;
    interval?: 'day' | 'week' | 'month';
  }): Promise<Array<{ date: string; completionRate: number; totalServices: number }>> => {
    const response = await api.get('/analytics/completion-rate-trends', { params });
    return response.data.data;
  },

  /**
   * Get average service value trends over time
   */
  getAvgServiceValueTrends: async (params: {
    branchId?: string;
    startDate: string;
    endDate: string;
    interval?: 'day' | 'week' | 'month';
  }): Promise<Array<{ date: string; avgValue: number; count: number }>> => {
    const response = await api.get('/analytics/avg-service-value-trends', { params });
    return response.data.data;
  },

  /**
   * Export report in specified format
   * Returns a blob that can be downloaded
   */
  exportReport: async (exportOptions: ExportOptions): Promise<Blob> => {
    const response = await api.post('/analytics/export', exportOptions, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Helper function to download exported report
   */
  downloadExport: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
