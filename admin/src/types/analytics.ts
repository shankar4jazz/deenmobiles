// Frontend Analytics Types (matching backend types)

export interface TechnicianPerformanceParams {
  companyId?: string;
  branchId?: string;
  technicianId?: string;
  startDate: string;
  endDate: string;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface TechnicianMetrics {
  technicianId: string;
  technicianName: string;
  servicesCompleted: number;
  totalRevenue: number;
  avgCompletionTime: number;
  customerRating: number | null;
  activeHours: number | null;
  completionRate: number;
}

export interface TechnicianPerformanceReport {
  technicians: TechnicianMetrics[];
  summary: {
    totalServices: number;
    totalRevenue: number;
    avgCompletionTime: number;
    avgRating: number;
  };
  period: string;
}

export interface RevenueReportParams {
  branchId?: string;
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week' | 'month' | 'service_type' | 'branch';
}

export interface RevenueData {
  label: string;
  revenue: number;
  services: number;
  avgRevenue: number;
}

export interface RevenueReport {
  data: RevenueData[];
  total: {
    revenue: number;
    services: number;
    avgRevenue: number;
  };
  period: string;
}

export interface RevenueTrendData {
  date: string;
  revenue: number;
  services: number;
}

export interface PaymentAnalysis {
  totalRevenue: number;
  advancePayments: number;
  balanceCollected: number;
  pending: number;
  advancePercentage: number;
  balancePercentage: number;
}

export interface DeviceAnalysisParams {
  branchId?: string;
  startDate: string;
  endDate: string;
  limit?: number;
}

export interface DeviceData {
  deviceModel: string;
  count: number;
  avgCost: number;
  totalRevenue: number;
  avgCompletionTime: number;
}

export interface DeviceAnalysisReport {
  devices: DeviceData[];
  total: {
    uniqueDevices: number;
    totalServices: number;
    avgCost: number;
  };
}

export interface IssueData {
  issue: string;
  count: number;
  avgCost: number;
  avgCompletionTime: number;
}

export interface IssueAnalysisReport {
  issues: IssueData[];
  total: {
    uniqueIssues: number;
    totalServices: number;
  };
}

export interface PartsUsageData {
  partId: string;
  partName: string;
  quantityUsed: number;
  timesUsed: number;
  totalRevenue: number;
  avgPrice: number;
}

export interface PartsUsageReport {
  parts: PartsUsageData[];
  total: {
    uniqueParts: number;
    totalQuantity: number;
    totalRevenue: number;
  };
}

export interface BranchComparisonParams {
  branchIds?: string[];
  startDate: string;
  endDate: string;
  metrics: string[];
}

export interface BranchMetrics {
  branchId: string;
  branchName: string;
  servicesCompleted: number;
  revenue: number;
  avgCompletionTime: number;
  customerSatisfaction: number | null;
  technicianCount: number;
  servicesPerTechnician: number;
}

export interface BranchComparisonReport {
  branches: BranchMetrics[];
  rankings: {
    byRevenue: { branchId: string; branchName: string; revenue: number }[];
    byServices: { branchId: string; branchName: string; services: number }[];
    byEfficiency: { branchId: string; branchName: string; avgTime: number }[];
  };
}

export interface DailySummary {
  date: string;
  servicesReceived: number;
  servicesCompleted: number;
  servicesInProgress: number;
  revenue: number;
  topTechnician: {
    id: string;
    name: string;
    servicesCompleted: number;
  } | null;
  topIssue: {
    issue: string;
    count: number;
  } | null;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalServices: number;
  completedServices: number;
  revenue: number;
  dailyBreakdown: {
    date: string;
    services: number;
    revenue: number;
  }[];
  topPerformers: {
    id: string;
    name: string;
    servicesCompleted: number;
    revenue: number;
  }[];
}

export interface MonthlyAnalytics {
  month: number;
  year: number;
  totalServices: number;
  totalRevenue: number;
  avgDailyServices: number;
  avgDailyRevenue: number;
  weeklyBreakdown: {
    week: number;
    services: number;
    revenue: number;
  }[];
  topDevices: DeviceData[];
  topIssues: IssueData[];
  technicianPerformance: TechnicianMetrics[];
}

export interface QuarterlyReview {
  quarter: number;
  year: number;
  totalServices: number;
  totalRevenue: number;
  monthlyBreakdown: {
    month: number;
    services: number;
    revenue: number;
  }[];
  growthRate: number;
  branchComparison: BranchMetrics[];
}

export interface YoYComparison {
  currentYear: number;
  compareYears: number[];
  metrics: {
    year: number;
    services: number;
    revenue: number;
    avgServiceValue: number;
    growth: number;
  }[];
  insights: {
    bestMonth: { month: number; revenue: number };
    worstMonth: { month: number; revenue: number };
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  reportType: string;
  data: any;
  options?: {
    title?: string;
    author?: string;
    orientation?: 'portrait' | 'landscape';
    includeCharts?: boolean;
    sheetName?: string;
    includeFormulas?: boolean;
  };
}
