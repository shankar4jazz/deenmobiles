import { PrismaClient, PettyCashTransferStatus, Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

interface ExpenseFilters {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  categoryId?: string;
  recordedBy?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

interface CreateExpenseData {
  branchId: string;
  categoryId: string;
  amount: number;
  expenseDate?: Date;
  description: string;
  billNumber?: string;
  vendorName?: string;
  attachmentUrl?: string;
  remarks?: string;
  companyId: string;
  recordedBy: string;
}

interface UpdateExpenseData {
  categoryId?: string;
  amount?: number;
  expenseDate?: Date;
  description?: string;
  billNumber?: string;
  vendorName?: string;
  attachmentUrl?: string;
  remarks?: string;
}

export class ExpenseService {
  /**
   * Generate a unique expense number
   */
  private static async generateExpenseNumber(companyId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    // Get count of expenses for this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const count = await prisma.expense.count({
      where: {
        companyId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `EXP-${year}${month}-${sequence}`;
  }

  /**
   * Get branch petty cash balance
   */
  private static async getBranchBalance(branchId: string, companyId: string): Promise<number> {
    // Get total received (completed transfers)
    const totalReceived = await prisma.pettyCashTransfer.aggregate({
      where: {
        branchId,
        companyId,
        status: PettyCashTransferStatus.COMPLETED,
      },
      _sum: {
        amount: true,
      },
    });

    // Get total expenses
    const totalExpenses = await prisma.expense.aggregate({
      where: {
        branchId,
        companyId,
      },
      _sum: {
        amount: true,
      },
    });

    const received = Number(totalReceived._sum.amount || 0);
    const spent = Number(totalExpenses._sum.amount || 0);

    return received - spent;
  }

  /**
   * Get all expenses with pagination and filters
   */
  static async getAllExpenses(filters: ExpenseFilters) {
    const {
      page = 1,
      limit = 10,
      search,
      branchId,
      categoryId,
      recordedBy,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = {};

    // Search filter (expense number, description, vendor name, bill number)
    if (search) {
      where.OR = [
        { expenseNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { vendorName: { contains: search, mode: 'insensitive' } },
        { billNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Branch filter
    if (branchId) {
      where.branchId = branchId;
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Recorded by filter
    if (recordedBy) {
      where.recordedBy = recordedBy;
    }

    // Date range filter
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate.gte = startDate;
      }
      if (endDate) {
        where.expenseDate.lte = endDate;
      }
    }

    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) {
        where.amount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.amount.lte = maxAmount;
      }
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          recordedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get expense by ID
   */
  static async getExpenseById(id: string, companyId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id, companyId },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        recordedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    return expense;
  }

  /**
   * Create a new expense with balance validation
   */
  static async createExpense(data: CreateExpenseData) {
    const { branchId, categoryId, amount, companyId, recordedBy } = data;

    // Validate amount
    if (amount <= 0) {
      throw new BadRequestError('Expense amount must be greater than 0');
    }

    // Verify branch exists and belongs to company
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId },
    });

    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    // Verify category exists and is active
    const category = await prisma.expenseCategory.findFirst({
      where: {
        id: categoryId,
        companyId,
        isActive: true,
      },
    });

    if (!category) {
      throw new NotFoundError('Expense category not found or inactive');
    }

    // **CRITICAL: Validate branch has sufficient balance**
    const currentBalance = await this.getBranchBalance(branchId, companyId);

    if (currentBalance < amount) {
      throw new BadRequestError(
        `Insufficient petty cash balance. Available: ₹${currentBalance.toFixed(2)}, Required: ₹${amount.toFixed(2)}`
      );
    }

    // Generate expense number
    const expenseNumber = await this.generateExpenseNumber(companyId);

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        branchId,
        categoryId,
        amount,
        expenseDate: data.expenseDate || new Date(),
        description: data.description,
        billNumber: data.billNumber,
        vendorName: data.vendorName,
        attachmentUrl: data.attachmentUrl,
        remarks: data.remarks,
        companyId,
        recordedBy,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        recordedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return expense;
  }

  /**
   * Update expense
   */
  static async updateExpense(id: string, companyId: string, data: UpdateExpenseData) {
    // Check if expense exists
    const existingExpense = await prisma.expense.findFirst({
      where: { id, companyId },
    });

    if (!existingExpense) {
      throw new NotFoundError('Expense not found');
    }

    // Validate amount if provided
    if (data.amount !== undefined && data.amount <= 0) {
      throw new BadRequestError('Expense amount must be greater than 0');
    }

    // If category is being updated, verify it exists and is active
    if (data.categoryId) {
      const category = await prisma.expenseCategory.findFirst({
        where: {
          id: data.categoryId,
          companyId,
          isActive: true,
        },
      });

      if (!category) {
        throw new NotFoundError('Expense category not found or inactive');
      }
    }

    // If amount is being updated, validate balance
    if (data.amount !== undefined && data.amount !== Number(existingExpense.amount)) {
      const amountDifference = data.amount - Number(existingExpense.amount);

      // Only check if increasing the amount
      if (amountDifference > 0) {
        const currentBalance = await this.getBranchBalance(
          existingExpense.branchId,
          companyId
        );

        if (currentBalance < amountDifference) {
          throw new BadRequestError(
            `Insufficient petty cash balance. Available: ₹${currentBalance.toFixed(2)}, Additional required: ₹${amountDifference.toFixed(2)}`
          );
        }
      }
    }

    // Update expense
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        amount: data.amount,
        expenseDate: data.expenseDate,
        description: data.description,
        billNumber: data.billNumber,
        vendorName: data.vendorName,
        attachmentUrl: data.attachmentUrl,
        remarks: data.remarks,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        recordedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return expense;
  }

  /**
   * Delete expense (hard delete, since it affects balance)
   */
  static async deleteExpense(id: string, companyId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id, companyId },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    await prisma.expense.delete({
      where: { id },
    });

    return { message: 'Expense deleted successfully' };
  }

  /**
   * Get expense statistics
   */
  static async getExpenseStats(companyId: string, branchId?: string, categoryId?: string) {
    const where: Prisma.ExpenseWhereInput = { companyId };

    if (branchId) {
      where.branchId = branchId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [totalExpenses, totalAmount, categoryBreakdown] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Get category names for breakdown
    const categories = await prisma.expenseCategory.findMany({
      where: {
        id: { in: categoryBreakdown.map((item) => item.categoryId) },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]));

    const breakdownWithNames = categoryBreakdown.map((item) => ({
      categoryId: item.categoryId,
      categoryName: categoryMap.get(item.categoryId) || 'Unknown',
      totalAmount: Number(item._sum.amount || 0),
      count: item._count,
    }));

    return {
      totalExpenses,
      totalAmount: Number(totalAmount._sum.amount || 0),
      categoryBreakdown: breakdownWithNames,
    };
  }

  /**
   * Get branch expense dashboard data
   */
  static async getBranchDashboard(branchId: string, companyId: string) {
    // Get balance
    const totalReceived = await prisma.pettyCashTransfer.aggregate({
      where: {
        branchId,
        companyId,
        status: PettyCashTransferStatus.COMPLETED,
      },
      _sum: { amount: true },
    });

    const totalExpenses = await prisma.expense.aggregate({
      where: { branchId, companyId },
      _sum: { amount: true },
    });

    const received = Number(totalReceived._sum.amount || 0);
    const spent = Number(totalExpenses._sum.amount || 0);
    const balance = received - spent;

    // Get category-wise expenses for current month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const monthlyExpenses = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        branchId,
        companyId,
        expenseDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get category names
    const categories = await prisma.expenseCategory.findMany({
      where: {
        id: { in: monthlyExpenses.map((item) => item.categoryId) },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]));

    const categoryWiseSpending = monthlyExpenses.map((item) => ({
      categoryId: item.categoryId,
      categoryName: categoryMap.get(item.categoryId) || 'Unknown',
      totalAmount: Number(item._sum.amount || 0),
      count: item._count,
    }));

    // Get recent expenses
    const recentExpenses = await prisma.expense.findMany({
      where: { branchId, companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      balance: {
        totalReceived: received,
        totalExpenses: spent,
        currentBalance: balance,
      },
      monthlyStats: {
        categoryWiseSpending,
        totalMonthlyExpenses: monthlyExpenses.reduce(
          (sum, item) => sum + Number(item._sum.amount || 0),
          0
        ),
      },
      recentExpenses,
    };
  }
}
