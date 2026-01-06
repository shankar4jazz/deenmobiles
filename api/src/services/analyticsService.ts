import { PrismaClient } from '@prisma/client';
import {
  TechnicianPerformanceParams,
  TechnicianPerformanceReport,
  TechnicianMetrics,
  RevenueReportParams,
  RevenueReport,
  RevenueData,
  RevenueTrendData,
  PaymentAnalysis,
  DeviceAnalysisParams,
  DeviceAnalysisReport,
  DeviceData,
  IssueData,
  IssueAnalysisReport,
  PartsUsageData,
  PartsUsageReport,
  BranchComparisonParams,
  BranchComparisonReport,
  BranchMetrics,
  DailySummary,
  WeeklyReport,
  MonthlyAnalytics,
  QuarterlyReview,
  YoYComparison,
} from '../types/analytics';

const prisma = new PrismaClient();

export class AnalyticsService {
  /**
   * Get technician performance metrics
   * Tracks services completed, revenue, completion time, and customer ratings
   */
  async getTechnicianPerformance(
    params: TechnicianPerformanceParams
  ): Promise<TechnicianPerformanceReport> {
    const { companyId, branchId, technicianId, startDate, endDate, period } = params;

    // Build where clause
    const where: any = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      assignedToId: { not: null },
    };

    if (branchId) where.branchId = branchId;
    if (technicianId) where.assignedToId = technicianId;

    // Get all services for the period
    const services = await prisma.service.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        rating: true,
      },
    });

    // Group by technician
    const technicianMap = new Map<string, {
      name: string;
      services: typeof services;
      totalRevenue: number;
      completedServices: number;
      totalCompletionTime: number;
      ratings: number[];
    }>();

    for (const service of services) {
      if (!service.assignedTo) continue;

      const techId = service.assignedToId!;
      if (!technicianMap.has(techId)) {
        technicianMap.set(techId, {
          name: service.assignedTo.name,
          services: [],
          totalRevenue: 0,
          completedServices: 0,
          totalCompletionTime: 0,
          ratings: [],
        });
      }

      const tech = technicianMap.get(techId)!;
      tech.services.push(service);

      // Count completed services
      if (service.status === 'READY' || service.status === 'READY') {
        tech.completedServices++;
      }

      // Sum revenue (actual cost or estimated cost)
      const revenue = service.actualCost || service.estimatedCost;
      tech.totalRevenue += Number(revenue);

      // Calculate completion time (if completed)
      if (service.completedAt) {
        const completionTime =
          (service.completedAt.getTime() - service.createdAt.getTime()) / (1000 * 60 * 60);
        tech.totalCompletionTime += completionTime;
      }

      // Collect ratings
      if (service.rating) {
        tech.ratings.push(service.rating.rating);
      }
    }

    // Calculate metrics for each technician
    const technicians: TechnicianMetrics[] = [];
    let totalServices = 0;
    let totalRevenue = 0;
    let totalCompletionTime = 0;
    let totalRatings: number[] = [];

    for (const [techId, data] of technicianMap) {
      const avgCompletionTime = data.completedServices > 0
        ? data.totalCompletionTime / data.completedServices
        : 0;

      const avgRating = data.ratings.length > 0
        ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
        : null;

      const completionRate = data.services.length > 0
        ? (data.completedServices / data.services.length) * 100
        : 0;

      technicians.push({
        technicianId: techId,
        technicianName: data.name,
        servicesCompleted: data.completedServices,
        totalRevenue: data.totalRevenue,
        avgCompletionTime,
        customerRating: avgRating,
        activeHours: null, // TODO: Implement time tracking
        completionRate,
      });

      totalServices += data.completedServices;
      totalRevenue += data.totalRevenue;
      totalCompletionTime += data.totalCompletionTime;
      totalRatings.push(...data.ratings);
    }

    // Calculate summary
    const summary = {
      totalServices,
      totalRevenue,
      avgCompletionTime: totalServices > 0 ? totalCompletionTime / totalServices : 0,
      avgRating: totalRatings.length > 0
        ? totalRatings.reduce((a, b) => a + b, 0) / totalRatings.length
        : 0,
    };

    return {
      technicians: technicians.sort((a, b) => b.totalRevenue - a.totalRevenue),
      summary,
      period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
    };
  }

  /**
   * Generate revenue report with various grouping options
   * Supports grouping by day, week, month, service type, or branch
   */
  async getRevenueReport(params: RevenueReportParams): Promise<RevenueReport> {
    const { companyId, branchId, startDate, endDate, groupBy } = params;

    // Build where clause
    const where: any = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (branchId) where.branchId = branchId;

    // Get all services with revenue
    const services = await prisma.service.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group services based on groupBy parameter
    const dataMap = new Map<string, {
      revenue: number;
      services: number;
    }>();

    for (const service of services) {
      let key: string;

      switch (groupBy) {
        case 'day':
          key = service.createdAt.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(service.createdAt);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${service.createdAt.getFullYear()}-${String(service.createdAt.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'service_type':
          // Group by damage condition type (you can modify this logic)
          key = service.damageCondition.substring(0, 50); // First 50 chars of damage condition
          break;
        case 'branch':
          key = service.branch?.name || 'Unknown';
          break;
        default:
          key = 'All';
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, { revenue: 0, services: 0 });
      }

      const data = dataMap.get(key)!;
      const revenue = service.actualCost || service.estimatedCost;
      data.revenue += Number(revenue);
      data.services++;
    }

    // Convert map to array
    const reportData: RevenueData[] = [];
    let totalRevenue = 0;
    let totalServices = 0;

    for (const [label, data] of dataMap) {
      reportData.push({
        label,
        revenue: data.revenue,
        services: data.services,
        avgRevenue: data.services > 0 ? data.revenue / data.services : 0,
      });

      totalRevenue += data.revenue;
      totalServices += data.services;
    }

    // Sort by revenue descending
    reportData.sort((a, b) => b.revenue - a.revenue);

    return {
      data: reportData,
      total: {
        revenue: totalRevenue,
        services: totalServices,
        avgRevenue: totalServices > 0 ? totalRevenue / totalServices : 0,
      },
      period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
    };
  }

  /**
   * Get revenue trends over time
   * Returns time-series data for charting
   */
  async getRevenueTrends(
    companyId: string,
    branchId: string | undefined,
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month'
  ): Promise<RevenueTrendData[]> {
    const where: any = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (branchId) where.branchId = branchId;

    const services = await prisma.service.findMany({
      where,
      select: {
        createdAt: true,
        actualCost: true,
        estimatedCost: true,
      },
    });

    // Group by interval
    const dataMap = new Map<string, { revenue: number; services: number }>();

    for (const service of services) {
      let key: string;
      const date = new Date(service.createdAt);

      switch (interval) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
          break;
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, { revenue: 0, services: 0 });
      }

      const data = dataMap.get(key)!;
      const revenue = service.actualCost || service.estimatedCost;
      data.revenue += Number(revenue);
      data.services++;
    }

    // Convert to array and fill gaps
    const result: RevenueTrendData[] = [];
    const sortedKeys = Array.from(dataMap.keys()).sort();

    // Fill gaps with zero values
    if (sortedKeys.length > 0) {
      let currentDate = new Date(sortedKeys[0]);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        const key = currentDate.toISOString().split('T')[0];
        const data = dataMap.get(key) || { revenue: 0, services: 0 };

        result.push({
          date: key,
          revenue: data.revenue,
          services: data.services,
        });

        // Increment date based on interval
        switch (interval) {
          case 'day':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'week':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'month':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }
    }

    return result;
  }

  /**
   * Analyze payment collection patterns
   * Breaks down advance vs balance payments
   */
  async getPaymentAnalysis(
    companyId: string,
    branchId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<PaymentAnalysis> {
    const where: any = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (branchId) where.branchId = branchId;

    const services = await prisma.service.findMany({
      where,
      select: {
        actualCost: true,
        estimatedCost: true,
        advancePayment: true,
      },
    });

    let totalRevenue = 0;
    let advancePayments = 0;
    let balanceCollected = 0;
    let pending = 0;

    for (const service of services) {
      const totalCost = Number(service.actualCost || service.estimatedCost || 0);
      const advance = Number(service.advancePayment || 0);
      const balance = totalCost - advance;

      totalRevenue += totalCost;
      advancePayments += advance;

      // Assuming if actualCost is set, balance has been collected
      if (service.actualCost) {
        balanceCollected += balance;
      } else {
        pending += balance;
      }
    }

    const advancePercentage = totalRevenue > 0 ? (advancePayments / totalRevenue) * 100 : 0;
    const balancePercentage = totalRevenue > 0 ? (balanceCollected / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      advancePayments,
      balanceCollected,
      pending,
      advancePercentage,
      balancePercentage,
    };
  }

  /**
   * Analyze device models and their service patterns
   * Shows most serviced devices and revenue per model
   */
  async getDeviceAnalysis(params: DeviceAnalysisParams): Promise<DeviceAnalysisReport> {
    const { companyId, branchId, startDate, endDate, limit = 20 } = params;

    const where: any = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (branchId) where.branchId = branchId;

    const services = await prisma.service.findMany({
      where,
      select: {
        deviceModel: true,
        actualCost: true,
        estimatedCost: true,
        createdAt: true,
        completedAt: true,
      },
    });

    // Group by device model
    const deviceMap = new Map<string, {
      count: number;
      totalRevenue: number;
      totalCompletionTime: number;
      completedCount: number;
    }>();

    for (const service of services) {
      const model = service.deviceModel;
      if (!deviceMap.has(model)) {
        deviceMap.set(model, {
          count: 0,
          totalRevenue: 0,
          totalCompletionTime: 0,
          completedCount: 0,
        });
      }

      const data = deviceMap.get(model)!;
      data.count++;

      const revenue = service.actualCost || service.estimatedCost;
      data.totalRevenue += Number(revenue);

      if (service.completedAt) {
        const completionTime =
          (service.completedAt.getTime() - service.createdAt.getTime()) / (1000 * 60 * 60);
        data.totalCompletionTime += completionTime;
        data.completedCount++;
      }
    }

    // Convert to array
    const devices: DeviceData[] = [];
    let totalServices = 0;

    for (const [model, data] of deviceMap) {
      devices.push({
        deviceModel: model,
        count: data.count,
        avgCost: data.count > 0 ? data.totalRevenue / data.count : 0,
        totalRevenue: data.totalRevenue,
        avgCompletionTime: data.completedCount > 0 ? data.totalCompletionTime / data.completedCount : 0,
      });

      totalServices += data.count;
    }

    // Sort by count and limit
    devices.sort((a, b) => b.count - a.count);
    const limitedDevices = devices.slice(0, limit);

    return {
      devices: limitedDevices,
      total: {
        uniqueDevices: deviceMap.size,
        totalServices,
        avgCost: totalServices > 0 ? devices.reduce((sum, d) => sum + d.totalRevenue, 0) / totalServices : 0,
      },
    };
  }

  /**
   * Analyze common issues and repair patterns
   * Shows most frequent issues and their characteristics
   */
  async getIssueAnalysis(
    companyId: string,
    branchId: string | undefined,
    startDate: Date,
    endDate: Date,
    limit: number = 20
  ): Promise<IssueAnalysisReport> {
    const where: any = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (branchId) where.branchId = branchId;

    const services = await prisma.service.findMany({
      where,
      select: {
        damageCondition: true,
        actualCost: true,
        estimatedCost: true,
        createdAt: true,
        completedAt: true,
      },
    });

    // Group by issue (normalize to lower case and first 100 chars)
    const issueMap = new Map<string, {
      count: number;
      totalCost: number;
      totalCompletionTime: number;
      completedCount: number;
    }>();

    for (const service of services) {
      const issue = service.damageCondition.substring(0, 100).toLowerCase().trim();
      if (!issueMap.has(issue)) {
        issueMap.set(issue, {
          count: 0,
          totalCost: 0,
          totalCompletionTime: 0,
          completedCount: 0,
        });
      }

      const data = issueMap.get(issue)!;
      data.count++;

      const cost = service.actualCost || service.estimatedCost;
      data.totalCost += Number(cost);

      if (service.completedAt) {
        const completionTime =
          (service.completedAt.getTime() - service.createdAt.getTime()) / (1000 * 60 * 60);
        data.totalCompletionTime += completionTime;
        data.completedCount++;
      }
    }

    // Convert to array
    const issues: IssueData[] = [];
    let totalServices = 0;

    for (const [issue, data] of issueMap) {
      issues.push({
        issue,
        count: data.count,
        avgCost: data.count > 0 ? data.totalCost / data.count : 0,
        avgCompletionTime: data.completedCount > 0 ? data.totalCompletionTime / data.completedCount : 0,
      });

      totalServices += data.count;
    }

    // Sort by count and limit
    issues.sort((a, b) => b.count - a.count);
    const limitedIssues = issues.slice(0, limit);

    return {
      issues: limitedIssues,
      total: {
        uniqueIssues: issueMap.size,
        totalServices,
      },
    };
  }

  /**
   * Track parts usage and inventory insights
   * Shows which parts are used most frequently
   */
  async getPartsUsage(
    companyId: string,
    branchId: string | undefined,
    startDate: Date,
    endDate: Date,
    limit: number = 50
  ): Promise<PartsUsageReport> {
    // TODO: Implement parts usage tracking
    // 1. Query ServicePart records within date range
    // 2. Group by part ID
    // 3. Sum quantities and calculate revenue
    // 4. Count how many times each part was used
    // 5. Calculate avg price
    // 6. Sort and limit
    // 7. Return report

    throw new Error('Not implemented');
  }

  /**
   * Compare performance across branches
   * Provides rankings and comparative metrics
   */
  async getBranchComparison(params: BranchComparisonParams): Promise<BranchComparisonReport> {
    const { companyId, branchIds, startDate, endDate, metrics } = params;

    // TODO: Implement branch comparison
    // 1. Query services for all branches (or specified branches)
    // 2. Calculate metrics per branch
    // 3. Count technicians per branch
    // 4. Calculate services per technician
    // 5. Create rankings (by revenue, services, efficiency)
    // 6. Return comparison report

    throw new Error('Not implemented');
  }

  /**
   * Generate daily summary report
   * Snapshot of a single day's performance
   */
  async getDailySummary(
    companyId: string,
    branchId: string | undefined,
    date: Date
  ): Promise<DailySummary> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      companyId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (branchId) where.branchId = branchId;

    const services = await prisma.service.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Count by status
    let servicesReceived = services.length;
    let servicesCompleted = services.filter(
      (s) => s.status === 'READY' || s.status === 'READY'
    ).length;
    let servicesInProgress = services.filter((s) => s.status === 'IN_PROGRESS').length;

    // Calculate revenue
    let revenue = 0;
    for (const service of services) {
      const cost = service.actualCost || service.estimatedCost;
      revenue += Number(cost);
    }

    // Find top technician
    const technicianMap = new Map<string, { name: string; count: number }>();
    for (const service of services) {
      if (service.assignedTo && (service.status === 'READY' || service.status === 'READY')) {
        const techId = service.assignedToId!;
        if (!technicianMap.has(techId)) {
          technicianMap.set(techId, { name: service.assignedTo.name, count: 0 });
        }
        technicianMap.get(techId)!.count++;
      }
    }

    let topTechnician: DailySummary['topTechnician'] = null;
    let maxServices = 0;
    for (const [id, data] of technicianMap) {
      if (data.count > maxServices) {
        maxServices = data.count;
        topTechnician = {
          id,
          name: data.name,
          servicesCompleted: data.count,
        };
      }
    }

    // Find top issue
    const issueMap = new Map<string, number>();
    for (const service of services) {
      const issue = service.damageCondition.substring(0, 50).toLowerCase().trim();
      issueMap.set(issue, (issueMap.get(issue) || 0) + 1);
    }

    let topIssue: DailySummary['topIssue'] = null;
    let maxCount = 0;
    for (const [issue, count] of issueMap) {
      if (count > maxCount) {
        maxCount = count;
        topIssue = { issue, count };
      }
    }

    return {
      date: date.toISOString().split('T')[0],
      servicesReceived,
      servicesCompleted,
      servicesInProgress,
      revenue,
      topTechnician,
      topIssue,
    };
  }

  /**
   * Generate weekly report
   * Week-over-week performance with daily breakdown
   */
  async getWeeklyReport(
    companyId: string,
    branchId: string | undefined,
    weekStart: Date,
    weekEnd: Date
  ): Promise<WeeklyReport> {
    const where: any = {
      companyId,
      createdAt: {
        gte: weekStart,
        lte: weekEnd,
      },
    };

    if (branchId) where.branchId = branchId;

    const services = await prisma.service.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Count totals
    const totalServices = services.length;
    const completedServices = services.filter(
      (s) => s.status === 'READY' || s.status === 'READY'
    ).length;

    // Calculate revenue
    let revenue = 0;
    for (const service of services) {
      const cost = service.actualCost || service.estimatedCost;
      revenue += Number(cost);
    }

    // Daily breakdown
    const dailyMap = new Map<string, { services: number; revenue: number }>();
    for (const service of services) {
      const dateKey = service.createdAt.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { services: 0, revenue: 0 });
      }
      const data = dailyMap.get(dateKey)!;
      data.services++;
      const cost = service.actualCost || service.estimatedCost;
      data.revenue += Number(cost);
    }

    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        services: data.services,
        revenue: data.revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top performers
    const technicianMap = new Map<string, {
      name: string;
      servicesCompleted: number;
      revenue: number;
    }>();

    for (const service of services) {
      if (service.assignedTo && (service.status === 'READY' || service.status === 'READY')) {
        const techId = service.assignedToId!;
        if (!technicianMap.has(techId)) {
          technicianMap.set(techId, {
            name: service.assignedTo.name,
            servicesCompleted: 0,
            revenue: 0,
          });
        }
        const tech = technicianMap.get(techId)!;
        tech.servicesCompleted++;
        const cost = service.actualCost || service.estimatedCost;
        tech.revenue += Number(cost);
      }
    }

    const topPerformers = Array.from(technicianMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        servicesCompleted: data.servicesCompleted,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalServices,
      completedServices,
      revenue,
      dailyBreakdown,
      topPerformers,
    };
  }

  /**
   * Generate monthly analytics
   * Comprehensive monthly performance report
   */
  async getMonthlyAnalytics(
    companyId: string,
    branchId: string | undefined,
    month: number,
    year: number
  ): Promise<MonthlyAnalytics> {
    // TODO: Implement monthly analytics
    // 1. Query all services for the month
    // 2. Calculate totals and averages
    // 3. Break down by week
    // 4. Get top devices and issues
    // 5. Get technician performance for the month
    // 6. Return comprehensive analytics

    throw new Error('Not implemented');
  }

  /**
   * Generate quarterly review
   * Quarter-over-quarter performance and growth
   */
  async getQuarterlyReview(
    companyId: string,
    branchId: string | undefined,
    quarter: number,
    year: number
  ): Promise<QuarterlyReview> {
    // TODO: Implement quarterly review
    // 1. Determine quarter date range
    // 2. Query services for the quarter
    // 3. Break down by month
    // 4. Calculate growth rate vs previous quarter
    // 5. Compare branch performance
    // 6. Return quarterly review

    throw new Error('Not implemented');
  }

  /**
   * Year-over-year comparison
   * Compare current year performance with previous years
   */
  async getYoYComparison(
    companyId: string,
    branchId: string | undefined,
    currentYear: number,
    compareYears: number[]
  ): Promise<YoYComparison> {
    // TODO: Implement year-over-year comparison
    // 1. Query services for each year
    // 2. Calculate metrics per year
    // 3. Compute growth percentages
    // 4. Identify best/worst months
    // 5. Determine overall trend
    // 6. Return comparison report

    throw new Error('Not implemented');
  }

  /**
   * Log technician performance for a specific date
   * Used for daily batch processing to populate TechnicianPerformanceLog
   */
  async logTechnicianPerformance(
    technicianId: string,
    date: Date,
    companyId: string,
    branchId: string
  ): Promise<void> {
    // TODO: Implement performance logging
    // 1. Calculate metrics for technician on given date
    // 2. Upsert TechnicianPerformanceLog record
    // This can be run as a daily cron job

    throw new Error('Not implemented');
  }

  /**
   * Batch process performance logs for all technicians
   * Should be run daily via cron job
   */
  async batchLogPerformance(companyId: string, date: Date): Promise<void> {
    // TODO: Implement batch performance logging
    // 1. Get all active technicians for company
    // 2. For each technician, log their performance
    // 3. Handle errors gracefully

    throw new Error('Not implemented');
  }

  /**
   * Get cached report or generate new one
   * Generic method for report caching
   */
  async getCachedReport<T>(
    reportType: string,
    reportKey: string,
    companyId: string,
    branchId: string | undefined,
    generator: () => Promise<T>,
    ttl: number = 3600 // 1 hour default
  ): Promise<T> {
    // TODO: Implement report caching
    // 1. Check if cache exists and is valid
    // 2. If yes, return cached data
    // 3. If no, generate report using generator function
    // 4. Cache the result with expiry
    // 5. Return generated report

    throw new Error('Not implemented');
  }

  /**
   * Invalidate report cache
   * Called when service data is updated
   */
  async invalidateReportCache(
    reportType?: string,
    companyId?: string
  ): Promise<void> {
    // TODO: Implement cache invalidation
    // 1. Delete matching cache entries
    // 2. If no filters provided, clear all expired caches

    throw new Error('Not implemented');
  }

  /**
   * Get technician rankings
   * Leaderboard of top performing technicians
   */
  async getTechnicianRankings(
    companyId: string,
    branchId: string | undefined,
    startDate: Date,
    endDate: Date,
    sortBy: 'services' | 'revenue' | 'rating' = 'revenue',
    limit: number = 10
  ): Promise<TechnicianMetrics[]> {
    // Reuse getTechnicianPerformance logic
    const report = await this.getTechnicianPerformance({
      companyId,
      branchId,
      startDate,
      endDate,
      period: 'monthly',
    });

    // Sort by specified metric
    let sorted = [...report.technicians];
    switch (sortBy) {
      case 'services':
        sorted.sort((a, b) => b.servicesCompleted - a.servicesCompleted);
        break;
      case 'revenue':
        sorted.sort((a, b) => b.totalRevenue - a.totalRevenue);
        break;
      case 'rating':
        sorted.sort((a, b) => {
          const ratingA = a.customerRating || 0;
          const ratingB = b.customerRating || 0;
          return ratingB - ratingA;
        });
        break;
    }

    return sorted.slice(0, limit);
  }

  /**
   * Get service completion rate trends
   * Track how completion rate changes over time
   */
  async getCompletionRateTrends(
    companyId: string,
    branchId: string | undefined,
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month'
  ): Promise<Array<{ date: string; completionRate: number; totalServices: number }>> {
    const where: any = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (branchId) where.branchId = branchId;

    const services = await prisma.service.findMany({
      where,
      select: {
        createdAt: true,
        status: true,
      },
    });

    // Group by interval
    const dataMap = new Map<string, { total: number; completed: number }>();

    for (const service of services) {
      let key: string;
      const date = new Date(service.createdAt);

      switch (interval) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
          break;
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, { total: 0, completed: 0 });
      }

      const data = dataMap.get(key)!;
      data.total++;
      if (service.status === 'READY' || service.status === 'READY') {
        data.completed++;
      }
    }

    // Convert to array
    const result = Array.from(dataMap.entries())
      .map(([date, data]) => ({
        date,
        completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
        totalServices: data.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  /**
   * Get average service value trends
   * Track how average service cost changes over time
   */
  async getAvgServiceValueTrends(
    companyId: string,
    branchId: string | undefined,
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month'
  ): Promise<Array<{ date: string; avgValue: number; count: number }>> {
    const where: any = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (branchId) where.branchId = branchId;

    const services = await prisma.service.findMany({
      where,
      select: {
        createdAt: true,
        actualCost: true,
        estimatedCost: true,
      },
    });

    // Group by interval
    const dataMap = new Map<string, { totalCost: number; count: number }>();

    for (const service of services) {
      let key: string;
      const date = new Date(service.createdAt);

      switch (interval) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
          break;
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, { totalCost: 0, count: 0 });
      }

      const data = dataMap.get(key)!;
      const cost = service.actualCost || service.estimatedCost;
      data.totalCost += Number(cost);
      data.count++;
    }

    // Convert to array
    const result = Array.from(dataMap.entries())
      .map(([date, data]) => ({
        date,
        avgValue: data.count > 0 ? data.totalCost / data.count : 0,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }
}

export default new AnalyticsService();
