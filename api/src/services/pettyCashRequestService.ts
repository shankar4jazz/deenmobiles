import { PrismaClient, PettyCashRequestStatus, PettyCashTransferStatus, Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

interface RequestFilters {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  requestedBy?: string;
  status?: PettyCashRequestStatus;
  startDate?: Date;
  endDate?: Date;
}

interface CreateRequestData {
  branchId: string;
  requestedAmount: number;
  reason: string;
  companyId: string;
  requestedBy: string;
}

interface UpdateRequestData {
  requestedAmount?: number;
  reason?: string;
}

interface ApproveRequestData {
  approvedBy: string;
  paymentMethodId?: string;
  transactionRef?: string;
  bankDetails?: string;
  purpose?: string;
  remarks?: string;
  proofUrl?: string;
}

interface RejectRequestData {
  approvedBy: string;
  rejectedReason: string;
}

export class PettyCashRequestService {
  /**
   * Generate a unique request number
   */
  private static async generateRequestNumber(companyId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    // Get count of requests for this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const count = await prisma.pettyCashRequest.count({
      where: {
        companyId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `PCR-${year}${month}-${sequence}`;
  }

  /**
   * Generate transfer number for approved request
   */
  private static async generateTransferNumber(companyId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');

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
   * Get all petty cash requests with pagination and filters
   */
  static async getAllRequests(filters: RequestFilters) {
    const {
      page = 1,
      limit = 10,
      search,
      branchId,
      requestedBy,
      status,
      startDate,
      endDate,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.PettyCashRequestWhereInput = {};

    // Search filter (request number, reason)
    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { rejectedReason: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Branch filter
    if (branchId) {
      where.branchId = branchId;
    }

    // Requested by filter
    if (requestedBy) {
      where.requestedBy = requestedBy;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [requests, total] = await Promise.all([
      prisma.pettyCashRequest.findMany({
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
          requestedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.pettyCashRequest.count({ where }),
    ]);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get petty cash request by ID
   */
  static async getRequestById(id: string, companyId: string) {
    const request = await prisma.pettyCashRequest.findFirst({
      where: { id, companyId },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundError('Petty cash request not found');
    }

    return request;
  }

  /**
   * Create a new petty cash request
   */
  static async createRequest(data: CreateRequestData) {
    const { branchId, requestedAmount, reason, companyId, requestedBy } = data;

    // Validate amount
    if (requestedAmount <= 0) {
      throw new BadRequestError('Requested amount must be greater than 0');
    }

    // Verify branch exists and belongs to company
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId },
    });

    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    // Verify requester exists and belongs to branch
    const requester = await prisma.user.findFirst({
      where: {
        id: requestedBy,
        companyId,
        branchId,
      },
    });

    if (!requester) {
      throw new NotFoundError('Requester not found or does not belong to this branch');
    }

    // Generate request number
    const requestNumber = await this.generateRequestNumber(companyId);

    // Create request
    const request = await prisma.pettyCashRequest.create({
      data: {
        requestNumber,
        branchId,
        requestedAmount,
        reason,
        status: PettyCashRequestStatus.PENDING,
        companyId,
        requestedBy,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return request;
  }

  /**
   * Update petty cash request (only PENDING requests)
   */
  static async updateRequest(id: string, companyId: string, requestedBy: string, data: UpdateRequestData) {
    // Check if request exists
    const existingRequest = await prisma.pettyCashRequest.findFirst({
      where: { id, companyId },
    });

    if (!existingRequest) {
      throw new NotFoundError('Petty cash request not found');
    }

    // Only the requester can update their request
    if (existingRequest.requestedBy !== requestedBy) {
      throw new ForbiddenError('You can only update your own requests');
    }

    // Can only update pending requests
    if (existingRequest.status !== PettyCashRequestStatus.PENDING) {
      throw new BadRequestError('Can only update pending requests');
    }

    // Validate amount if provided
    if (data.requestedAmount !== undefined && data.requestedAmount <= 0) {
      throw new BadRequestError('Requested amount must be greater than 0');
    }

    // Update request
    const request = await prisma.pettyCashRequest.update({
      where: { id },
      data: {
        requestedAmount: data.requestedAmount,
        reason: data.reason,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return request;
  }

  /**
   * Approve petty cash request and create transfer
   */
  static async approveRequest(id: string, companyId: string, data: ApproveRequestData) {
    const request = await prisma.pettyCashRequest.findFirst({
      where: { id, companyId },
    });

    if (!request) {
      throw new NotFoundError('Petty cash request not found');
    }

    if (request.status !== PettyCashRequestStatus.PENDING) {
      throw new BadRequestError('Can only approve pending requests');
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

    // Use transaction to approve request and create transfer atomically
    const result = await prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.pettyCashRequest.update({
        where: { id },
        data: {
          status: PettyCashRequestStatus.APPROVED,
          approvedBy: data.approvedBy,
          approvedAt: new Date(),
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          requestedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create transfer
      const transfer = await tx.pettyCashTransfer.create({
        data: {
          transferNumber,
          branchId: request.branchId,
          amount: request.requestedAmount,
          transferDate: new Date(),
          paymentMethodId: data.paymentMethodId,
          transactionRef: data.transactionRef,
          bankDetails: data.bankDetails,
          purpose: data.purpose || `Approved request: ${request.requestNumber} - ${request.reason}`,
          remarks: data.remarks,
          proofUrl: data.proofUrl,
          status: PettyCashTransferStatus.COMPLETED,
          companyId,
          createdBy: data.approvedBy,
        },
      });

      return { request: updatedRequest, transfer };
    });

    return result;
  }

  /**
   * Reject petty cash request
   */
  static async rejectRequest(id: string, companyId: string, data: RejectRequestData) {
    const request = await prisma.pettyCashRequest.findFirst({
      where: { id, companyId },
    });

    if (!request) {
      throw new NotFoundError('Petty cash request not found');
    }

    if (request.status !== PettyCashRequestStatus.PENDING) {
      throw new BadRequestError('Can only reject pending requests');
    }

    const updatedRequest = await prisma.pettyCashRequest.update({
      where: { id },
      data: {
        status: PettyCashRequestStatus.REJECTED,
        approvedBy: data.approvedBy,
        approvedAt: new Date(),
        rejectedReason: data.rejectedReason,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedRequest;
  }

  /**
   * Cancel petty cash request (by requester, only PENDING)
   */
  static async cancelRequest(id: string, companyId: string, requestedBy: string) {
    const request = await prisma.pettyCashRequest.findFirst({
      where: { id, companyId },
    });

    if (!request) {
      throw new NotFoundError('Petty cash request not found');
    }

    // Only the requester can cancel their request
    if (request.requestedBy !== requestedBy) {
      throw new ForbiddenError('You can only cancel your own requests');
    }

    if (request.status !== PettyCashRequestStatus.PENDING) {
      throw new BadRequestError('Can only cancel pending requests');
    }

    const updatedRequest = await prisma.pettyCashRequest.update({
      where: { id },
      data: {
        status: PettyCashRequestStatus.CANCELLED,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedRequest;
  }

  /**
   * Get request statistics
   */
  static async getRequestStats(companyId: string, branchId?: string) {
    const where: Prisma.PettyCashRequestWhereInput = { companyId };

    if (branchId) {
      where.branchId = branchId;
    }

    const [totalRequests, pendingRequests, approvedRequests, rejectedRequests, totalApprovedAmount] =
      await Promise.all([
        prisma.pettyCashRequest.count({ where }),
        prisma.pettyCashRequest.count({
          where: { ...where, status: PettyCashRequestStatus.PENDING },
        }),
        prisma.pettyCashRequest.count({
          where: { ...where, status: PettyCashRequestStatus.APPROVED },
        }),
        prisma.pettyCashRequest.count({
          where: { ...where, status: PettyCashRequestStatus.REJECTED },
        }),
        prisma.pettyCashRequest.aggregate({
          where: { ...where, status: PettyCashRequestStatus.APPROVED },
          _sum: { requestedAmount: true },
        }),
      ]);

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalApprovedAmount: Number(totalApprovedAmount._sum.requestedAmount || 0),
    };
  }
}
