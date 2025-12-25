import { PrismaClient, ServiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

interface ReportFilters {
  companyId: string;
  branchId?: string;
  startDate: Date;
  endDate: Date;
}

interface BookingPersonSummary {
  userId: string;
  userName: string;
  serviceCount: number;
  totalRevenue: number;
  avgPerService: number;
}

interface TechnicianSummary {
  technicianId: string;
  technicianName: string;
  completedCount: number;
  pendingCount: number;
  totalRevenue: number;
  avgCompletionTimeHours: number | null;
}

interface BrandSummary {
  brandId: string;
  brandName: string;
  serviceCount: number;
  totalRevenue: number;
}

interface FaultSummary {
  faultId: string;
  faultName: string;
  serviceCount: number;
  totalRevenue: number;
}

interface TransactionDetail {
  id: string;
  amount: number;
  paymentMethodId: string;
  paymentMethodName: string;
  paymentDate: Date;
  notes: string | null;
  transactionId: string | null;
  serviceId: string | null;
  ticketNumber: string | null;
  customerName: string | null;
}

interface DailyTransactionReport {
  date: string;
  totalAmount: number;
  paymentCount: number;
  byMethod: { methodId: string; methodName: string; amount: number; count: number }[];
  transactions: TransactionDetail[];
}

interface CashSettlementMethod {
  paymentMethodId: string;
  paymentMethodName: string;
  openingBalance: number;
  receivedAmount: number;
  closingBalance: number;
}

interface DailyCashSettlementReport {
  date: string;
  branchId: string;
  branchName: string;
  byMethod: CashSettlementMethod[];
  transactions: TransactionDetail[];
}

export class ReportService {
  /**
   * Helper to get start of day
   */
  private getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Helper to get end of day
   */
  private getEndOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * 1. Booking Person Wise Report
   * Services created by each receptionist/user with revenue breakdown
   */
  async getBookingPersonReport(filters: ReportFilters) {
    const { companyId, branchId, startDate, endDate } = filters;

    const where: any = {
      companyId,
      createdAt: {
        gte: this.getStartOfDay(startDate),
        lte: this.getEndOfDay(endDate),
      },
      createdById: { not: null },
    };

    if (branchId) where.branchId = branchId;

    const services = await prisma.service.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        customerDevice: {
          include: {
            brand: { select: { name: true } },
            model: { select: { name: true } },
          },
        },
      },
    });

    // Group by booking person
    const userMap = new Map<string, {
      userName: string;
      services: typeof services;
      totalRevenue: number;
    }>();

    for (const service of services) {
      if (!service.createdBy) continue;

      const userId = service.createdById!;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userName: service.createdBy.name,
          services: [],
          totalRevenue: 0,
        });
      }

      const user = userMap.get(userId)!;
      user.services.push(service);

      const revenue = Number(service.actualCost || service.estimatedCost || 0);
      user.totalRevenue += revenue;
    }

    // Build summary
    const summary: BookingPersonSummary[] = [];
    for (const [userId, data] of userMap) {
      summary.push({
        userId,
        userName: data.userName,
        serviceCount: data.services.length,
        totalRevenue: data.totalRevenue,
        avgPerService: data.services.length > 0 ? data.totalRevenue / data.services.length : 0,
      });
    }

    // Build details
    const details = services.map((s) => ({
      id: s.id,
      ticketNumber: s.ticketNumber,
      customerName: s.customer.name,
      customerPhone: s.customer.phone,
      deviceModel: s.customerDevice
        ? `${s.customerDevice.brand?.name || ''} ${s.customerDevice.model?.name || ''}`
        : s.deviceModel,
      status: s.status,
      estimatedCost: s.estimatedCost,
      actualCost: s.actualCost,
      createdAt: s.createdAt,
      createdById: s.createdById,
      createdByName: s.createdBy?.name,
    }));

    return {
      summary: summary.sort((a, b) => b.totalRevenue - a.totalRevenue),
      details,
      totals: {
        totalServices: services.length,
        totalRevenue: summary.reduce((sum, s) => sum + s.totalRevenue, 0),
      },
    };
  }

  /**
   * 2. Technician Wise Report
   * Performance of each technician with completion metrics
   */
  async getTechnicianReport(filters: ReportFilters) {
    const { companyId, branchId, startDate, endDate } = filters;

    const where: any = {
      companyId,
      createdAt: {
        gte: this.getStartOfDay(startDate),
        lte: this.getEndOfDay(endDate),
      },
      assignedToId: { not: null },
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
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        customerDevice: {
          include: {
            brand: { select: { name: true } },
            model: { select: { name: true } },
          },
        },
      },
    });

    // Group by technician
    const techMap = new Map<string, {
      technicianName: string;
      services: typeof services;
      completedServices: typeof services;
      pendingServices: typeof services;
      totalRevenue: number;
      totalCompletionTimeMs: number;
    }>();

    const completedStatuses: ServiceStatus[] = [ServiceStatus.COMPLETED, ServiceStatus.DELIVERED];

    for (const service of services) {
      if (!service.assignedTo) continue;

      const techId = service.assignedToId!;
      if (!techMap.has(techId)) {
        techMap.set(techId, {
          technicianName: service.assignedTo.name,
          services: [],
          completedServices: [],
          pendingServices: [],
          totalRevenue: 0,
          totalCompletionTimeMs: 0,
        });
      }

      const tech = techMap.get(techId)!;
      tech.services.push(service);

      if (completedStatuses.includes(service.status)) {
        tech.completedServices.push(service);
        const revenue = Number(service.actualCost || service.estimatedCost || 0);
        tech.totalRevenue += revenue;

        if (service.completedAt) {
          const completionTime = service.completedAt.getTime() - service.createdAt.getTime();
          tech.totalCompletionTimeMs += completionTime;
        }
      } else if (service.status !== ServiceStatus.CANCELLED && service.status !== ServiceStatus.NOT_SERVICEABLE) {
        tech.pendingServices.push(service);
      }
    }

    // Build summary
    const summary: TechnicianSummary[] = [];
    for (const [techId, data] of techMap) {
      const avgCompletionTimeMs = data.completedServices.length > 0
        ? data.totalCompletionTimeMs / data.completedServices.length
        : null;

      summary.push({
        technicianId: techId,
        technicianName: data.technicianName,
        completedCount: data.completedServices.length,
        pendingCount: data.pendingServices.length,
        totalRevenue: data.totalRevenue,
        avgCompletionTimeHours: avgCompletionTimeMs !== null ? avgCompletionTimeMs / (1000 * 60 * 60) : null,
      });
    }

    // Build details
    const details = services.map((s) => ({
      id: s.id,
      ticketNumber: s.ticketNumber,
      customerName: s.customer.name,
      customerPhone: s.customer.phone,
      deviceModel: s.customerDevice
        ? `${s.customerDevice.brand?.name || ''} ${s.customerDevice.model?.name || ''}`
        : s.deviceModel,
      status: s.status,
      estimatedCost: s.estimatedCost,
      actualCost: s.actualCost,
      createdAt: s.createdAt,
      completedAt: s.completedAt,
      assignedToId: s.assignedToId,
      assignedToName: s.assignedTo?.name,
    }));

    return {
      summary: summary.sort((a, b) => b.totalRevenue - a.totalRevenue),
      details,
      totals: {
        totalServices: services.length,
        totalCompleted: summary.reduce((sum, s) => sum + s.completedCount, 0),
        totalPending: summary.reduce((sum, s) => sum + s.pendingCount, 0),
        totalRevenue: summary.reduce((sum, s) => sum + s.totalRevenue, 0),
        uniqueTechnicians: summary.length,
      },
    };
  }

  /**
   * 3. Brand Wise Report
   * Services grouped by device brand
   */
  async getBrandReport(filters: ReportFilters) {
    const { companyId, branchId, startDate, endDate } = filters;

    const where: any = {
      companyId,
      createdAt: {
        gte: this.getStartOfDay(startDate),
        lte: this.getEndOfDay(endDate),
      },
      customerDeviceId: { not: null },
    };

    if (branchId) where.branchId = branchId;

    const services = await prisma.service.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        customerDevice: {
          include: {
            brand: { select: { id: true, name: true } },
            model: { select: { name: true } },
          },
        },
        assignedTo: {
          select: { name: true },
        },
      },
    });

    // Group by brand
    const brandMap = new Map<string, {
      brandName: string;
      services: typeof services;
      totalRevenue: number;
    }>();

    for (const service of services) {
      if (!service.customerDevice?.brand) continue;

      const brandId = service.customerDevice.brand.id;
      const brandName = service.customerDevice.brand.name;

      if (!brandMap.has(brandId)) {
        brandMap.set(brandId, {
          brandName,
          services: [],
          totalRevenue: 0,
        });
      }

      const brand = brandMap.get(brandId)!;
      brand.services.push(service);

      const revenue = Number(service.actualCost || service.estimatedCost || 0);
      brand.totalRevenue += revenue;
    }

    // Build summary
    const summary: BrandSummary[] = [];
    for (const [brandId, data] of brandMap) {
      summary.push({
        brandId,
        brandName: data.brandName,
        serviceCount: data.services.length,
        totalRevenue: data.totalRevenue,
      });
    }

    // Build details
    const details = services.map((s) => ({
      id: s.id,
      ticketNumber: s.ticketNumber,
      customerName: s.customer.name,
      customerPhone: s.customer.phone,
      brandId: s.customerDevice?.brand?.id,
      brandName: s.customerDevice?.brand?.name,
      modelName: s.customerDevice?.model?.name,
      status: s.status,
      estimatedCost: s.estimatedCost,
      actualCost: s.actualCost,
      createdAt: s.createdAt,
      assignedToName: s.assignedTo?.name,
    }));

    return {
      summary: summary.sort((a, b) => b.serviceCount - a.serviceCount),
      details,
      totals: {
        totalServices: services.length,
        totalRevenue: summary.reduce((sum, s) => sum + s.totalRevenue, 0),
        uniqueBrands: summary.length,
      },
    };
  }

  /**
   * 4. Fault Wise Report
   * Services grouped by fault type
   */
  async getFaultReport(filters: ReportFilters) {
    const { companyId, branchId, startDate, endDate } = filters;

    const where: any = {
      companyId,
      createdAt: {
        gte: this.getStartOfDay(startDate),
        lte: this.getEndOfDay(endDate),
      },
    };

    if (branchId) where.branchId = branchId;

    const services = await prisma.service.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        customerDevice: {
          include: {
            brand: { select: { name: true } },
            model: { select: { name: true } },
          },
        },
        faults: {
          include: {
            fault: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignedTo: {
          select: { name: true },
        },
      },
    });

    // Group by fault
    const faultMap = new Map<string, {
      faultName: string;
      services: typeof services;
      totalRevenue: number;
    }>();

    for (const service of services) {
      const revenue = Number(service.actualCost || service.estimatedCost || 0);

      for (const faultOnService of service.faults) {
        const faultId = faultOnService.fault.id;
        const faultName = faultOnService.fault.name;

        if (!faultMap.has(faultId)) {
          faultMap.set(faultId, {
            faultName,
            services: [],
            totalRevenue: 0,
          });
        }

        const fault = faultMap.get(faultId)!;
        fault.services.push(service);
        fault.totalRevenue += revenue;
      }
    }

    // Build summary
    const summary: FaultSummary[] = [];
    for (const [faultId, data] of faultMap) {
      summary.push({
        faultId,
        faultName: data.faultName,
        serviceCount: data.services.length,
        totalRevenue: data.totalRevenue,
      });
    }

    // Build details
    const details = services.map((s) => ({
      id: s.id,
      ticketNumber: s.ticketNumber,
      customerName: s.customer.name,
      customerPhone: s.customer.phone,
      deviceModel: s.customerDevice
        ? `${s.customerDevice.brand?.name || ''} ${s.customerDevice.model?.name || ''}`
        : s.deviceModel,
      faults: s.faults.map((f) => ({ id: f.fault.id, name: f.fault.name })),
      status: s.status,
      estimatedCost: s.estimatedCost,
      actualCost: s.actualCost,
      createdAt: s.createdAt,
      assignedToName: s.assignedTo?.name,
    }));

    return {
      summary: summary.sort((a, b) => b.serviceCount - a.serviceCount),
      details,
      totals: {
        totalServices: services.length,
        totalRevenue: summary.reduce((sum, s) => sum + s.totalRevenue, 0),
        uniqueFaults: summary.length,
      },
    };
  }

  /**
   * 5. Daily Transaction Report
   * All payments for a specific date
   */
  async getDailyTransactionReport(companyId: string, branchId: string | undefined, date: Date): Promise<DailyTransactionReport> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      companyId,
      paymentDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    // Filter by branch using service relation
    const payments = await prisma.paymentEntry.findMany({
      where,
      include: {
        paymentMethod: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            ticketNumber: true,
            branchId: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        paymentDate: 'asc',
      },
    });

    // Filter by branch if specified
    const filteredPayments = branchId
      ? payments.filter((p) => p.service?.branchId === branchId)
      : payments;

    // Group by payment method
    const methodMap = new Map<string, { methodName: string; amount: number; count: number }>();

    for (const payment of filteredPayments) {
      const methodId = payment.paymentMethodId;
      const methodName = payment.paymentMethod.name;

      if (!methodMap.has(methodId)) {
        methodMap.set(methodId, { methodName, amount: 0, count: 0 });
      }

      const method = methodMap.get(methodId)!;
      method.amount += payment.amount;
      method.count++;
    }

    const byMethod = Array.from(methodMap.entries()).map(([methodId, data]) => ({
      methodId,
      methodName: data.methodName,
      amount: data.amount,
      count: data.count,
    }));

    const transactions: TransactionDetail[] = filteredPayments.map((p) => ({
      id: p.id,
      amount: p.amount,
      paymentMethodId: p.paymentMethodId,
      paymentMethodName: p.paymentMethod.name,
      paymentDate: p.paymentDate,
      notes: p.notes,
      transactionId: p.transactionId,
      serviceId: p.serviceId,
      ticketNumber: p.service?.ticketNumber || null,
      customerName: p.service?.customer?.name || null,
    }));

    return {
      date: date.toISOString().split('T')[0],
      totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
      paymentCount: filteredPayments.length,
      byMethod,
      transactions,
    };
  }

  /**
   * 6. Daily Cash Settlement Report
   * Opening balance, transactions, closing balance per payment method
   */
  async getDailyCashSettlement(companyId: string, branchId: string, date: Date): Promise<DailyCashSettlementReport> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get branch info
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true },
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    // Get all active payment methods for the company
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        companyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Get opening balances for the date
    const openingBalances = await prisma.dailyOpeningBalance.findMany({
      where: {
        companyId,
        branchId,
        date: startOfDay,
      },
    });

    const openingBalanceMap = new Map<string, number>();
    for (const ob of openingBalances) {
      openingBalanceMap.set(ob.paymentMethodId, Number(ob.openingAmount));
    }

    // Get payments for the day
    const payments = await prisma.paymentEntry.findMany({
      where: {
        companyId,
        paymentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        service: {
          branchId,
        },
      },
      include: {
        paymentMethod: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            ticketNumber: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        paymentDate: 'asc',
      },
    });

    // Calculate received amount per payment method
    const receivedMap = new Map<string, number>();
    for (const payment of payments) {
      const methodId = payment.paymentMethodId;
      const current = receivedMap.get(methodId) || 0;
      receivedMap.set(methodId, current + payment.amount);
    }

    // Build by method summary
    const byMethod: CashSettlementMethod[] = paymentMethods.map((pm) => {
      const opening = openingBalanceMap.get(pm.id) || 0;
      const received = receivedMap.get(pm.id) || 0;
      const closing = opening + received;

      return {
        paymentMethodId: pm.id,
        paymentMethodName: pm.name,
        openingBalance: opening,
        receivedAmount: received,
        closingBalance: closing,
      };
    });

    const transactions: TransactionDetail[] = payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      paymentMethodId: p.paymentMethodId,
      paymentMethodName: p.paymentMethod.name,
      paymentDate: p.paymentDate,
      notes: p.notes,
      transactionId: p.transactionId,
      serviceId: p.serviceId,
      ticketNumber: p.service?.ticketNumber || null,
      customerName: p.service?.customer?.name || null,
    }));

    return {
      date: date.toISOString().split('T')[0],
      branchId,
      branchName: branch.name,
      byMethod,
      transactions,
    };
  }

  /**
   * Set opening balance for a payment method on a date
   */
  async setOpeningBalance(
    companyId: string,
    branchId: string,
    date: Date,
    paymentMethodId: string,
    openingAmount: number
  ) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    return prisma.dailyOpeningBalance.upsert({
      where: {
        date_paymentMethodId_branchId: {
          date: dateOnly,
          paymentMethodId,
          branchId,
        },
      },
      update: {
        openingAmount,
      },
      create: {
        date: dateOnly,
        paymentMethodId,
        branchId,
        companyId,
        openingAmount,
        closingAmount: 0,
      },
    });
  }

  /**
   * Set closing balance and auto-create next day's opening balance
   */
  async setClosingBalanceAndCarryForward(
    companyId: string,
    branchId: string,
    date: Date,
    paymentMethodId: string,
    closingAmount: number
  ) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    // Update closing balance for today
    await prisma.dailyOpeningBalance.upsert({
      where: {
        date_paymentMethodId_branchId: {
          date: dateOnly,
          paymentMethodId,
          branchId,
        },
      },
      update: {
        closingAmount,
      },
      create: {
        date: dateOnly,
        paymentMethodId,
        branchId,
        companyId,
        openingAmount: 0,
        closingAmount,
      },
    });

    // Create next day's opening balance
    const nextDay = new Date(dateOnly);
    nextDay.setDate(nextDay.getDate() + 1);

    return prisma.dailyOpeningBalance.upsert({
      where: {
        date_paymentMethodId_branchId: {
          date: nextDay,
          paymentMethodId,
          branchId,
        },
      },
      update: {
        openingAmount: closingAmount,
      },
      create: {
        date: nextDay,
        paymentMethodId,
        branchId,
        companyId,
        openingAmount: closingAmount,
        closingAmount: 0,
      },
    });
  }
}

export default new ReportService();
