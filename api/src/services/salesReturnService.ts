import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { SalesReturnReason } from '@prisma/client';

interface CreateReturnData {
  invoiceId: string;
  returnReason: SalesReturnReason;
  notes?: string;
  branchId: string;
  companyId: string;
  createdById: string;
  isFullReturn?: boolean;
  items: {
    invoiceItemId: string;
    returnQuantity: number;
    reason?: string;
  }[];
}

export class SalesReturnService {
  /**
   * Generate return number
   */
  private static async generateReturnNumber(branchId: string): Promise<string> {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });

    const branchCode = branch?.code || 'XX';
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get count of returns for today
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await prisma.salesReturn.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const seq = String(count + 1).padStart(3, '0');
    return `SR-${branchCode}-${dateStr}-${seq}`;
  }

  /**
   * Create a new sales return
   */
  static async createReturn(data: CreateReturnData) {
    try {
      // Get the invoice with items
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: data.invoiceId,
          companyId: data.companyId,
        },
        include: {
          items: {
            include: {
              salesReturnItems: true,
            },
          },
          customer: true,
        },
      });

      if (!invoice) {
        throw new AppError(404, 'Invoice not found');
      }

      // Validation 1: Check if invoice is a standalone invoice (not service-linked)
      if (invoice.serviceId) {
        throw new AppError(400, 'Sales returns are only allowed for standalone invoices (not service invoices)');
      }

      // Validation 2: Check if invoice has items
      if (!invoice.items || invoice.items.length === 0) {
        throw new AppError(400, 'Invoice has no items to return');
      }

      // Validation 3: Check payment status
      if (invoice.paymentStatus === 'PENDING') {
        throw new AppError(400, 'Cannot return items from an unpaid invoice');
      }

      // Get customer ID from invoice
      const customerId = invoice.customerId;
      if (!customerId) {
        throw new AppError(400, 'Invoice has no customer associated');
      }

      // Prepare items for return
      let itemsToReturn = data.items;

      // If full return, get all items with full quantities
      if (data.isFullReturn) {
        itemsToReturn = invoice.items.map((item) => {
          // Calculate already returned quantity
          const alreadyReturned = item.salesReturnItems.reduce((sum, ret) => sum + ret.returnQuantity, 0);
          const availableQty = item.quantity - alreadyReturned;

          return {
            invoiceItemId: item.id,
            returnQuantity: availableQty,
            reason: undefined,
          };
        }).filter((item) => item.returnQuantity > 0);
      }

      // Validate items
      if (itemsToReturn.length === 0) {
        throw new AppError(400, 'No items to return');
      }

      // Validate each item
      let totalReturnAmount = 0;
      const validatedItems: { invoiceItemId: string; returnQuantity: number; unitPrice: number; returnAmount: number; reason?: string }[] = [];

      for (const item of itemsToReturn) {
        const invoiceItem = invoice.items.find((i) => i.id === item.invoiceItemId);
        if (!invoiceItem) {
          throw new AppError(404, `Invoice item ${item.invoiceItemId} not found`);
        }

        // Calculate already returned quantity for this item
        const alreadyReturned = invoiceItem.salesReturnItems.reduce((sum, ret) => sum + ret.returnQuantity, 0);
        const availableToReturn = invoiceItem.quantity - alreadyReturned;

        if (item.returnQuantity > availableToReturn) {
          throw new AppError(
            400,
            `Cannot return ${item.returnQuantity} units of "${invoiceItem.description}". Only ${availableToReturn} units available.`
          );
        }

        if (item.returnQuantity <= 0) {
          throw new AppError(400, 'Return quantity must be greater than zero');
        }

        const returnAmount = item.returnQuantity * invoiceItem.unitPrice;
        totalReturnAmount += returnAmount;

        validatedItems.push({
          invoiceItemId: item.invoiceItemId,
          returnQuantity: item.returnQuantity,
          unitPrice: invoiceItem.unitPrice,
          returnAmount,
          reason: item.reason,
        });
      }

      // Generate return number
      const returnNumber = await this.generateReturnNumber(data.branchId);

      // Create the return record with items
      const salesReturn = await prisma.salesReturn.create({
        data: {
          returnNumber,
          invoice: { connect: { id: data.invoiceId } },
          customer: { connect: { id: customerId } },
          returnStatus: 'PENDING',
          returnReason: data.returnReason,
          totalReturnAmount,
          refundedAmount: 0,
          refundProcessed: false,
          notes: data.notes,
          branch: { connect: { id: data.branchId } },
          company: { connect: { id: data.companyId } },
          createdBy: { connect: { id: data.createdById } },
          items: {
            create: validatedItems.map((item) => ({
              invoiceItem: { connect: { id: item.invoiceItemId } },
              returnQuantity: item.returnQuantity,
              unitPrice: item.unitPrice,
              returnAmount: item.returnAmount,
              reason: item.reason,
            })),
          },
        },
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
          customer: true,
          items: {
            include: {
              invoiceItem: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      Logger.info('Sales return created', {
        returnId: salesReturn.id,
        returnNumber: salesReturn.returnNumber,
        invoiceId: data.invoiceId,
        totalReturnAmount,
        itemCount: validatedItems.length,
      });

      return salesReturn;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error creating sales return', { error, data });
      throw new AppError(500, 'Failed to create sales return');
    }
  }

  /**
   * Get return by ID
   */
  static async getReturnById(id: string, companyId: string, branchId?: string) {
    try {
      const salesReturn = await prisma.salesReturn.findFirst({
        where: {
          id,
          companyId,
          ...(branchId && { branchId }),
        },
        include: {
          invoice: {
            include: {
              customer: true,
              items: true,
            },
          },
          customer: true,
          items: {
            include: {
              invoiceItem: true,
            },
          },
          paymentMethod: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          branch: true,
        },
      });

      if (!salesReturn) {
        throw new AppError(404, 'Sales return not found');
      }

      return salesReturn;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error fetching sales return', { error, id, companyId });
      throw new AppError(500, 'Failed to fetch sales return');
    }
  }

  /**
   * Get all returns for a company
   */
  static async getAllReturns(companyId: string, branchId?: string) {
    try {
      const returns = await prisma.salesReturn.findMany({
        where: {
          companyId,
          ...(branchId && { branchId }),
        },
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
          customer: true,
          items: {
            include: {
              invoiceItem: true,
            },
          },
          paymentMethod: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          branch: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return returns;
    } catch (error) {
      Logger.error('Error fetching all sales returns', { error, companyId, branchId });
      throw new AppError(500, 'Failed to fetch sales returns');
    }
  }

  /**
   * Get all returns for an invoice
   */
  static async getReturnsByInvoice(invoiceId: string, companyId: string) {
    try {
      const returns = await prisma.salesReturn.findMany({
        where: {
          invoiceId,
          companyId,
        },
        include: {
          items: {
            include: {
              invoiceItem: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          paymentMethod: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return returns;
    } catch (error) {
      Logger.error('Error fetching returns by invoice', { error, invoiceId, companyId });
      throw new AppError(500, 'Failed to fetch sales returns');
    }
  }

  /**
   * Get eligible invoices for return (standalone invoices with items)
   */
  static async getEligibleInvoices(companyId: string, branchId?: string, search?: string) {
    try {
      const invoices = await prisma.invoice.findMany({
        where: {
          companyId,
          ...(branchId && { branchId }),
          serviceId: null, // Only standalone invoices
          paymentStatus: { in: ['PAID', 'PARTIAL'] },
          items: {
            some: {}, // Has at least one item
          },
          ...(search && {
            OR: [
              { invoiceNumber: { contains: search, mode: 'insensitive' } },
              { customer: { name: { contains: search, mode: 'insensitive' } } },
              { customer: { phone: { contains: search, mode: 'insensitive' } } },
            ],
          }),
        },
        include: {
          customer: true,
          items: {
            include: {
              salesReturnItems: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      // Filter out fully returned invoices
      const eligibleInvoices = invoices.filter((invoice) => {
        const hasReturnableItems = invoice.items.some((item) => {
          const alreadyReturned = item.salesReturnItems.reduce((sum, ret) => sum + ret.returnQuantity, 0);
          return item.quantity > alreadyReturned;
        });
        return hasReturnableItems;
      });

      return eligibleInvoices;
    } catch (error) {
      Logger.error('Error fetching eligible invoices', { error, companyId, branchId });
      throw new AppError(500, 'Failed to fetch eligible invoices');
    }
  }

  /**
   * Confirm a sales return
   */
  static async confirmReturn(id: string, companyId: string, confirmedBy: string, branchId?: string) {
    try {
      const salesReturn = await this.getReturnById(id, companyId, branchId);

      if (salesReturn.returnStatus !== 'PENDING') {
        throw new AppError(400, `Return is already ${salesReturn.returnStatus.toLowerCase()}`);
      }

      const updatedReturn = await prisma.salesReturn.update({
        where: { id },
        data: {
          returnStatus: 'CONFIRMED',
          updatedAt: new Date(),
        },
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
          customer: true,
          items: {
            include: {
              invoiceItem: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      Logger.info('Sales return confirmed', {
        returnId: id,
        returnNumber: salesReturn.returnNumber,
      });

      return updatedReturn;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error confirming sales return', { error, id, companyId });
      throw new AppError(500, 'Failed to confirm sales return');
    }
  }

  /**
   * Reject a sales return
   */
  static async rejectReturn(id: string, companyId: string, reason?: string, branchId?: string) {
    try {
      const salesReturn = await this.getReturnById(id, companyId, branchId);

      if (salesReturn.returnStatus !== 'PENDING') {
        throw new AppError(400, `Return is already ${salesReturn.returnStatus.toLowerCase()}`);
      }

      const updatedReturn = await prisma.salesReturn.update({
        where: { id },
        data: {
          returnStatus: 'REJECTED',
          notes: reason ? `${salesReturn.notes || ''}\nRejection Reason: ${reason}` : salesReturn.notes,
          updatedAt: new Date(),
        },
      });

      Logger.info('Sales return rejected', { returnId: id });

      return updatedReturn;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error rejecting sales return', { error, id, companyId });
      throw new AppError(500, 'Failed to reject sales return');
    }
  }

  /**
   * Process refund for a confirmed return
   */
  static async processRefund(
    id: string,
    companyId: string,
    processedById: string,
    paymentMethodId?: string,
    referenceNumber?: string,
    notes?: string,
    branchId?: string
  ) {
    try {
      const salesReturn = await this.getReturnById(id, companyId, branchId);

      // Validation 1: Check if return is confirmed
      if (salesReturn.returnStatus !== 'CONFIRMED') {
        throw new AppError(
          400,
          `Return must be confirmed before processing refund. Current status: ${salesReturn.returnStatus}`
        );
      }

      // Validation 2: Check if refund already processed
      if (salesReturn.refundProcessed) {
        throw new AppError(400, 'Refund has already been processed for this return');
      }

      const refundAmount = parseFloat(salesReturn.totalReturnAmount.toString());

      const result = await prisma.$transaction(async (tx) => {
        // 1. Update the return with refund info
        const updatedReturn = await tx.salesReturn.update({
          where: { id },
          data: {
            refundProcessed: true,
            refundedAmount: refundAmount,
            ...(paymentMethodId && { paymentMethodId }),
            referenceNumber,
            notes: notes ? `${salesReturn.notes || ''}\nRefund Note: ${notes}` : salesReturn.notes,
            processedById,
            processedAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            invoice: {
              include: {
                customer: true,
              },
            },
            customer: true,
            items: {
              include: {
                invoiceItem: true,
              },
            },
            paymentMethod: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            processedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // 2. Update invoice paid amount (reduce by refund amount)
        await tx.invoice.update({
          where: { id: salesReturn.invoiceId },
          data: {
            paidAmount: {
              decrement: refundAmount,
            },
          },
        });

        Logger.info('Sales return refund processed', {
          returnId: id,
          returnNumber: salesReturn.returnNumber,
          refundAmount,
          paymentMethodId,
        });

        return updatedReturn;
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error processing sales return refund', { error, id, companyId });
      throw new AppError(500, 'Failed to process refund');
    }
  }
}
