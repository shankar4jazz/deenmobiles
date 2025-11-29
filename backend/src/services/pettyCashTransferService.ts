// Added getBranchTransferHistory method - force reload
import { PrismaClient, PettyCashTransferStatus, Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

interface TransferFilters {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  employeeId?: string;
  status?: PettyCashTransferStatus;
  startDate?: Date;
  endDate?: Date;
}

interface CreateTransferData {
  branchId: string;
  employeeId?: string;
  amount: number;
  transferDate?: Date;
  paymentMethodId?: string;
  transactionRef?: string;
  bankDetails?: string;
  purpose?: string;
  remarks?: string;
  proofUrl?: string;
  companyId: string;
  createdBy: string;
}

interface UpdateTransferData {
  amount?: number;
  transferDate?: Date;
  paymentMethodId?: string;
  transactionRef?: string;
  bankDetails?: string;
  purpose?: string;
  remarks?: string;
  proofUrl?: string;
  status?: PettyCashTransferStatus;
}

export class PettyCashTransferService {
  /**
   * Generate a unique transfer number
   */
  private static async generateTransferNumber(companyId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    // Get count of transfers for this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const count = await prisma.pettyCashTransfer.count({
      where: {
        companyId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `PCT-${year}${month}-${sequence}`;
  }

  /**
   * Get all petty cash transfers with pagination and filters
   */
  static async getAllTransfers(filters: TransferFilters) {
    const {
      page = 1,
      limit = 10,
      search,
      branchId,
      employeeId,
      status,
      startDate,
      endDate,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.PettyCashTransferWhereInput = {};

    // Search filter (transfer number, purpose, remarks)
    if (search) {
      where.OR = [
        { transferNumber: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
        { remarks: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Branch filter
    if (branchId) {
      where.branchId = branchId;
    }

    // Employee filter
    if (employeeId) {
      where.employeeId = employeeId;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      where.transferDate = {};
      if (startDate) {
        where.transferDate.gte = startDate;
      }
      if (endDate) {
        where.transferDate.lte = endDate;
      }
    }

    const [transfers, total] = await Promise.all([
      prisma.pettyCashTransfer.findMany({
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
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          paymentMethod: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.pettyCashTransfer.count({ where }),
    ]);

    return {
      data: transfers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get petty cash transfer by ID
   */
  static async getTransferById(id: string, companyId: string) {
    const transfer = await prisma.pettyCashTransfer.findFirst({
      where: { id, companyId },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        paymentMethod: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundError('Petty cash transfer not found');
    }

    return transfer;
  }

  /**
   * Create a new petty cash transfer
   */
  static async createTransfer(data: CreateTransferData) {
    const { branchId, employeeId, amount, companyId, createdBy } = data;

    // Validate amount
    if (amount <= 0) {
      throw new BadRequestError('Transfer amount must be greater than 0');
    }

    // Verify branch exists and belongs to company
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId },
    });

    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    // If employee is provided, verify employee exists and belongs to branch
    if (employeeId) {
      const employee = await prisma.user.findFirst({
        where: {
          id: employeeId,
          companyId,
          branchId,
        },
      });

      if (!employee) {
        throw new NotFoundError('Employee not found or does not belong to this branch');
      }
    }

    // If payment method is provided, verify it exists and is active
    if (data.paymentMethodId) {
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          id: data.paymentMethodId,
          companyId,
          isActive: true,
        },
      });

      if (!paymentMethod) {
        throw new NotFoundError('Payment method not found or inactive');
      }
    }

    // Generate transfer number
    const transferNumber = await this.generateTransferNumber(companyId);

    // Create transfer
    const transfer = await prisma.pettyCashTransfer.create({
      data: {
        transferNumber,
        branchId,
        employeeId,
        amount,
        transferDate: data.transferDate || new Date(),
        paymentMethodId: data.paymentMethodId,
        transactionRef: data.transactionRef,
        bankDetails: data.bankDetails,
        purpose: data.purpose,
        remarks: data.remarks,
        proofUrl: data.proofUrl,
        status: PettyCashTransferStatus.COMPLETED,
        companyId,
        createdBy,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        paymentMethod: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return transfer;
  }

  /**
   * Update petty cash transfer
   */
  static async updateTransfer(id: string, companyId: string, data: UpdateTransferData) {
    // Check if transfer exists
    const existingTransfer = await prisma.pettyCashTransfer.findFirst({
      where: { id, companyId },
    });

    if (!existingTransfer) {
      throw new NotFoundError('Petty cash transfer not found');
    }

    // If transfer is cancelled, don't allow updates
    if (existingTransfer.status === PettyCashTransferStatus.CANCELLED) {
      throw new BadRequestError('Cannot update a cancelled transfer');
    }

    // Validate amount if provided
    if (data.amount !== undefined && data.amount <= 0) {
      throw new BadRequestError('Transfer amount must be greater than 0');
    }

    // If payment method is provided, verify it exists and is active
    if (data.paymentMethodId) {
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          id: data.paymentMethodId,
          companyId,
          isActive: true,
        },
      });

      if (!paymentMethod) {
        throw new NotFoundError('Payment method not found or inactive');
      }
    }

    // Update transfer
    const transfer = await prisma.pettyCashTransfer.update({
      where: { id },
      data: {
        amount: data.amount,
        transferDate: data.transferDate,
        paymentMethodId: data.paymentMethodId,
        transactionRef: data.transactionRef,
        bankDetails: data.bankDetails,
        purpose: data.purpose,
        remarks: data.remarks,
        proofUrl: data.proofUrl,
        status: data.status,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        paymentMethod: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return transfer;
  }

  /**
   * Cancel petty cash transfer
   */
  static async cancelTransfer(id: string, companyId: string) {
    const transfer = await prisma.pettyCashTransfer.findFirst({
      where: { id, companyId },
    });

    if (!transfer) {
      throw new NotFoundError('Petty cash transfer not found');
    }

    if (transfer.status === PettyCashTransferStatus.CANCELLED) {
      throw new BadRequestError('Transfer is already cancelled');
    }

    const updatedTransfer = await prisma.pettyCashTransfer.update({
      where: { id },
      data: {
        status: PettyCashTransferStatus.CANCELLED,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedTransfer;
  }

  /**
   * Get branch petty cash balance
   */
  static async getBranchBalance(branchId: string, companyId: string) {
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
    const balance = received - spent;

    return {
      totalReceived: received,
      totalExpenses: spent,
      currentBalance: balance,
    };
  }

  /**
   * Get branch transfer history with pagination
   */
  static async getBranchTransferHistory(
    branchId: string,
    companyId: string,
    filters: {
      page: number;
      limit: number;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const where: Prisma.PettyCashTransferWhereInput = {
      branchId,
      companyId,
      status: PettyCashTransferStatus.COMPLETED,
    };

    if (filters.startDate || filters.endDate) {
      where.transferDate = {};
      if (filters.startDate) {
        where.transferDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.transferDate.lte = filters.endDate;
      }
    }

    const [transfers, total] = await Promise.all([
      prisma.pettyCashTransfer.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true, code: true } },
          employee: { select: { id: true, name: true, email: true } },
          paymentMethod: { select: { id: true, name: true, code: true } },
          createdByUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { transferDate: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.pettyCashTransfer.count({ where }),
    ]);

    return {
      data: transfers,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  /**
   * Get transfer statistics by branch
   */
  static async getTransferStats(companyId: string, branchId?: string) {
    const where: Prisma.PettyCashTransferWhereInput = { companyId };

    if (branchId) {
      where.branchId = branchId;
    }

    const [totalTransfers, completedTransfers, totalAmount] = await Promise.all([
      prisma.pettyCashTransfer.count({ where }),
      prisma.pettyCashTransfer.count({
        where: { ...where, status: PettyCashTransferStatus.COMPLETED },
      }),
      prisma.pettyCashTransfer.aggregate({
        where: { ...where, status: PettyCashTransferStatus.COMPLETED },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalTransfers,
      completedTransfers,
      totalAmount: Number(totalAmount._sum.amount || 0),
    };
  }
}
