import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { PurchaseOrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateSupplierPaymentData {
  purchaseOrderId: string;
  supplierId: string;
  amount: number;
  paymentDate?: Date;
  paymentMethodId: string;
  referenceNumber?: string;
  notes?: string;
  branchId: string;
  companyId: string;
}

interface UpdateSupplierPaymentData {
  amount?: number;
  paymentDate?: Date;
  paymentMethodId?: string;
  referenceNumber?: string;
  notes?: string;
}

interface SupplierPaymentFilters {
  companyId: string;
  branchId?: string;
  supplierId?: string;
  purchaseOrderId?: string;
  paymentMethodId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class SupplierPaymentService {
  /**
   * Create a supplier payment
   */
  static async createSupplierPayment(
    data: CreateSupplierPaymentData,
    userId: string
  ): Promise<any> {
    try {
      // Validate purchase order exists
      const purchaseOrder = await prisma.purchaseOrder.findFirst({
        where: {
          id: data.purchaseOrderId,
          companyId: data.companyId,
          supplierId: data.supplierId,
        },
      });

      if (!purchaseOrder) {
        throw new AppError(404, 'Purchase order not found');
      }

      if (purchaseOrder.status === PurchaseOrderStatus.CANCELLED) {
        throw new AppError(400, 'Cannot make payment for cancelled purchase order');
      }

      // Check if payment amount exceeds remaining balance
      const currentPaidAmount = parseFloat(purchaseOrder.paidAmount.toString());
      const grandTotal = parseFloat(purchaseOrder.grandTotal.toString());
      const remainingBalance = grandTotal - currentPaidAmount;

      if (data.amount > remainingBalance) {
        throw new AppError(
          400,
          `Payment amount (${data.amount}) exceeds remaining balance (${remainingBalance.toFixed(2)})`
        );
      }

      // Create payment and update purchase order
      const payment = await prisma.$transaction(async (tx) => {
        // Create payment record
        const newPayment = await tx.supplierPayment.create({
          data: {
            purchaseOrderId: data.purchaseOrderId,
            supplierId: data.supplierId,
            amount: new Decimal(data.amount),
            paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
            paymentMethodId: data.paymentMethodId,
            referenceNumber: data.referenceNumber,
            notes: data.notes,
            branchId: data.branchId,
            companyId: data.companyId,
            createdBy: userId,
          },
          include: {
            purchaseOrder: {
              select: {
                id: true,
                poNumber: true,
                grandTotal: true,
              },
            },
            supplier: {
              select: {
                id: true,
                name: true,
                supplierCode: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
            createdByUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Update purchase order paid amount
        const newPaidAmount = currentPaidAmount + data.amount;
        await tx.purchaseOrder.update({
          where: { id: data.purchaseOrderId },
          data: {
            paidAmount: new Decimal(newPaidAmount),
            status:
              newPaidAmount >= grandTotal
                ? PurchaseOrderStatus.COMPLETED
                : purchaseOrder.status,
          },
        });

        return newPayment;
      });

      Logger.info('Supplier payment created successfully', {
        paymentId: payment.id,
        purchaseOrderId: data.purchaseOrderId,
        amount: data.amount,
        userId,
      });

      return payment;
    } catch (error) {
      Logger.error('Error creating supplier payment', { error, data, userId });
      throw error;
    }
  }

  /**
   * Get all supplier payments with filters and pagination
   */
  static async getSupplierPayments(filters: SupplierPaymentFilters): Promise<any> {
    try {
      const {
        companyId,
        branchId,
        supplierId,
        purchaseOrderId,
        paymentMethodId,
        startDate,
        endDate,
        page = 1,
        limit = 20,
        sortBy = 'paymentDate',
        sortOrder = 'desc',
      } = filters;

      // Build where clause
      const where: any = { companyId };

      if (branchId) where.branchId = branchId;
      if (supplierId) where.supplierId = supplierId;
      if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId;
      if (paymentMethodId) where.paymentMethodId = paymentMethodId;

      if (startDate || endDate) {
        where.paymentDate = {};
        if (startDate) where.paymentDate.gte = startDate;
        if (endDate) where.paymentDate.lte = endDate;
      }

      // Count total matching records
      const total = await prisma.supplierPayment.count({ where });

      // Fetch payments
      const payments = await prisma.supplierPayment.findMany({
        where,
        include: {
          purchaseOrder: {
            select: {
              id: true,
              poNumber: true,
              grandTotal: true,
              paidAmount: true,
              orderDate: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
              supplierCode: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      });

      Logger.info('Supplier payments retrieved successfully', {
        companyId,
        count: payments.length,
      });

      return {
        payments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error retrieving supplier payments', { error, filters });
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  static async getSupplierPaymentById(id: string, companyId: string): Promise<any> {
    try {
      const payment = await prisma.supplierPayment.findFirst({
        where: { id, companyId },
        include: {
          purchaseOrder: {
            include: {
              items: {
                include: {
                  inventory: {
                    select: {
                      id: true,
                      partNumber: true,
                      partName: true,
                    },
                  },
                },
              },
            },
          },
          supplier: true,
          branch: true,
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!payment) {
        throw new AppError(404, 'Supplier payment not found');
      }

      Logger.info('Supplier payment retrieved successfully', { id, companyId });

      return payment;
    } catch (error) {
      Logger.error('Error retrieving supplier payment', { error, id, companyId });
      throw error;
    }
  }

  /**
   * Get supplier payment summary
   */
  static async getSupplierPaymentSummary(
    supplierId: string,
    companyId: string,
    branchId?: string
  ): Promise<{
    totalPayments: number;
    paymentCount: number;
    lastPaymentDate: Date | null;
    paymentsByMethod: { method: string; total: number }[];
  }> {
    try {
      const where: any = { supplierId, companyId };
      if (branchId) where.branchId = branchId;

      const payments = await prisma.supplierPayment.findMany({
        where,
        select: {
          amount: true,
          paymentMethod: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          paymentDate: true,
        },
        orderBy: {
          paymentDate: 'desc',
        },
      });

      const totalPayments = payments.reduce(
        (sum, payment) => sum + parseFloat(payment.amount.toString()),
        0
      );

      const paymentsByMethod = payments.reduce((acc, payment) => {
        const methodName = payment.paymentMethod?.name || 'Unknown';
        const existing = acc.find((item) => item.method === methodName);
        const amount = parseFloat(payment.amount.toString());

        if (existing) {
          existing.total += amount;
        } else {
          acc.push({ method: methodName, total: amount });
        }

        return acc;
      }, [] as { method: string; total: number }[]);

      Logger.info('Supplier payment summary retrieved successfully', {
        supplierId,
        companyId,
        branchId,
      });

      return {
        totalPayments,
        paymentCount: payments.length,
        lastPaymentDate: payments.length > 0 ? payments[0].paymentDate : null,
        paymentsByMethod,
      };
    } catch (error) {
      Logger.error('Error retrieving supplier payment summary', {
        error,
        supplierId,
        companyId,
      });
      throw error;
    }
  }

  /**
   * Update supplier payment
   */
  static async updateSupplierPayment(
    id: string,
    companyId: string,
    data: UpdateSupplierPaymentData
  ): Promise<any> {
    try {
      const existingPayment = await prisma.supplierPayment.findFirst({
        where: { id, companyId },
        include: {
          purchaseOrder: true,
        },
      });

      if (!existingPayment) {
        throw new AppError(404, 'Supplier payment not found');
      }

      // If amount is being updated, recalculate purchase order paid amount
      let updatedPayment;
      if (data.amount !== undefined && data.amount !== parseFloat(existingPayment.amount.toString())) {
        const purchaseOrder = existingPayment.purchaseOrder;
        const oldAmount = parseFloat(existingPayment.amount.toString());
        const newAmount = data.amount;
        const currentPaidAmount = parseFloat(purchaseOrder.paidAmount.toString());
        const grandTotal = parseFloat(purchaseOrder.grandTotal.toString());

        // Calculate new paid amount
        const newPaidAmount = currentPaidAmount - oldAmount + newAmount;

        if (newPaidAmount > grandTotal) {
          throw new AppError(
            400,
            `Updated payment amount would exceed purchase order total`
          );
        }

        updatedPayment = await prisma.$transaction(async (tx) => {
          // Update payment
          const payment = await tx.supplierPayment.update({
            where: { id },
            data: {
              amount: data.amount !== undefined ? new Decimal(data.amount) : undefined,
              paymentDate: data.paymentDate,
              paymentMethodId: data.paymentMethodId,
              referenceNumber: data.referenceNumber,
              notes: data.notes,
            },
            include: {
              purchaseOrder: {
                select: {
                  id: true,
                  poNumber: true,
                },
              },
              supplier: {
                select: {
                  id: true,
                  name: true,
                },
              },
              createdByUser: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          // Update purchase order paid amount
          await tx.purchaseOrder.update({
            where: { id: existingPayment.purchaseOrderId },
            data: {
              paidAmount: new Decimal(newPaidAmount),
              status:
                newPaidAmount >= grandTotal
                  ? PurchaseOrderStatus.COMPLETED
                  : purchaseOrder.status === PurchaseOrderStatus.COMPLETED
                  ? PurchaseOrderStatus.RECEIVED
                  : purchaseOrder.status,
            },
          });

          return payment;
        });
      } else {
        // Update only other fields
        updatedPayment = await prisma.supplierPayment.update({
          where: { id },
          data: {
            paymentDate: data.paymentDate,
            paymentMethodId: data.paymentMethodId,
            referenceNumber: data.referenceNumber,
            notes: data.notes,
          },
          include: {
            purchaseOrder: {
              select: {
                id: true,
                poNumber: true,
              },
            },
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
            createdByUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }

      Logger.info('Supplier payment updated successfully', { id, companyId });

      return updatedPayment;
    } catch (error) {
      Logger.error('Error updating supplier payment', { error, id, data });
      throw error;
    }
  }

  /**
   * Delete supplier payment
   */
  static async deleteSupplierPayment(id: string, companyId: string): Promise<void> {
    try {
      const payment = await prisma.supplierPayment.findFirst({
        where: { id, companyId },
        include: {
          purchaseOrder: true,
        },
      });

      if (!payment) {
        throw new AppError(404, 'Supplier payment not found');
      }

      await prisma.$transaction(async (tx) => {
        // Delete payment
        await tx.supplierPayment.delete({
          where: { id },
        });

        // Update purchase order paid amount
        const purchaseOrder = payment.purchaseOrder;
        const currentPaidAmount = parseFloat(purchaseOrder.paidAmount.toString());
        const paymentAmount = parseFloat(payment.amount.toString());
        const newPaidAmount = currentPaidAmount - paymentAmount;
        const grandTotal = parseFloat(purchaseOrder.grandTotal.toString());

        await tx.purchaseOrder.update({
          where: { id: payment.purchaseOrderId },
          data: {
            paidAmount: new Decimal(newPaidAmount),
            status:
              purchaseOrder.status === PurchaseOrderStatus.COMPLETED && newPaidAmount < grandTotal
                ? PurchaseOrderStatus.RECEIVED
                : purchaseOrder.status,
          },
        });
      });

      Logger.info('Supplier payment deleted successfully', { id, companyId });
    } catch (error) {
      Logger.error('Error deleting supplier payment', { error, id, companyId });
      throw error;
    }
  }
}
