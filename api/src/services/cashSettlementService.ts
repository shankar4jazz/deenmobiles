import { PrismaClient, CashSettlementStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface DenominationData {
  note2000Count: number;
  note500Count: number;
  note200Count: number;
  note100Count: number;
  note50Count: number;
  note20Count: number;
  note10Count: number;
  coin5Count: number;
  coin2Count: number;
  coin1Count: number;
}

interface SettlementFilters {
  companyId: string;
  branchId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: CashSettlementStatus;
  page?: number;
  limit?: number;
}

interface MethodTotals {
  paymentMethodId: string;
  paymentMethodName: string;
  openingBalance: number;
  collectedAmount: number;
  refundedAmount: number;
  expenseAmount: number;
  closingBalance: number;
  transactionCount: number;
}

export class CashSettlementService {
  /**
   * Get start of day
   */
  private getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get end of day
   */
  private getEndOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Generate settlement number (SET-BRANCHCODE-YYYYMMDD)
   */
  private async generateSettlementNumber(branchId: string, date: Date): Promise<string> {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });

    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    return `SET-${branch?.code || 'XX'}-${dateStr}`;
  }

  /**
   * Calculate denomination total
   */
  private calculateDenominationTotal(data: DenominationData): number {
    return (
      data.note2000Count * 2000 +
      data.note500Count * 500 +
      data.note200Count * 200 +
      data.note100Count * 100 +
      data.note50Count * 50 +
      data.note20Count * 20 +
      data.note10Count * 10 +
      data.coin5Count * 5 +
      data.coin2Count * 2 +
      data.coin1Count * 1
    );
  }

  /**
   * Calculate totals from PaymentEntry, Expense, and Service refunds for a date
   */
  async calculateTotals(companyId: string, branchId: string, date: Date): Promise<{
    methodTotals: MethodTotals[];
    totalCollected: number;
    totalRefunds: number;
    totalExpenses: number;
  }> {
    const startOfDay = this.getStartOfDay(date);
    const endOfDay = this.getEndOfDay(date);

    // Get all payment methods
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true },
    });

    // Get opening balances from DailyOpeningBalance
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

    // Get payments collected for the day (from services in this branch)
    const payments = await prisma.paymentEntry.findMany({
      where: {
        companyId,
        paymentDate: { gte: startOfDay, lte: endOfDay },
        service: { branchId },
      },
      include: {
        paymentMethod: { select: { id: true, name: true } },
      },
    });

    // Group payments by method
    const collectedByMethod = new Map<string, { amount: number; count: number }>();
    for (const payment of payments) {
      const methodId = payment.paymentMethodId;
      if (!collectedByMethod.has(methodId)) {
        collectedByMethod.set(methodId, { amount: 0, count: 0 });
      }
      const data = collectedByMethod.get(methodId)!;
      data.amount += payment.amount;
      data.count++;
    }

    // Get refunds for the day (from Service.refundAmount where refundedAt is today)
    const refundedServices = await prisma.service.findMany({
      where: {
        companyId,
        branchId,
        refundedAt: { gte: startOfDay, lte: endOfDay },
        refundAmount: { not: null },
      },
      select: {
        refundAmount: true,
        refundPaymentMethodId: true,
      },
    });

    const refundsByMethod = new Map<string, number>();
    for (const service of refundedServices) {
      if (service.refundPaymentMethodId && service.refundAmount) {
        const current = refundsByMethod.get(service.refundPaymentMethodId) || 0;
        refundsByMethod.set(service.refundPaymentMethodId, current + service.refundAmount);
      }
    }

    // Get expenses for the day
    const expenses = await prisma.expense.findMany({
      where: {
        companyId,
        branchId,
        expenseDate: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        paymentEntries: {
          include: {
            paymentMethod: { select: { id: true } },
          },
        },
      },
    });

    // Group expenses by payment method (from paymentEntries)
    const expensesByMethod = new Map<string, number>();
    for (const expense of expenses) {
      for (const entry of expense.paymentEntries) {
        const methodId = entry.paymentMethodId;
        const current = expensesByMethod.get(methodId) || 0;
        expensesByMethod.set(methodId, current + entry.amount);
      }
    }

    // Build method totals
    const methodTotals: MethodTotals[] = paymentMethods.map((pm) => {
      const opening = openingBalanceMap.get(pm.id) || 0;
      const collected = collectedByMethod.get(pm.id)?.amount || 0;
      const refunded = refundsByMethod.get(pm.id) || 0;
      const expense = expensesByMethod.get(pm.id) || 0;
      const closing = opening + collected - refunded - expense;
      const count = collectedByMethod.get(pm.id)?.count || 0;

      return {
        paymentMethodId: pm.id,
        paymentMethodName: pm.name,
        openingBalance: opening,
        collectedAmount: collected,
        refundedAmount: refunded,
        expenseAmount: expense,
        closingBalance: closing,
        transactionCount: count,
      };
    });

    const totalCollected = methodTotals.reduce((sum, m) => sum + m.collectedAmount, 0);
    const totalRefunds = methodTotals.reduce((sum, m) => sum + m.refundedAmount, 0);
    const totalExpenses = methodTotals.reduce((sum, m) => sum + m.expenseAmount, 0);

    return { methodTotals, totalCollected, totalRefunds, totalExpenses };
  }

  /**
   * Create or get existing settlement for a date
   */
  async createOrGetSettlement(
    companyId: string,
    branchId: string,
    date: Date,
    userId: string
  ) {
    const settlementDate = this.getStartOfDay(date);

    // Check if settlement already exists
    let settlement = await prisma.cashSettlement.findUnique({
      where: {
        settlementDate_branchId: {
          settlementDate,
          branchId,
        },
      },
      include: {
        methodBreakdowns: {
          include: {
            paymentMethod: { select: { id: true, name: true } },
          },
        },
        denominations: true,
        settledBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        rejectedBy: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    if (settlement) {
      // Recalculate totals if still pending
      if (settlement.status === CashSettlementStatus.PENDING || settlement.status === CashSettlementStatus.REJECTED) {
        const { methodTotals, totalCollected, totalRefunds, totalExpenses } = await this.calculateTotals(
          companyId,
          branchId,
          date
        );

        // Update method breakdowns
        await prisma.cashSettlementMethod.deleteMany({
          where: { cashSettlementId: settlement.id },
        });

        await prisma.cashSettlementMethod.createMany({
          data: methodTotals.map((m) => ({
            cashSettlementId: settlement!.id,
            paymentMethodId: m.paymentMethodId,
            openingBalance: m.openingBalance,
            collectedAmount: m.collectedAmount,
            refundedAmount: m.refundedAmount,
            expenseAmount: m.expenseAmount,
            closingBalance: m.closingBalance,
            transactionCount: m.transactionCount,
          })),
        });

        const netCashAmount = totalCollected - totalRefunds - totalExpenses;
        const physicalCashCount = settlement.denominations
          ? Number(settlement.denominations.totalAmount)
          : 0;

        settlement = await prisma.cashSettlement.update({
          where: { id: settlement.id },
          data: {
            totalCollected,
            totalRefunds,
            totalExpenses,
            netCashAmount,
            cashDifference: physicalCashCount - netCashAmount,
          },
          include: {
            methodBreakdowns: {
              include: {
                paymentMethod: { select: { id: true, name: true } },
              },
            },
            denominations: true,
            settledBy: { select: { id: true, name: true } },
            verifiedBy: { select: { id: true, name: true } },
            rejectedBy: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
          },
        });
      }

      return settlement;
    }

    // Create new settlement
    const settlementNumber = await this.generateSettlementNumber(branchId, date);
    const { methodTotals, totalCollected, totalRefunds, totalExpenses } = await this.calculateTotals(
      companyId,
      branchId,
      date
    );
    const netCashAmount = totalCollected - totalRefunds - totalExpenses;

    settlement = await prisma.cashSettlement.create({
      data: {
        settlementNumber,
        settlementDate,
        branchId,
        companyId,
        settledById: userId,
        totalCollected,
        totalRefunds,
        totalExpenses,
        netCashAmount,
        physicalCashCount: 0,
        cashDifference: -netCashAmount,
        methodBreakdowns: {
          create: methodTotals.map((m) => ({
            paymentMethodId: m.paymentMethodId,
            openingBalance: m.openingBalance,
            collectedAmount: m.collectedAmount,
            refundedAmount: m.refundedAmount,
            expenseAmount: m.expenseAmount,
            closingBalance: m.closingBalance,
            transactionCount: m.transactionCount,
          })),
        },
      },
      include: {
        methodBreakdowns: {
          include: {
            paymentMethod: { select: { id: true, name: true } },
          },
        },
        denominations: true,
        settledBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        rejectedBy: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return settlement;
  }

  /**
   * Get settlement by ID
   */
  async getSettlementById(id: string, companyId: string) {
    return prisma.cashSettlement.findFirst({
      where: { id, companyId },
      include: {
        methodBreakdowns: {
          include: {
            paymentMethod: { select: { id: true, name: true } },
          },
        },
        denominations: true,
        settledBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        rejectedBy: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Get settlements list with filters
   */
  async getSettlements(filters: SettlementFilters) {
    const { companyId, branchId, startDate, endDate, status, page = 1, limit = 20 } = filters;

    const where: Prisma.CashSettlementWhereInput = { companyId };

    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.settlementDate = {};
      if (startDate) where.settlementDate.gte = this.getStartOfDay(startDate);
      if (endDate) where.settlementDate.lte = this.getEndOfDay(endDate);
    }

    const [settlements, total] = await Promise.all([
      prisma.cashSettlement.findMany({
        where,
        include: {
          settledBy: { select: { id: true, name: true } },
          verifiedBy: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: { settlementDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cashSettlement.count({ where }),
    ]);

    return {
      settlements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update denominations
   */
  async updateDenominations(settlementId: string, companyId: string, data: DenominationData) {
    const settlement = await prisma.cashSettlement.findFirst({
      where: { id: settlementId, companyId },
    });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    if (settlement.status !== CashSettlementStatus.PENDING && settlement.status !== CashSettlementStatus.REJECTED) {
      throw new Error('Cannot update denominations for submitted/verified settlement');
    }

    const totalAmount = this.calculateDenominationTotal(data);
    const cashDifference = totalAmount - Number(settlement.netCashAmount);

    // Upsert denomination
    await prisma.cashDenomination.upsert({
      where: { cashSettlementId: settlementId },
      update: {
        ...data,
        totalAmount,
      },
      create: {
        cashSettlementId: settlementId,
        ...data,
        totalAmount,
      },
    });

    // Update settlement with physical count and difference
    return prisma.cashSettlement.update({
      where: { id: settlementId },
      data: {
        physicalCashCount: totalAmount,
        cashDifference,
      },
      include: {
        methodBreakdowns: {
          include: {
            paymentMethod: { select: { id: true, name: true } },
          },
        },
        denominations: true,
        settledBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        rejectedBy: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Submit settlement for verification
   */
  async submitSettlement(settlementId: string, companyId: string, userId: string) {
    const settlement = await prisma.cashSettlement.findFirst({
      where: { id: settlementId, companyId },
    });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    if (settlement.status !== CashSettlementStatus.PENDING && settlement.status !== CashSettlementStatus.REJECTED) {
      throw new Error('Settlement already submitted or verified');
    }

    return prisma.cashSettlement.update({
      where: { id: settlementId },
      data: {
        status: CashSettlementStatus.SUBMITTED,
        settledAt: new Date(),
      },
      include: {
        methodBreakdowns: {
          include: {
            paymentMethod: { select: { id: true, name: true } },
          },
        },
        denominations: true,
        settledBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        rejectedBy: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Verify settlement (Manager/Admin action)
   */
  async verifySettlement(settlementId: string, companyId: string, verifiedById: string, notes?: string) {
    const settlement = await prisma.cashSettlement.findFirst({
      where: { id: settlementId, companyId },
    });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    if (settlement.status !== CashSettlementStatus.SUBMITTED) {
      throw new Error('Settlement must be submitted before verification');
    }

    return prisma.cashSettlement.update({
      where: { id: settlementId },
      data: {
        status: CashSettlementStatus.VERIFIED,
        verifiedById,
        verifiedAt: new Date(),
        verificationNotes: notes,
      },
      include: {
        methodBreakdowns: {
          include: {
            paymentMethod: { select: { id: true, name: true } },
          },
        },
        denominations: true,
        settledBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        rejectedBy: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Reject settlement (Manager/Admin action)
   */
  async rejectSettlement(settlementId: string, companyId: string, rejectedById: string, reason: string) {
    const settlement = await prisma.cashSettlement.findFirst({
      where: { id: settlementId, companyId },
    });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    if (settlement.status !== CashSettlementStatus.SUBMITTED) {
      throw new Error('Settlement must be submitted before rejection');
    }

    return prisma.cashSettlement.update({
      where: { id: settlementId },
      data: {
        status: CashSettlementStatus.REJECTED,
        rejectedById,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        methodBreakdowns: {
          include: {
            paymentMethod: { select: { id: true, name: true } },
          },
        },
        denominations: true,
        settledBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        rejectedBy: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Update settlement notes
   */
  async updateNotes(settlementId: string, companyId: string, notes: string) {
    const settlement = await prisma.cashSettlement.findFirst({
      where: { id: settlementId, companyId },
    });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    if (settlement.status !== CashSettlementStatus.PENDING && settlement.status !== CashSettlementStatus.REJECTED) {
      throw new Error('Cannot update notes for submitted/verified settlement');
    }

    return prisma.cashSettlement.update({
      where: { id: settlementId },
      data: { notes },
      include: {
        methodBreakdowns: {
          include: {
            paymentMethod: { select: { id: true, name: true } },
          },
        },
        denominations: true,
        settledBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        rejectedBy: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }
}

export default new CashSettlementService();
