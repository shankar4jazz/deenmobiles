import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

interface CreateReturnData {
  purchaseOrderItemId: string;
  returnQty: number;
  returnReason: string;
  returnType: 'REFUND' | 'REPLACEMENT';
  notes?: string;
  branchId: string;
  companyId: string;
  createdBy: string;
}

export class PurchaseReturnService {
  /**
   * Create a new purchase return
   */
  static async createReturn(data: CreateReturnData) {
    try {
      // Get the purchase order item with related data
      const poItem = await prisma.purchaseOrderItem.findUnique({
        where: { id: data.purchaseOrderItemId },
        include: {
          purchaseOrder: true,
          returns: true,
        },
      });

      if (!poItem) {
        throw new AppError(404, 'Purchase order item not found');
      }

      // Validation 1: Check if items are received
      if (parseFloat(poItem.receivedQty.toString()) === 0) {
        throw new AppError(
          400,
          'Items must be received before they can be returned. Received quantity is 0.'
        );
      }

      // Validation 2: Check PO status
      const validStatuses = ['RECEIVED', 'PARTIALLY_RECEIVED', 'COMPLETED'];
      if (!validStatuses.includes(poItem.purchaseOrder.status)) {
        throw new AppError(
          400,
          `Purchase order must be in RECEIVED, PARTIALLY_RECEIVED, or COMPLETED status to process returns. Current status: ${poItem.purchaseOrder.status}`
        );
      }

      // Calculate already returned quantity
      const alreadyReturned = poItem.returns.reduce((sum, ret) => {
        return sum + parseFloat(ret.returnQty.toString());
      }, 0);

      // Validate return quantity
      const availableToReturn = parseFloat(poItem.receivedQty.toString()) - alreadyReturned;

      if (data.returnQty > availableToReturn) {
        throw new AppError(
          400,
          `Cannot return ${data.returnQty} units. Only ${availableToReturn} units available to return.`
        );
      }

      if (data.returnQty <= 0) {
        throw new AppError(400, 'Return quantity must be greater than zero');
      }

      // Calculate refund amount
      const refundAmount = parseFloat(poItem.unitPrice.toString()) * data.returnQty;

      // Validation 3: Check if sufficient payment made for refund
      if (data.returnType === 'REFUND') {
        const paidAmount = parseFloat(poItem.purchaseOrder.paidAmount.toString());

        if (refundAmount > paidAmount) {
          throw new AppError(
            400,
            `Cannot process refund. Refund amount (₹${refundAmount.toFixed(2)}) exceeds paid amount (₹${paidAmount.toFixed(2)}). Outstanding payment required first.`
          );
        }
      }

      // Create the return record
      const purchaseReturn = await prisma.purchaseItemReturn.create({
        data: {
          purchaseOrderItem: {
            connect: { id: data.purchaseOrderItemId }
          },
          returnQty: data.returnQty,
          returnReason: data.returnReason as any,
          returnType: data.returnType,
          returnStatus: 'PENDING',
          refundAmount,
          stockDeducted: false,
          notes: data.notes,
          branch: {
            connect: { id: data.branchId }
          },
          company: {
            connect: { id: data.companyId }
          },
          createdByUser: {
            connect: { id: data.createdBy }
          },
        },
        include: {
          purchaseOrderItem: {
            include: {
              inventory: true,
              item: true,
              purchaseOrder: {
                include: {
                  supplier: true,
                },
              },
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

      Logger.info('Purchase return created', {
        returnId: purchaseReturn.id,
        poItemId: data.purchaseOrderItemId,
        returnQty: data.returnQty,
        returnType: data.returnType,
      });

      return purchaseReturn;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error creating purchase return', { error, data });
      throw new AppError(500, 'Failed to create purchase return');
    }
  }

  /**
   * Get return by ID
   */
  static async getReturnById(id: string, companyId: string, branchId?: string) {
    try {
      const purchaseReturn = await prisma.purchaseItemReturn.findFirst({
        where: {
          id,
          companyId,
          ...(branchId && { branchId }),
        },
        include: {
          purchaseOrderItem: {
            include: {
              inventory: true,
              item: true,
              purchaseOrder: {
                include: {
                  supplier: true,
                  branch: true,
                },
              },
            },
          },
          replacementPO: {
            include: {
              supplier: true,
              branch: true,
            },
          },
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

      if (!purchaseReturn) {
        throw new AppError(404, 'Purchase return not found');
      }

      return purchaseReturn;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error fetching purchase return', { error, id, companyId });
      throw new AppError(500, 'Failed to fetch purchase return');
    }
  }

  /**
   * Get all returns for a company
   */
  static async getAllReturns(companyId: string, branchId?: string) {
    try {
      const returns = await prisma.purchaseItemReturn.findMany({
        where: {
          companyId,
          ...(branchId && { branchId }),
        },
        include: {
          purchaseOrderItem: {
            include: {
              inventory: true,
              item: true,
              purchaseOrder: {
                include: {
                  supplier: true,
                },
              },
            },
          },
          replacementPO: {
            select: {
              id: true,
              poNumber: true,
              status: true,
            },
          },
          branch: true,
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          refundTransactions: {
            include: {
              paymentMethod: true,
              processedByUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return returns;
    } catch (error) {
      Logger.error('Error fetching all returns', { error, companyId, branchId });
      throw new AppError(500, 'Failed to fetch purchase returns');
    }
  }

  /**
   * Get all returns for a purchase order
   */
  static async getReturnsByPurchaseOrder(poId: string, companyId: string) {
    try {
      const returns = await prisma.purchaseItemReturn.findMany({
        where: {
          companyId,
          purchaseOrderItem: {
            purchaseOrderId: poId,
          },
        },
        include: {
          purchaseOrderItem: {
            include: {
              inventory: true,
              item: true,
            },
          },
          replacementPO: {
            select: {
              id: true,
              poNumber: true,
              status: true,
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      return returns;
    } catch (error) {
      Logger.error('Error fetching returns by PO', { error, poId, companyId });
      throw new AppError(500, 'Failed to fetch purchase returns');
    }
  }

  /**
   * Confirm a purchase return
   * - Deduct stock from inventory
   * - If REFUND: reduce PO paid amount
   * - If REPLACEMENT: create new PO for replacement
   */
  static async confirmReturn(id: string, companyId: string, confirmedBy: string, branchId?: string) {
    try {
      const purchaseReturn = await this.getReturnById(id, companyId, branchId);

      if (purchaseReturn.returnStatus !== 'PENDING') {
        throw new AppError(400, `Return is already ${purchaseReturn.returnStatus.toLowerCase()}`);
      }

      const result = await prisma.$transaction(async (tx) => {
        const poItem = purchaseReturn.purchaseOrderItem;
        const po = poItem.purchaseOrder;

        // 1. Deduct stock from branch inventory
        if (poItem.itemId) {
          // New item-based inventory system
          const branchInventory = await tx.branchInventory.findFirst({
            where: {
              itemId: poItem.itemId,
              branchId: purchaseReturn.branchId,
            },
          });

          if (branchInventory) {
            await tx.branchInventory.update({
              where: { id: branchInventory.id },
              data: {
                stockQuantity: {
                  decrement: purchaseReturn.returnQty,
                },
              },
            });

            // Create stock movement record
            await tx.stockMovement.create({
              data: {
                branchInventoryId: branchInventory.id,
                movementType: 'RETURN',
                quantity: purchaseReturn.returnQty,
                previousQty: branchInventory.stockQuantity,
                newQty: parseFloat(branchInventory.stockQuantity.toString()) - parseFloat(purchaseReturn.returnQty.toString()),
                referenceType: 'PURCHASE_RETURN',
                referenceId: id,
                notes: `Return: ${purchaseReturn.returnReason}`,
                userId: confirmedBy,
                branchId: purchaseReturn.branchId,
                companyId,
              },
            });
          }
        } else if (poItem.inventoryId) {
          // Old inventory system (legacy support)
          await tx.inventory.update({
            where: { id: poItem.inventoryId },
            data: {
              stockQuantity: {
                decrement: purchaseReturn.returnQty,
              },
            },
          });
        }

        // 2. Handle based on return type
        if (purchaseReturn.returnType === 'REFUND') {
          // Note: Actual refund processing is done separately via processRefund()
          // This just confirms the return and deducts stock
          // paidAmount will be adjusted when refund is actually processed
        } else if (purchaseReturn.returnType === 'REPLACEMENT') {
          // Auto-create replacement PO
          const replacementPO = await tx.purchaseOrder.create({
            data: {
              poNumber: `${po.poNumber}-RPL-${Date.now()}`,
              supplierId: po.supplierId,
              branchId: po.branchId,
              companyId: po.companyId,
              orderDate: new Date(),
              totalAmount: parseFloat(poItem.unitPrice.toString()) * parseFloat(purchaseReturn.returnQty.toString()),
              taxAmount: 0, // Will be calculated if needed
              grandTotal: parseFloat(poItem.unitPrice.toString()) * parseFloat(purchaseReturn.returnQty.toString()),
              paidAmount: 0,
              status: 'PENDING',
              notes: `Replacement for Return #${id} - ${purchaseReturn.returnReason}`,
              createdBy: confirmedBy,
              items: {
                create: {
                  inventoryId: poItem.inventoryId,
                  itemId: poItem.itemId,
                  quantity: purchaseReturn.returnQty,
                  unitPrice: poItem.unitPrice,
                  salesPrice: poItem.salesPrice,
                  taxRate: poItem.taxRate,
                  taxAmount: 0,
                  totalAmount: parseFloat(poItem.unitPrice.toString()) * parseFloat(purchaseReturn.returnQty.toString()),
                  receivedQty: 0,
                  returnedQty: 0,
                },
              },
            },
          });

          // Link replacement PO to return
          await tx.purchaseItemReturn.update({
            where: { id },
            data: {
              replacementPOId: replacementPO.id,
            },
          });
        }

        // 3. Update return status
        const updatedReturn = await tx.purchaseItemReturn.update({
          where: { id },
          data: {
            returnStatus: 'CONFIRMED',
            stockDeducted: true,
            updatedAt: new Date(),
          },
          include: {
            purchaseOrderItem: {
              include: {
                inventory: true,
                item: true,
                purchaseOrder: {
                  include: {
                    supplier: true,
                  },
                },
              },
            },
            replacementPO: true,
          },
        });

        // 4. Update PO item returned quantity
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: {
            returnedQty: {
              increment: purchaseReturn.returnQty,
            },
          },
        });

        return updatedReturn;
      });

      Logger.info('Purchase return confirmed', {
        returnId: id,
        returnType: purchaseReturn.returnType,
        returnQty: purchaseReturn.returnQty,
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error confirming purchase return', { error, id, companyId });
      throw new AppError(500, 'Failed to confirm purchase return');
    }
  }

  /**
   * Reject a purchase return
   */
  static async rejectReturn(id: string, companyId: string, reason?: string, branchId?: string) {
    try {
      const purchaseReturn = await this.getReturnById(id, companyId, branchId);

      if (purchaseReturn.returnStatus !== 'PENDING') {
        throw new AppError(400, `Return is already ${purchaseReturn.returnStatus.toLowerCase()}`);
      }

      const updatedReturn = await prisma.purchaseItemReturn.update({
        where: { id },
        data: {
          returnStatus: 'REJECTED',
          notes: reason ? `${purchaseReturn.notes || ''}\nRejection Reason: ${reason}` : purchaseReturn.notes,
          updatedAt: new Date(),
        },
      });

      Logger.info('Purchase return rejected', { returnId: id });

      return updatedReturn;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error rejecting purchase return', { error, id, companyId });
      throw new AppError(500, 'Failed to reject purchase return');
    }
  }

  /**
   * Process refund for a confirmed return
   * - Create refund transaction record
   * - Reduce PO paid amount
   * - Mark return as refund processed
   */
  static async processRefund(
    id: string,
    companyId: string,
    processedBy: string,
    paymentMethodId?: string,
    referenceNumber?: string,
    notes?: string,
    branchId?: string
  ) {
    try {
      const purchaseReturn = await this.getReturnById(id, companyId, branchId);

      // Validation 1: Check if return is confirmed
      if (purchaseReturn.returnStatus !== 'CONFIRMED') {
        throw new AppError(
          400,
          `Return must be confirmed before processing refund. Current status: ${purchaseReturn.returnStatus}`
        );
      }

      // Validation 2: Check if return type is REFUND
      if (purchaseReturn.returnType !== 'REFUND') {
        throw new AppError(
          400,
          `Cannot process refund for ${purchaseReturn.returnType} type returns. This return is for replacement, not refund.`
        );
      }

      // Validation 3: Check if refund already processed
      if (purchaseReturn.refundProcessed) {
        throw new AppError(400, 'Refund has already been processed for this return');
      }

      const result = await prisma.$transaction(async (tx) => {
        const refundAmount = parseFloat(purchaseReturn.refundAmount.toString());
        const poItem = purchaseReturn.purchaseOrderItem;
        const po = poItem.purchaseOrder;

        // 1. Create refund transaction record
        const refundTransaction = await tx.refundTransaction.create({
          data: {
            purchaseReturn: {
              connect: { id }
            },
            refundAmount,
            refundDate: new Date(),
            ...(paymentMethodId && {
              paymentMethod: {
                connect: { id: paymentMethodId }
              }
            }),
            referenceNumber: referenceNumber || null,
            notes: notes || `Refund for ${purchaseReturn.returnQty} units - ${purchaseReturn.returnReason}`,
            processedByUser: {
              connect: { id: processedBy }
            },
            branch: {
              connect: { id: purchaseReturn.branchId }
            },
            company: {
              connect: { id: companyId }
            },
          },
        });

        // 2. Reduce PO paid amount
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: {
            paidAmount: {
              decrement: refundAmount,
            },
          },
        });

        // 3. Mark return as refund processed
        const updatedReturn = await tx.purchaseItemReturn.update({
          where: { id },
          data: {
            refundProcessed: true,
            updatedAt: new Date(),
          },
          include: {
            purchaseOrderItem: {
              include: {
                inventory: true,
                item: true,
                purchaseOrder: {
                  include: {
                    supplier: true,
                  },
                },
              },
            },
            refundTransactions: {
              include: {
                paymentMethod: true,
                processedByUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

        Logger.info('Refund processed successfully', {
          returnId: id,
          refundAmount,
          refundTransactionId: refundTransaction.id,
          poId: po.id,
        });

        return {
          purchaseReturn: updatedReturn,
          refundTransaction,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error processing refund', { error, id, companyId });
      throw new AppError(500, 'Failed to process refund');
    }
  }
}
