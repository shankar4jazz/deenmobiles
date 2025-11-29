import prisma from '../config/database';
import { Logger } from '../utils/logger';

export class DashboardService {
  /**
   * Get dashboard statistics based on user role
   */
  static async getDashboardStats(
    userId: string,
    role: string,
    companyId: string,
    branchId?: string | null
  ) {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      let whereClause: any = { companyId };

      // Apply role-based filters
      if (role === 'MANAGER' && branchId) {
        whereClause.branchId = branchId;
      } else if (role === 'TECHNICIAN') {
        whereClause.assignedToId = userId;
      } else if (role === 'RECEPTIONIST' && branchId) {
        whereClause.branchId = branchId;
      }

      // Total services this month
      const totalServicesThisMonth = await prisma.service.count({
        where: {
          ...whereClause,
          createdAt: { gte: startOfMonth },
        },
      });

      // Total services last month
      const totalServicesLastMonth = await prisma.service.count({
        where: {
          ...whereClause,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      });

      // Calculate percentage change
      const totalServicesChange = this.calculatePercentageChange(
        totalServicesLastMonth,
        totalServicesThisMonth
      );

      // Revenue this month
      const servicesWithCostThisMonth = await prisma.service.findMany({
        where: {
          ...whereClause,
          createdAt: { gte: startOfMonth },
          actualCost: { not: null },
        },
        select: { actualCost: true },
      });

      const revenueThisMonth = servicesWithCostThisMonth.reduce(
        (sum, service) => sum + (service.actualCost || 0),
        0
      );

      // Revenue last month
      const servicesWithCostLastMonth = await prisma.service.findMany({
        where: {
          ...whereClause,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          actualCost: { not: null },
        },
        select: { actualCost: true },
      });

      const revenueLastMonth = servicesWithCostLastMonth.reduce(
        (sum, service) => sum + (service.actualCost || 0),
        0
      );

      const revenueChange = this.calculatePercentageChange(revenueLastMonth, revenueThisMonth);

      // Pending services
      const pendingServices = await prisma.service.count({
        where: {
          ...whereClause,
          status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] },
        },
      });

      // Completed today
      const completedToday = await prisma.service.count({
        where: {
          ...whereClause,
          status: 'COMPLETED',
          completedAt: { gte: startOfToday },
        },
      });

      // Completed yesterday for comparison
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);

      const completedYesterday = await prisma.service.count({
        where: {
          ...whereClause,
          status: 'COMPLETED',
          completedAt: { gte: startOfYesterday, lt: startOfToday },
        },
      });

      const completedTodayChange = this.calculatePercentageChange(
        completedYesterday,
        completedToday
      );

      return {
        totalServices: totalServicesThisMonth,
        totalServicesChange,
        revenue: revenueThisMonth,
        revenueChange,
        pendingServices,
        pendingServicesChange: 0, // Can be calculated based on previous period if needed
        completedToday,
        completedTodayChange,
      };
    } catch (error) {
      Logger.error('Error fetching dashboard stats', { error, userId });
      throw error;
    }
  }

  /**
   * Get chart data for services over time (last 10 days)
   */
  static async getServicesChartData(
    companyId: string,
    branchId?: string | null,
    role?: string,
    userId?: string
  ) {
    try {
      const now = new Date();
      const chartData = [];

      for (let i = 9; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

        let whereClause: any = {
          companyId,
          createdAt: { gte: startOfDay, lte: endOfDay },
        };

        if (role === 'MANAGER' && branchId) {
          whereClause.branchId = branchId;
        } else if (role === 'TECHNICIAN' && userId) {
          whereClause.assignedToId = userId;
        } else if (role === 'RECEPTIONIST' && branchId) {
          whereClause.branchId = branchId;
        }

        const count = await prisma.service.count({ where: whereClause });

        // Goal could be a calculated average or set manually
        const goal = role === 'TECHNICIAN' ? 5 : 10;

        chartData.push({
          name: (i + 1).toString(),
          value: count,
          goal,
        });
      }

      return chartData;
    } catch (error) {
      Logger.error('Error fetching services chart data', { error });
      throw error;
    }
  }

  /**
   * Get status breakdown for pie/donut chart
   */
  static async getStatusBreakdown(
    companyId: string,
    branchId?: string | null,
    role?: string,
    userId?: string
  ) {
    try {
      let whereClause: any = { companyId };

      if (role === 'MANAGER' && branchId) {
        whereClause.branchId = branchId;
      } else if (role === 'TECHNICIAN' && userId) {
        whereClause.assignedToId = userId;
      } else if (role === 'RECEPTIONIST' && branchId) {
        whereClause.branchId = branchId;
      }

      const statuses = await prisma.service.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true },
      });

      return statuses.map((item) => ({
        name: item.status,
        value: item._count.status,
      }));
    } catch (error) {
      Logger.error('Error fetching status breakdown', { error });
      throw error;
    }
  }

  /**
   * Get weekly trend data
   */
  static async getWeeklyTrend(
    companyId: string,
    branchId?: string | null,
    role?: string,
    userId?: string
  ) {
    try {
      const now = new Date();
      const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      const trendData = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

        let whereClause: any = {
          companyId,
          createdAt: { gte: startOfDay, lte: endOfDay },
        };

        if (role === 'MANAGER' && branchId) {
          whereClause.branchId = branchId;
        } else if (role === 'TECHNICIAN' && userId) {
          whereClause.assignedToId = userId;
        } else if (role === 'RECEPTIONIST' && branchId) {
          whereClause.branchId = branchId;
        }

        const count = await prisma.service.count({ where: whereClause });
        const dayIndex = date.getDay();

        trendData.push({
          name: days[dayIndex],
          value: count,
        });
      }

      return trendData;
    } catch (error) {
      Logger.error('Error fetching weekly trend', { error });
      throw error;
    }
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(
    companyId: string,
    branchId?: string | null,
    role?: string,
    userId?: string,
    limit: number = 5
  ) {
    try {
      let whereClause: any = { companyId };

      if (role === 'MANAGER' && branchId) {
        whereClause.branchId = branchId;
      } else if (role === 'TECHNICIAN' && userId) {
        whereClause.assignedToId = userId;
      } else if (role === 'RECEPTIONIST' && branchId) {
        whereClause.branchId = branchId;
      }

      const recentServices = await prisma.service.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        include: {
          customer: { select: { name: true } },
        },
      });

      return recentServices.map((service) => ({
        id: service.id,
        title: `${service.status} - ${service.ticketNumber}`,
        subtitle: service.customer?.name || 'Unknown Customer',
        type: service.status === 'COMPLETED' ? 'incoming' : service.status === 'CANCELLED' ? 'outgoing' : 'neutral',
        timestamp: service.updatedAt.toISOString(),
      }));
    } catch (error) {
      Logger.error('Error fetching recent activity', { error });
      throw error;
    }
  }

  /**
   * Calculate percentage change between two values
   */
  private static calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  }

  /**
   * Get Admin Dashboard - Company-wide overview with branch metrics
   */
  static async getAdminDashboard(userId: string, companyId: string) {
    try {
      // Get basic stats
      const stats = await this.getDashboardStats(userId, 'ADMIN', companyId);

      // Get all branches with their statistics
      const branches = await prisma.branch.findMany({
        where: { companyId, isActive: true },
        include: {
          _count: {
            select: {
              services: true,
              users: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Get branch-wise service status distribution
      const branchMetrics = await Promise.all(
        branches.map(async (branch) => {
          const pending = await prisma.service.count({
            where: { branchId: branch.id, status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] } },
          });
          const completed = await prisma.service.count({
            where: { branchId: branch.id, status: 'COMPLETED' },
          });
          const revenue = await prisma.service.aggregate({
            where: { branchId: branch.id, actualCost: { not: null } },
            _sum: { actualCost: true },
          });

          return {
            id: branch.id,
            name: branch.name,
            code: branch.code,
            manager: branch.manager,
            totalServices: branch._count.services,
            totalEmployees: branch._count.users,
            pendingServices: pending,
            completedServices: completed,
            revenue: revenue._sum.actualCost || 0,
          };
        })
      );

      const charts = {
        servicesOverTime: await this.getServicesChartData(companyId),
        statusBreakdown: await this.getStatusBreakdown(companyId),
        weeklyTrend: await this.getWeeklyTrend(companyId),
      };

      const activity = await this.getRecentActivity(companyId, null, 'ADMIN', userId, 10);

      return {
        stats,
        branches: branchMetrics,
        charts,
        activity,
      };
    } catch (error) {
      Logger.error('Error fetching admin dashboard', { error, userId });
      throw error;
    }
  }

  /**
   * Get Manager Dashboard - Branch-specific data with staff management
   */
  static async getManagerDashboard(userId: string, companyId: string, branchId: string) {
    try {
      const stats = await this.getDashboardStats(userId, 'MANAGER', companyId, branchId);

      // Get branch details
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        include: {
          company: { select: { name: true } },
        },
      });

      // Get branch employees grouped by role
      const employees = await prisma.user.findMany({
        where: { branchId, isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          lastLoginAt: true,
          _count: {
            select: {
              assignedServices: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Group employees by role
      const employeesByRole = employees.reduce((acc, emp) => {
        const role = emp.role;
        if (!acc[role]) acc[role] = [];
        acc[role].push({
          ...emp,
          activeServices: emp._count.assignedServices,
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Get service requests grouped by status
      const servicesByStatus = await prisma.service.groupBy({
        by: ['status'],
        where: { branchId },
        _count: { status: true },
      });

      // Get recent service requests
      const recentServices = await prisma.service.findMany({
        where: { branchId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          customer: { select: { name: true, phone: true } },
          assignedTo: { select: { name: true } },
        },
      });

      const charts = {
        servicesOverTime: await this.getServicesChartData(companyId, branchId, 'MANAGER'),
        statusBreakdown: await this.getStatusBreakdown(companyId, branchId, 'MANAGER'),
        weeklyTrend: await this.getWeeklyTrend(companyId, branchId, 'MANAGER'),
      };

      const activity = await this.getRecentActivity(companyId, branchId, 'MANAGER', userId, 10);

      return {
        stats,
        branch,
        employees: employeesByRole,
        servicesByStatus: servicesByStatus.map(s => ({ name: s.status, count: s._count.status })),
        recentServices,
        charts,
        activity,
      };
    } catch (error) {
      Logger.error('Error fetching manager dashboard', { error, userId, branchId });
      throw error;
    }
  }

  /**
   * Get Receptionist Dashboard - Service intake and customer service focused
   */
  static async getReceptionistDashboard(userId: string, companyId: string, branchId: string) {
    try {
      const stats = await this.getDashboardStats(userId, 'RECEPTIONIST', companyId, branchId);

      // Get today's service requests
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const todayServices = await prisma.service.findMany({
        where: {
          branchId,
          createdAt: { gte: startOfToday },
        },
        include: {
          customer: { select: { name: true, phone: true } },
          assignedTo: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get open/pending service requests
      const openServices = await prisma.service.findMany({
        where: {
          branchId,
          status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] },
        },
        include: {
          customer: { select: { name: true, phone: true } },
          assignedTo: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      // Get recent customers
      const recentCustomers = await prisma.customer.findMany({
        where: { branchId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          _count: {
            select: { services: true },
          },
        },
      });

      // Quick stats for receptionist
      const quickStats = {
        pendingServices: await prisma.service.count({
          where: { branchId, status: 'PENDING' },
        }),
        inProgressServices: await prisma.service.count({
          where: { branchId, status: 'IN_PROGRESS' },
        }),
        waitingForParts: await prisma.service.count({
          where: { branchId, status: 'WAITING_PARTS' },
        }),
        readyForDelivery: await prisma.service.count({
          where: { branchId, status: 'COMPLETED' },
        }),
      };

      const activity = await this.getRecentActivity(companyId, branchId, 'RECEPTIONIST', userId, 15);

      return {
        stats,
        todayServices,
        openServices,
        recentCustomers,
        quickStats,
        activity,
      };
    } catch (error) {
      Logger.error('Error fetching receptionist dashboard', { error, userId, branchId });
      throw error;
    }
  }

  /**
   * Get Technician Manager Dashboard - Task assignment and tracking focused
   */
  static async getTechnicianManagerDashboard(userId: string, companyId: string, branchId: string) {
    try {
      const stats = await this.getDashboardStats(userId, 'MANAGER', companyId, branchId);

      // Get unassigned service requests
      const unassignedServices = await prisma.service.findMany({
        where: {
          branchId,
          assignedToId: null,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        include: {
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Get all technicians in the branch with their workload
      const technicians = await prisma.user.findMany({
        where: {
          branchId,
          role: 'TECHNICIAN',
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          _count: {
            select: {
              assignedServices: {
                where: {
                  status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] },
                },
              },
            },
          },
          assignedServices: {
            where: {
              status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] },
            },
            include: {
              customer: { select: { name: true, phone: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });

      const technicianWorkload = technicians.map(tech => ({
        id: tech.id,
        name: tech.name,
        email: tech.email,
        phone: tech.phone,
        activeTasksCount: tech._count.assignedServices,
        activeTasks: tech.assignedServices,
      }));

      // Get all service requests for the branch
      const allServices = await prisma.service.findMany({
        where: { branchId },
        include: {
          customer: { select: { name: true, phone: true } },
          assignedTo: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Service status distribution
      const statusDistribution = await prisma.service.groupBy({
        by: ['status'],
        where: { branchId },
        _count: { status: true },
      });

      const charts = {
        servicesOverTime: await this.getServicesChartData(companyId, branchId, 'MANAGER'),
        statusBreakdown: await this.getStatusBreakdown(companyId, branchId, 'MANAGER'),
        weeklyTrend: await this.getWeeklyTrend(companyId, branchId, 'MANAGER'),
      };

      const activity = await this.getRecentActivity(companyId, branchId, 'MANAGER', userId, 10);

      return {
        stats,
        unassignedServices,
        technicians: technicianWorkload,
        allServices,
        statusDistribution: statusDistribution.map(s => ({ name: s.status, count: s._count.status })),
        charts,
        activity,
      };
    } catch (error) {
      Logger.error('Error fetching technician manager dashboard', { error, userId, branchId });
      throw error;
    }
  }

  /**
   * Get Technician Dashboard - Only assigned tasks
   */
  static async getTechnicianDashboard(userId: string, companyId: string, branchId: string) {
    try {
      const stats = await this.getDashboardStats(userId, 'TECHNICIAN', companyId, branchId);

      // Get assigned service requests
      const assignedServices = await prisma.service.findMany({
        where: {
          assignedToId: userId,
          status: { notIn: ['COMPLETED', 'DELIVERED', 'CANCELLED'] },
        },
        include: {
          customer: { select: { name: true, phone: true, address: true } },
          branch: { select: { name: true, phone: true } },
          partsUsed: {
            include: {
              part: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Get completed services
      const completedServices = await prisma.service.findMany({
        where: {
          assignedToId: userId,
          status: { in: ['COMPLETED', 'DELIVERED'] },
        },
        include: {
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
      });

      // Technician performance stats
      const performanceStats = {
        totalAssigned: await prisma.service.count({
          where: { assignedToId: userId },
        }),
        completed: await prisma.service.count({
          where: { assignedToId: userId, status: { in: ['COMPLETED', 'DELIVERED'] } },
        }),
        pending: await prisma.service.count({
          where: { assignedToId: userId, status: 'PENDING' },
        }),
        inProgress: await prisma.service.count({
          where: { assignedToId: userId, status: 'IN_PROGRESS' },
        }),
        waitingParts: await prisma.service.count({
          where: { assignedToId: userId, status: 'WAITING_PARTS' },
        }),
      };

      const charts = {
        servicesOverTime: await this.getServicesChartData(companyId, branchId, 'TECHNICIAN', userId),
        statusBreakdown: await this.getStatusBreakdown(companyId, branchId, 'TECHNICIAN', userId),
        weeklyTrend: await this.getWeeklyTrend(companyId, branchId, 'TECHNICIAN', userId),
      };

      const activity = await this.getRecentActivity(companyId, branchId, 'TECHNICIAN', userId, 10);

      return {
        stats,
        assignedServices,
        completedServices,
        performanceStats,
        charts,
        activity,
      };
    } catch (error) {
      Logger.error('Error fetching technician dashboard', { error, userId, branchId });
      throw error;
    }
  }

  /**
   * Helper method to get date range based on period
   */
  private static getDateRange(startDate?: string, endDate?: string, period?: string) {
    const now = new Date();
    let start: Date;
    let end: Date = endDate ? new Date(endDate) : now;

    if (startDate) {
      start = new Date(startDate);
    } else if (period) {
      switch (period) {
        case 'day':
        case 'today':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          start = new Date(now);
          start.setDate(now.getDate() - 7);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1); // Default to current month
      }
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1); // Default to current month
    }

    return { start, end };
  }

  /**
   * Get Super Admin Dashboard - Overall company analytics + all branches summary
   */
  static async getSuperAdminDashboard(
    companyId: string,
    startDate?: string,
    endDate?: string,
    period?: string
  ) {
    try {
      const { start, end } = this.getDateRange(startDate, endDate, period);

      // Overall company stats
      const totalBranches = await prisma.branch.count({ where: { companyId, isActive: true } });
      const totalCustomers = await prisma.customer.count({ where: { companyId } });
      const totalEmployees = await prisma.user.count({ where: { companyId, isActive: true } });

      // Revenue for period
      const revenue = await prisma.service.aggregate({
        where: {
          companyId,
          actualCost: { not: null },
          createdAt: { gte: start, lte: end },
        },
        _sum: { actualCost: true },
      });

      // Expenses for period
      const expenses = await prisma.expense.aggregate({
        where: {
          companyId,
          expenseDate: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      // Total inventory value across all branches
      const inventoryValue = await prisma.branchInventory.aggregate({
        where: {
          branch: { companyId },
        },
        _sum: { stockQuantity: true },
      });

      // Get all branches with detailed metrics
      const branches = await prisma.branch.findMany({
        where: { companyId, isActive: true },
        include: {
          manager: {
            select: { id: true, name: true, email: true, role: true },
          },
          _count: {
            select: {
              customers: true,
              services: true,
              users: true,
              inventories: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Get detailed metrics for each branch
      const branchMetrics = await Promise.all(
        branches.map(async (branch) => {
          // Services stats
          const services = await prisma.service.groupBy({
            by: ['status'],
            where: {
              branchId: branch.id,
              createdAt: { gte: start, lte: end },
            },
            _count: { status: true },
          });

          const totalServices = services.reduce((sum, s) => sum + s._count.status, 0);
          const pendingServices = services.find(s => ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'].includes(s.status))?._count.status || 0;
          const completedServices = services.find(s => s.status === 'COMPLETED')?._count.status || 0;

          // Revenue for period
          const branchRevenue = await prisma.service.aggregate({
            where: {
              branchId: branch.id,
              actualCost: { not: null },
              createdAt: { gte: start, lte: end },
            },
            _sum: { actualCost: true },
          });

          // Expenses for period
          const branchExpenses = await prisma.expense.aggregate({
            where: {
              branchId: branch.id,
              expenseDate: { gte: start, lte: end },
            },
            _sum: { amount: true },
          });

          // Inventory stats - Get items where stockQuantity is low or zero
          const inventoryItems = await prisma.branchInventory.findMany({
            where: { branchId: branch.id },
            select: {
              stockQuantity: true,
              minStockLevel: true,
            },
          });

          const lowStock = inventoryItems.filter(
            item => item.minStockLevel && item.stockQuantity.lte(item.minStockLevel) && item.stockQuantity.gt(0)
          ).length;

          const outOfStock = inventoryItems.filter(
            item => item.stockQuantity.equals(0)
          ).length;

          const revenueAmount = branchRevenue._sum.actualCost ? Number(branchRevenue._sum.actualCost) : 0;
          const expensesAmount = branchExpenses._sum.amount ? Number(branchExpenses._sum.amount) : 0;

          return {
            id: branch.id,
            name: branch.name,
            code: branch.code,
            isActive: branch.isActive,
            manager: branch.manager,
            totalCustomers: branch._count.customers,
            totalServices,
            pendingServices,
            completedServices,
            revenue: revenueAmount,
            expenses: expensesAmount,
            profit: revenueAmount - expensesAmount,
            totalEmployees: branch._count.users,
            totalItems: branch._count.inventories,
            lowStockItems: lowStock,
            outOfStockItems: outOfStock,
          };
        })
      );

      // Top performing branches
      const topBranchesByRevenue = [...branchMetrics]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const topBranchesByServices = [...branchMetrics]
        .sort((a, b) => b.totalServices - a.totalServices)
        .slice(0, 5);

      const totalRevenueAmount = revenue._sum.actualCost ? Number(revenue._sum.actualCost) : 0;
      const totalExpensesAmount = expenses._sum.amount ? Number(expenses._sum.amount) : 0;
      const totalInventoryQty = inventoryValue._sum.stockQuantity || 0;

      return {
        summary: {
          totalBranches,
          totalCustomers,
          totalEmployees,
          totalRevenue: totalRevenueAmount,
          totalExpenses: totalExpensesAmount,
          totalProfit: totalRevenueAmount - totalExpensesAmount,
          totalInventoryItems: Number(totalInventoryQty),
          period: { start, end },
        },
        branches: branchMetrics,
        topPerformers: {
          byRevenue: topBranchesByRevenue,
          byServices: topBranchesByServices,
        },
      };
    } catch (error) {
      Logger.error('Error fetching super admin dashboard', { error, companyId });
      throw error;
    }
  }

  /**
   * Get Branch Detailed Analytics - Comprehensive single branch analytics
   */
  static async getBranchDetailedAnalytics(
    branchId: string,
    companyId: string,
    startDate?: string,
    endDate?: string,
    period?: string
  ) {
    try {
      const { start, end } = this.getDateRange(startDate, endDate, period);

      // Get branch details
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        include: {
          manager: {
            select: { id: true, name: true, email: true, phone: true, role: true },
          },
          company: {
            select: { id: true, name: true },
          },
        },
      });

      if (!branch || branch.companyId !== companyId) {
        throw new Error('Branch not found or access denied');
      }

      // Get financial, inventory, operations, and customer reports
      const [financial, inventory, operations, customers] = await Promise.all([
        this.getBranchFinancialReport(branchId, companyId, startDate, endDate, period),
        this.getBranchInventoryReport(branchId, companyId),
        this.getBranchOperationsReport(branchId, companyId, startDate, endDate, period),
        this.getBranchCustomerReport(branchId, companyId, startDate, endDate, period),
      ]);

      return {
        branch,
        period: { start, end },
        financial,
        inventory,
        operations,
        customers,
      };
    } catch (error) {
      Logger.error('Error fetching branch detailed analytics', { error, branchId });
      throw error;
    }
  }

  /**
   * Get Branch Financial Report - Revenue, expenses, profit margins
   */
  static async getBranchFinancialReport(
    branchId: string,
    companyId: string,
    startDate?: string,
    endDate?: string,
    period?: string
  ) {
    try {
      const { start, end } = this.getDateRange(startDate, endDate, period);

      // Revenue breakdown
      const revenue = await prisma.service.aggregate({
        where: {
          branchId,
          actualCost: { not: null },
          createdAt: { gte: start, lte: end },
        },
        _sum: { actualCost: true },
        _count: { id: true },
        _avg: { actualCost: true },
      });

      // Revenue by service status
      const revenueByStatus = await prisma.service.groupBy({
        by: ['status'],
        where: {
          branchId,
          actualCost: { not: null },
          createdAt: { gte: start, lte: end },
        },
        _sum: { actualCost: true },
        _count: { status: true },
      });

      // Expenses breakdown
      const expenses = await prisma.expense.aggregate({
        where: {
          branchId,
          expenseDate: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true },
      });

      // Expenses by category
      const expensesByCategory = await prisma.expense.groupBy({
        by: ['categoryId'],
        where: {
          branchId,
          expenseDate: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: { id: true },
      });

      // Get category names
      const categoriesData = await Promise.all(
        expensesByCategory.map(async (exp) => {
          const category = await prisma.expenseCategory.findUnique({
            where: { id: exp.categoryId },
            select: { name: true },
          });
          return {
            category: category?.name || 'Uncategorized',
            amount: exp._sum.amount || 0,
            count: exp._count.id,
          };
        })
      );

      // Petty cash status
      const pettyCashBalance = await prisma.pettyCashTransfer.aggregate({
        where: { branchId },
        _sum: { amount: true },
      });

      const pettyCashSpent = await prisma.pettyCashRequest.aggregate({
        where: {
          branchId,
          status: 'APPROVED',
          createdAt: { gte: start, lte: end },
        },
        _sum: { requestedAmount: true },
      });

      // Revenue trend (daily for the period)
      const revenueTrend = await this.getRevenueTrendData(branchId, start, end);

      const totalRevenue = revenue._sum.actualCost ? Number(revenue._sum.actualCost) : 0;
      const totalExpenses = expenses._sum.amount ? Number(expenses._sum.amount) : 0;
      const pettyCashReceived = pettyCashBalance._sum.amount ? Number(pettyCashBalance._sum.amount) : 0;
      const pettyCashSpentAmount = pettyCashSpent._sum.requestedAmount ? Number(pettyCashSpent._sum.requestedAmount) : 0;

      return {
        revenue: {
          total: totalRevenue,
          count: revenue._count.id,
          average: revenue._avg.actualCost || 0,
          byStatus: revenueByStatus.map(r => ({
            status: r.status,
            amount: r._sum.actualCost || 0,
            count: r._count.status,
          })),
          trend: revenueTrend,
        },
        expenses: {
          total: totalExpenses,
          count: expenses._count.id,
          average: expenses._avg.amount || 0,
          byCategory: categoriesData,
        },
        profit: {
          total: totalRevenue - totalExpenses,
          margin: totalRevenue
            ? (((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(2)
            : '0',
        },
        pettyCash: {
          balance: pettyCashReceived - pettyCashSpentAmount,
          received: pettyCashReceived,
          spent: pettyCashSpentAmount,
        },
      };
    } catch (error) {
      Logger.error('Error fetching branch financial report', { error, branchId });
      throw error;
    }
  }

  /**
   * Get revenue trend data for a date range
   */
  private static async getRevenueTrendData(branchId: string, start: Date, end: Date) {
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const trendData = [];

    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      const dailyRevenue = await prisma.service.aggregate({
        where: {
          branchId,
          actualCost: { not: null },
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { actualCost: true },
      });

      trendData.push({
        date: startOfDay.toISOString().split('T')[0],
        revenue: dailyRevenue._sum.actualCost || 0,
      });
    }

    return trendData;
  }

  /**
   * Get Branch Inventory Report - Stock levels, value, alerts
   */
  static async getBranchInventoryReport(branchId: string, companyId: string) {
    try {
      // Total inventory items
      const totalItems = await prisma.branchInventory.count({ where: { branchId } });

      // Get all inventory items for processing
      const allInventoryItems = await prisma.branchInventory.findMany({
        where: { branchId },
        select: {
          stockQuantity: true,
          minStockLevel: true,
          lastPurchasePrice: true,
        },
      });

      // Stock status breakdown
      const lowStock = allInventoryItems.filter(
        item => item.minStockLevel && item.stockQuantity.lte(item.minStockLevel) && item.stockQuantity.gt(0)
      ).length;

      const outOfStock = allInventoryItems.filter(
        item => item.stockQuantity.equals(0)
      ).length;

      const normalStock = totalItems - lowStock - outOfStock;

      // Stock value calculation
      const inventoryItems = await prisma.branchInventory.findMany({
        where: { branchId },
        select: {
          stockQuantity: true,
          lastPurchasePrice: true,
          item: {
            select: { itemName: true, itemCode: true },
          },
        },
      });

      const totalStockValue = inventoryItems.reduce(
        (sum, item) => sum + (Number(item.stockQuantity) * Number(item.lastPurchasePrice || 0)),
        0
      );

      // Low stock alerts
      const lowStockAlertsData = await prisma.branchInventory.findMany({
        where: { branchId },
        include: {
          item: {
            select: { itemName: true, itemCode: true },
          },
        },
        orderBy: { stockQuantity: 'asc' },
        take: 100,
      });

      const lowStockAlerts = lowStockAlertsData.filter(
        item => item.minStockLevel && item.stockQuantity.lte(item.minStockLevel)
      ).slice(0, 20);

      // Recent stock movements
      const recentMovements = await prisma.stockMovement.findMany({
        where: { branchId },
        include: {
          branchInventory: {
            select: {
              item: {
                select: { itemName: true, itemCode: true },
              },
            },
          },
          user: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Purchase orders summary
      const purchaseOrders = await prisma.purchaseOrder.groupBy({
        by: ['status'],
        where: { branchId },
        _count: { status: true },
        _sum: { totalAmount: true },
      });

      return {
        summary: {
          totalItems,
          normalStock,
          lowStock,
          outOfStock,
          totalValue: totalStockValue,
        },
        lowStockAlerts: lowStockAlerts.map(item => ({
          id: item.id,
          itemName: item.item.itemName,
          itemCode: item.item.itemCode,
          currentStock: Number(item.stockQuantity),
          minStock: item.minStockLevel ? Number(item.minStockLevel) : 0,
          reorderLevel: item.reorderLevel ? Number(item.reorderLevel) : 0,
        })),
        recentMovements: recentMovements.map(movement => ({
          id: movement.id,
          itemName: movement.branchInventory?.item.itemName || 'Unknown',
          itemCode: movement.branchInventory?.item.itemCode || 'N/A',
          movementType: movement.movementType,
          quantity: Number(movement.quantity),
          previousQty: Number(movement.previousQty),
          newQty: Number(movement.newQty),
          referenceId: movement.referenceId,
          user: movement.user?.name,
          date: movement.createdAt,
        })),
        purchaseOrders: purchaseOrders.map(po => ({
          status: po.status,
          count: po._count.status,
          totalAmount: po._sum.totalAmount || 0,
        })),
      };
    } catch (error) {
      Logger.error('Error fetching branch inventory report', { error, branchId });
      throw error;
    }
  }

  /**
   * Get Branch Operations Report - Services, staff performance
   */
  static async getBranchOperationsReport(
    branchId: string,
    companyId: string,
    startDate?: string,
    endDate?: string,
    period?: string
  ) {
    try {
      const { start, end } = this.getDateRange(startDate, endDate, period);

      // Service metrics
      const totalServices = await prisma.service.count({
        where: { branchId, createdAt: { gte: start, lte: end } },
      });

      const servicesByStatus = await prisma.service.groupBy({
        by: ['status'],
        where: { branchId, createdAt: { gte: start, lte: end } },
        _count: { status: true },
      });

      // Calculate completion rate
      const completedCount = servicesByStatus.find(s => s.status === 'COMPLETED')?._count.status || 0;
      const completionRate = totalServices > 0 ? ((completedCount / totalServices) * 100).toFixed(2) : 0;

      // Average resolution time for completed services
      const completedServices = await prisma.service.findMany({
        where: {
          branchId,
          status: 'COMPLETED',
          completedAt: { not: null },
          createdAt: { gte: start, lte: end },
        },
        select: {
          createdAt: true,
          completedAt: true,
        },
      });

      const avgResolutionTime = completedServices.length > 0
        ? completedServices.reduce((sum, service) => {
            const resolutionTime = service.completedAt!.getTime() - service.createdAt.getTime();
            return sum + resolutionTime;
          }, 0) / completedServices.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Staff performance
      const staffPerformance = await prisma.user.findMany({
        where: { branchId, isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: {
            select: {
              assignedServices: {
                where: {
                  createdAt: { gte: start, lte: end },
                },
              },
            },
          },
          assignedServices: {
            where: {
              status: 'COMPLETED',
              createdAt: { gte: start, lte: end },
            },
            select: { id: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      const staffMetrics = staffPerformance.map(staff => ({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        totalServicesHandled: staff._count.assignedServices,
        completedServices: staff.assignedServices.length,
        completionRate:
          staff._count.assignedServices > 0
            ? ((staff.assignedServices.length / staff._count.assignedServices) * 100).toFixed(2)
            : 0,
      }));

      // Service trend
      const serviceTrend = await this.getServiceTrendData(branchId, start, end);

      return {
        summary: {
          totalServices,
          completedServices: completedCount,
          completionRate,
          avgResolutionTimeHours: avgResolutionTime.toFixed(2),
          totalStaff: staffPerformance.length,
        },
        servicesByStatus: servicesByStatus.map(s => ({
          status: s.status,
          count: s._count.status,
          percentage: ((s._count.status / totalServices) * 100).toFixed(2),
        })),
        staffPerformance: staffMetrics,
        serviceTrend,
      };
    } catch (error) {
      Logger.error('Error fetching branch operations report', { error, branchId });
      throw error;
    }
  }

  /**
   * Get service trend data for a date range
   */
  private static async getServiceTrendData(branchId: string, start: Date, end: Date) {
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const trendData = [];

    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      const dailyServices = await prisma.service.count({
        where: {
          branchId,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      const dailyCompleted = await prisma.service.count({
        where: {
          branchId,
          status: 'COMPLETED',
          completedAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      trendData.push({
        date: startOfDay.toISOString().split('T')[0],
        total: dailyServices,
        completed: dailyCompleted,
      });
    }

    return trendData;
  }

  /**
   * Get Branch Customer Report - Customer analytics and growth
   */
  static async getBranchCustomerReport(
    branchId: string,
    companyId: string,
    startDate?: string,
    endDate?: string,
    period?: string
  ) {
    try {
      const { start, end } = this.getDateRange(startDate, endDate, period);

      // Total customers
      const totalCustomers = await prisma.customer.count({ where: { branchId } });

      // New customers in period
      const newCustomers = await prisma.customer.count({
        where: {
          branchId,
          createdAt: { gte: start, lte: end },
        },
      });

      // Customers with services
      const customersWithServices = await prisma.customer.count({
        where: {
          branchId,
          services: {
            some: {},
          },
        },
      });

      // Customer acquisition trend
      const customerTrend = await this.getCustomerTrendData(branchId, start, end);

      // Top customers by services
      const topCustomers = await prisma.customer.findMany({
        where: { branchId },
        include: {
          _count: {
            select: { services: true },
          },
          services: {
            where: {
              actualCost: { not: null },
            },
            select: {
              actualCost: true,
            },
          },
        },
        orderBy: {
          services: {
            _count: 'desc',
          },
        },
        take: 10,
      });

      const topCustomersData = topCustomers.map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalServices: customer._count.services,
        totalRevenue: customer.services.reduce((sum, s) => sum + (s.actualCost || 0), 0),
      }));

      // Service distribution - count customers by service count
      const customersWithServiceCounts = await prisma.customer.findMany({
        where: { branchId },
        select: {
          id: true,
          _count: {
            select: { services: true },
          },
        },
      });

      const customersWithNoServices = totalCustomers - customersWithServices;
      const customersWithOneService = customersWithServiceCounts.filter(c => c._count.services === 1).length;
      const customersWithMultipleServices = customersWithServiceCounts.filter(c => c._count.services > 1).length;

      return {
        summary: {
          totalCustomers,
          newCustomers,
          customersWithServices,
          customersWithNoServices,
          retentionRate:
            totalCustomers > 0 ? ((customersWithServices / totalCustomers) * 100).toFixed(2) : 0,
        },
        customerTrend,
        topCustomers: topCustomersData,
        serviceDistribution: {
          noServices: customersWithNoServices,
          oneService: customersWithOneService,
          multipleServices: customersWithMultipleServices,
        },
      };
    } catch (error) {
      Logger.error('Error fetching branch customer report', { error, branchId });
      throw error;
    }
  }

  /**
   * Get customer acquisition trend data for a date range
   */
  private static async getCustomerTrendData(branchId: string, start: Date, end: Date) {
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const trendData = [];

    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      const newCustomers = await prisma.customer.count({
        where: {
          branchId,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      trendData.push({
        date: startOfDay.toISOString().split('T')[0],
        newCustomers,
      });
    }

    return trendData;
  }
}
