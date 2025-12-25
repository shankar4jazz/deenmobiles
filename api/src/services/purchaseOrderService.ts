import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { PurchaseOrderStatus, StockMovementType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { StockMovementService } from './stockMovementService';

interface PurchaseOrderItemData {
  inventoryId?: string; // Deprecated - for backward compatibility
  itemId?: string; // New - use this for new purchase orders
  quantity: number;
  unitPrice: number;
  salesPrice?: number;
  taxRate: number;
}

interface CreatePurchaseOrderData {
  supplierId: string;
  branchId: string;
  companyId: string;
  orderDate?: Date;
  expectedDelivery?: Date;
  invoiceNumber?: string;
  invoiceDate?: Date;
  notes?: string;
  items: PurchaseOrderItemData[];
}

interface UpdatePurchaseOrderData {
  supplierId?: string;
  orderDate?: Date;
  expectedDelivery?: Date;
  deliveryDate?: Date;
  invoiceNumber?: string;
  invoiceDate?: Date;
  notes?: string;
  status?: PurchaseOrderStatus;
  items?: PurchaseOrderItemData[];
}

interface PurchaseOrderFilters {
  companyId: string;
  branchId?: string;
  supplierId?: string;
  status?: PurchaseOrderStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ReceiveItemsData {
  items: {
    itemId: string;
    receivedQty: number;
  }[];
  deliveryDate?: Date;
}

export class PurchaseOrderService {
  /**
   * Generate a unique PO number
   */
  private static async generatePONumber(companyId: string, branchId: string): Promise<string> {
    try {
      // Get branch code
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { code: true },
      });

      if (!branch) {
        throw new AppError(404, 'Branch not found');
      }

      // Get count of purchase orders for this branch
      const count = await prisma.purchaseOrder.count({
        where: { branchId, companyId },
      });

      // Generate PO number: PO-{BranchCode}-{SequenceNumber}
      const sequenceNumber = (count + 1).toString().padStart(5, '0');
      return `PO-${branch.code}-${sequenceNumber}`;
    } catch (error) {
      Logger.error('Error generating PO number', { error, companyId, branchId });
      throw error;
    }
  }

  /**
   * Calculate totals for purchase order
   */
  private static calculateTotals(items: PurchaseOrderItemData[]): {
    totalAmount: number;
    taxAmount: number;
    grandTotal: number;
  } {
    let totalAmount = 0;
    let taxAmount = 0;

    items.forEach((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = itemTotal * (item.taxRate / 100);
      totalAmount += itemTotal;
      taxAmount += itemTax;
    });

    const grandTotal = totalAmount + taxAmount;

    return { totalAmount, taxAmount, grandTotal };
  }

  /**
   * Create a new purchase order
   */
  static async createPurchaseOrder(
    data: CreatePurchaseOrderData,
    userId: string
  ): Promise<any> {
    try {
      // Validate supplier exists
      const supplier = await prisma.supplier.findFirst({
        where: {
          id: data.supplierId,
          companyId: data.companyId,
          active: true,
        },
      });

      if (!supplier) {
        throw new AppError(404, 'Supplier not found or inactive');
      }

      // Validate items - support both old (inventoryId) and new (itemId) structure
      const hasNewStructure = data.items.some((item) => item.itemId);
      const hasOldStructure = data.items.some((item) => item.inventoryId);

      if (hasNewStructure) {
        // New structure: validate items exist
        const itemIds = data.items.map((item) => item.itemId).filter(Boolean);
        const items = await prisma.item.findMany({
          where: {
            id: { in: itemIds as string[] },
            companyId: data.companyId,
            isActive: true,
          },
        });

        if (items.length !== data.items.length) {
          throw new AppError(400, 'One or more items not found or inactive');
        }
      } else if (hasOldStructure) {
        // Old structure: validate inventory items exist (backward compatibility)
        const inventoryIds = data.items.map((item) => item.inventoryId).filter(Boolean);
        const inventories = await prisma.inventory.findMany({
          where: {
            id: { in: inventoryIds as string[] },
            companyId: data.companyId,
            active: true,
          },
        });

        if (inventories.length !== data.items.length) {
          throw new AppError(400, 'One or more inventory items not found or inactive');
        }
      } else {
        throw new AppError(400, 'Each item must have either itemId or inventoryId');
      }

      // Generate PO number
      const poNumber = await this.generatePONumber(data.companyId, data.branchId);

      // Calculate totals
      const { totalAmount, taxAmount, grandTotal } = this.calculateTotals(data.items);

      // Create purchase order with items
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          poNumber,
          supplierId: data.supplierId,
          branchId: data.branchId,
          companyId: data.companyId,
          orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
          expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : undefined,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
          notes: data.notes,
          totalAmount: new Decimal(totalAmount),
          taxAmount: new Decimal(taxAmount),
          grandTotal: new Decimal(grandTotal),
          status: PurchaseOrderStatus.PENDING,
          createdBy: userId,
          items: {
            create: data.items.map((item) => {
              const itemTotal = item.quantity * item.unitPrice;
              const itemTax = itemTotal * (item.taxRate / 100);
              const itemGrandTotal = itemTotal + itemTax;

              return {
                itemId: item.itemId || undefined, // New structure
                inventoryId: item.inventoryId || undefined, // Old structure (backward compatibility)
                quantity: new Decimal(item.quantity),
                unitPrice: new Decimal(item.unitPrice),
                salesPrice: item.salesPrice ? new Decimal(item.salesPrice) : undefined,
                taxRate: new Decimal(item.taxRate),
                taxAmount: new Decimal(itemTax),
                totalAmount: new Decimal(itemGrandTotal),
                receivedQty: new Decimal(0),
              };
            }),
          },
        },
        include: {
          supplier: true,
          branch: true,
          items: {
            include: {
              inventory: true, // Old structure
              item: true, // New structure
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

      Logger.info('Purchase order created successfully', {
        poNumber,
        userId,
        companyId: data.companyId,
      });

      return purchaseOrder;
    } catch (error) {
      Logger.error('Error creating purchase order', { error, data, userId });
      throw error;
    }
  }

  /**
   * Get all purchase orders with filters and pagination
   */
  static async getPurchaseOrders(filters: PurchaseOrderFilters): Promise<any> {
    try {
      const {
        companyId,
        branchId,
        supplierId,
        status,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      // Build where clause
      const where: any = { companyId };

      if (branchId) where.branchId = branchId;
      if (supplierId) where.supplierId = supplierId;
      if (status) where.status = status;

      if (startDate || endDate) {
        where.orderDate = {};
        if (startDate) where.orderDate.gte = startDate;
        if (endDate) where.orderDate.lte = endDate;
      }

      if (search) {
        where.OR = [
          { poNumber: { contains: search, mode: 'insensitive' } },
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { supplier: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      // Count total matching records
      const total = await prisma.purchaseOrder.count({ where });

      // Fetch purchase orders
      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          items: {
            include: {
              inventory: {
                select: {
                  id: true,
                  partNumber: true,
                  partName: true,
                  unit: true,
                },
              },
              item: {
                select: {
                  id: true,
                  itemCode: true,
                  itemName: true,
                  itemUnit: {
                    select: {
                      name: true,
                      symbol: true,
                    },
                  },
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              paymentMethod: true,
            },
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      });

      Logger.info('Purchase orders retrieved successfully', {
        companyId,
        count: purchaseOrders.length,
      });

      return {
        purchaseOrders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error retrieving purchase orders', { error, filters });
      throw error;
    }
  }

  /**
   * Get purchase order by ID
   */
  static async getPurchaseOrderById(id: string, companyId: string): Promise<any> {
    try {
      const purchaseOrder = await prisma.purchaseOrder.findFirst({
        where: { id, companyId },
        include: {
          supplier: true,
          branch: true,
          items: {
            include: {
              inventory: true, // Old structure
              item: true, // New structure
            },
          },
          payments: {
            include: {
              createdByUser: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              paymentDate: 'desc',
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

      if (!purchaseOrder) {
        throw new AppError(404, 'Purchase order not found');
      }

      Logger.info('Purchase order retrieved successfully', { id, companyId });

      return purchaseOrder;
    } catch (error) {
      Logger.error('Error retrieving purchase order', { error, id, companyId });
      throw error;
    }
  }

  /**
   * Update purchase order
   */
  static async updatePurchaseOrder(
    id: string,
    companyId: string,
    data: UpdatePurchaseOrderData,
    userId: string
  ): Promise<any> {
    try {
      // Check if purchase order exists
      const existingPO = await prisma.purchaseOrder.findFirst({
        where: { id, companyId },
        include: { items: true },
      });

      if (!existingPO) {
        throw new AppError(404, 'Purchase order not found');
      }

      // Can't update completed or cancelled orders
      if (
        existingPO.status === PurchaseOrderStatus.COMPLETED ||
        existingPO.status === PurchaseOrderStatus.CANCELLED
      ) {
        throw new AppError(400, `Cannot update ${existingPO.status.toLowerCase()} purchase order`);
      }

      const updateData: any = {};

      if (data.supplierId) updateData.supplierId = data.supplierId;
      if (data.orderDate) updateData.orderDate = new Date(data.orderDate);
      if (data.expectedDelivery) updateData.expectedDelivery = new Date(data.expectedDelivery);
      if (data.deliveryDate) updateData.deliveryDate = new Date(data.deliveryDate);
      if (data.invoiceNumber) updateData.invoiceNumber = data.invoiceNumber;
      if (data.invoiceDate) updateData.invoiceDate = new Date(data.invoiceDate);
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.status) updateData.status = data.status;

      // If items are being updated, recalculate totals
      if (data.items) {
        const { totalAmount, taxAmount, grandTotal } = this.calculateTotals(data.items);
        updateData.totalAmount = new Decimal(totalAmount);
        updateData.taxAmount = new Decimal(taxAmount);
        updateData.grandTotal = new Decimal(grandTotal);

        // Delete existing items and create new ones
        await prisma.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id },
        });

        updateData.items = {
          create: data.items.map((item) => {
            const itemTotal = item.quantity * item.unitPrice;
            const itemTax = itemTotal * (item.taxRate / 100);
            const itemGrandTotal = itemTotal + itemTax;

            return {
              itemId: item.itemId || undefined, // New structure
              inventoryId: item.inventoryId || undefined, // Old structure (backward compatibility)
              quantity: new Decimal(item.quantity),
              unitPrice: new Decimal(item.unitPrice),
              salesPrice: item.salesPrice ? new Decimal(item.salesPrice) : undefined,
              taxRate: new Decimal(item.taxRate),
              taxAmount: new Decimal(itemTax),
              totalAmount: new Decimal(itemGrandTotal),
              receivedQty: new Decimal(0),
            };
          }),
        };
      }

      const updatedPO = await prisma.purchaseOrder.update({
        where: { id },
        data: updateData,
        include: {
          supplier: true,
          branch: true,
          items: {
            include: {
              inventory: true, // Old structure
              item: true, // New structure
            },
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      Logger.info('Purchase order updated successfully', { id, userId, companyId });

      return updatedPO;
    } catch (error) {
      Logger.error('Error updating purchase order', { error, id, data, userId });
      throw error;
    }
  }

  /**
   * Receive items and update stock
   */
  static async receiveItems(
    id: string,
    companyId: string,
    data: ReceiveItemsData,
    userId: string
  ): Promise<any> {
    try {
      const purchaseOrder = await prisma.purchaseOrder.findFirst({
        where: { id, companyId },
        include: { items: true },
      });

      if (!purchaseOrder) {
        throw new AppError(404, 'Purchase order not found');
      }

      if (purchaseOrder.status === PurchaseOrderStatus.CANCELLED) {
        throw new AppError(400, 'Cannot receive items for cancelled purchase order');
      }

      // Update received quantities and stock
      await prisma.$transaction(async (tx) => {
        for (const item of data.items) {
          const poItem = purchaseOrder.items.find((i) => i.id === item.itemId);
          if (!poItem) {
            throw new AppError(404, `Purchase order item ${item.itemId} not found`);
          }

          const newReceivedQty = parseFloat(poItem.receivedQty.toString()) + item.receivedQty;
          const totalQty = parseFloat(poItem.quantity.toString());

          if (newReceivedQty > totalQty) {
            throw new AppError(
              400,
              `Cannot receive more than ordered quantity for item ${item.itemId}`
            );
          }

          // Update received quantity
          await tx.purchaseOrderItem.update({
            where: { id: item.itemId },
            data: { receivedQty: new Decimal(newReceivedQty) },
          });

          // Handle both new (itemId) and old (inventoryId) structures
          if (poItem.itemId) {
            // New structure: Update or create BranchInventory
            const existingBranchInventory = await tx.branchInventory.findFirst({
              where: {
                itemId: poItem.itemId,
                branchId: purchaseOrder.branchId,
              },
            });

            if (existingBranchInventory) {
              // Update existing branch inventory
              const previousQty = parseFloat(existingBranchInventory.stockQuantity.toString());
              const newQty = previousQty + item.receivedQty;

              await tx.branchInventory.update({
                where: { id: existingBranchInventory.id },
                data: {
                  stockQuantity: new Decimal(newQty),
                  lastPurchasePrice: new Decimal(parseFloat(poItem.unitPrice.toString())),
                  lastPurchaseDate: new Date(),
                },
              });

              // Create stock movement record for new structure
              await tx.stockMovement.create({
                data: {
                  branchInventoryId: existingBranchInventory.id,
                  movementType: StockMovementType.PURCHASE,
                  quantity: new Decimal(item.receivedQty),
                  previousQty: new Decimal(previousQty),
                  newQty: new Decimal(newQty),
                  referenceType: 'PurchaseOrder',
                  referenceId: purchaseOrder.id,
                  notes: `Received from PO ${purchaseOrder.poNumber}`,
                  userId,
                  branchId: purchaseOrder.branchId,
                  companyId: purchaseOrder.companyId,
                },
              });
            } else {
              // Create new branch inventory entry
              const newBranchInventory = await tx.branchInventory.create({
                data: {
                  itemId: poItem.itemId,
                  branchId: purchaseOrder.branchId,
                  companyId: purchaseOrder.companyId,
                  stockQuantity: new Decimal(item.receivedQty),
                  lastPurchasePrice: new Decimal(parseFloat(poItem.unitPrice.toString())),
                  lastPurchaseDate: new Date(),
                  supplierId: purchaseOrder.supplierId,
                },
              });

              // Create opening stock movement
              await tx.stockMovement.create({
                data: {
                  branchInventoryId: newBranchInventory.id,
                  movementType: StockMovementType.PURCHASE,
                  quantity: new Decimal(item.receivedQty),
                  previousQty: new Decimal(0),
                  newQty: new Decimal(item.receivedQty),
                  referenceType: 'PurchaseOrder',
                  referenceId: purchaseOrder.id,
                  notes: `Received from PO ${purchaseOrder.poNumber} (Initial stock)`,
                  userId,
                  branchId: purchaseOrder.branchId,
                  companyId: purchaseOrder.companyId,
                },
              });
            }
          } else if (poItem.inventoryId) {
            // Old structure: Update Inventory (backward compatibility)
            const currentInventory = await tx.inventory.findUnique({
              where: { id: poItem.inventoryId },
              select: { stockQuantity: true },
            });

            if (!currentInventory) {
              throw new AppError(404, `Inventory item ${poItem.inventoryId} not found`);
            }

            const previousQty = parseFloat(currentInventory.stockQuantity.toString());
            const newQty = previousQty + item.receivedQty;

            // Update inventory stock
            await tx.inventory.update({
              where: { id: poItem.inventoryId },
              data: {
                stockQuantity: {
                  increment: new Decimal(item.receivedQty),
                },
              },
            });

            // Create stock movement record for old structure
            await StockMovementService.logStockMovement({
              inventoryId: poItem.inventoryId,
              branchId: purchaseOrder.branchId,
              companyId: purchaseOrder.companyId,
              quantity: item.receivedQty,
              previousQty,
              newQty,
              movementType: StockMovementType.PURCHASE,
              notes: `Received from PO ${purchaseOrder.poNumber}`,
              referenceType: 'PurchaseOrder',
              referenceId: purchaseOrder.id,
              userId,
            }, tx);
          }
        }

        // Update PO status based on received items
        const allItems = await tx.purchaseOrderItem.findMany({
          where: { purchaseOrderId: id },
        });

        const allReceived = allItems.every(
          (item) =>
            parseFloat(item.receivedQty.toString()) === parseFloat(item.quantity.toString())
        );
        const someReceived = allItems.some(
          (item) => parseFloat(item.receivedQty.toString()) > 0
        );

        let newStatus = purchaseOrder.status;
        if (allReceived) {
          newStatus = PurchaseOrderStatus.RECEIVED;
        } else if (someReceived) {
          newStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED;
        }

        await tx.purchaseOrder.update({
          where: { id },
          data: {
            status: newStatus,
            deliveryDate: data.deliveryDate || (allReceived ? new Date() : undefined),
          },
        });
      });

      const updatedPO = await this.getPurchaseOrderById(id, companyId);

      Logger.info('Purchase order items received successfully', { id, userId, companyId });

      return updatedPO;
    } catch (error) {
      Logger.error('Error receiving purchase order items', { error, id, data, userId });
      throw error;
    }
  }

  /**
   * Update purchase order status
   */
  static async updateStatus(
    id: string,
    companyId: string,
    status: PurchaseOrderStatus
  ): Promise<any> {
    try {
      const purchaseOrder = await prisma.purchaseOrder.findFirst({
        where: { id, companyId },
      });

      if (!purchaseOrder) {
        throw new AppError(404, 'Purchase order not found');
      }

      const updatedPO = await prisma.purchaseOrder.update({
        where: { id },
        data: { status },
        include: {
          supplier: true,
          branch: true,
          items: {
            include: {
              inventory: true, // Old structure
              item: true, // New structure
            },
          },
        },
      });

      Logger.info('Purchase order status updated successfully', { id, status, companyId });

      return updatedPO;
    } catch (error) {
      Logger.error('Error updating purchase order status', { error, id, status });
      throw error;
    }
  }

  /**
   * Delete purchase order
   */
  static async deletePurchaseOrder(id: string, companyId: string): Promise<void> {
    try {
      const purchaseOrder = await prisma.purchaseOrder.findFirst({
        where: { id, companyId },
        include: { payments: true, items: true },
      });

      if (!purchaseOrder) {
        throw new AppError(404, 'Purchase order not found');
      }

      // Can't delete if has payments or items are received
      if (purchaseOrder.payments.length > 0) {
        throw new AppError(400, 'Cannot delete purchase order with payments');
      }

      const hasReceivedItems = purchaseOrder.items.some(
        (item) => parseFloat(item.receivedQty.toString()) > 0
      );

      if (hasReceivedItems) {
        throw new AppError(400, 'Cannot delete purchase order with received items');
      }

      await prisma.purchaseOrder.delete({
        where: { id },
      });

      Logger.info('Purchase order deleted successfully', { id, companyId });
    } catch (error) {
      Logger.error('Error deleting purchase order', { error, id, companyId });
      throw error;
    }
  }

  /**
   * Get supplier outstanding balance
   */
  static async getSupplierOutstanding(
    supplierId: string,
    companyId: string,
    branchId?: string
  ): Promise<{
    totalPurchases: number;
    totalPaid: number;
    outstanding: number;
  }> {
    try {
      const where: any = {
        supplierId,
        companyId,
        status: {
          not: PurchaseOrderStatus.CANCELLED,
        },
      };

      if (branchId) where.branchId = branchId;

      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where,
        select: {
          grandTotal: true,
          paidAmount: true,
        },
      });

      const totalPurchases = purchaseOrders.reduce(
        (sum, po) => sum + parseFloat(po.grandTotal.toString()),
        0
      );

      const totalPaid = purchaseOrders.reduce(
        (sum, po) => sum + parseFloat(po.paidAmount.toString()),
        0
      );

      const outstanding = totalPurchases - totalPaid;

      Logger.info('Supplier outstanding calculated successfully', {
        supplierId,
        companyId,
        branchId,
      });

      return { totalPurchases, totalPaid, outstanding };
    } catch (error) {
      Logger.error('Error calculating supplier outstanding', { error, supplierId, companyId });
      throw error;
    }
  }

  /**
   * Get purchase order summary statistics
   */
  static async getPurchaseOrderSummary(companyId: string, branchId?: string) {
    try {
      const where: any = {
        companyId,
      };

      if (branchId) where.branchId = branchId;

      // Get total count
      const totalCount = await prisma.purchaseOrder.count({
        where,
      });

      // Get purchase orders with amounts
      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where,
        select: {
          grandTotal: true,
          paidAmount: true,
        },
      });

      // Calculate totals
      const totalAmount = purchaseOrders.reduce(
        (sum, po) => sum + parseFloat(po.grandTotal.toString()),
        0
      );

      const totalPaid = purchaseOrders.reduce(
        (sum, po) => sum + parseFloat(po.paidAmount.toString()),
        0
      );

      const pendingAmount = totalAmount - totalPaid;

      Logger.info('Purchase order summary retrieved successfully', {
        companyId,
        branchId,
        totalCount,
      });

      return {
        totalCount,
        totalAmount,
        totalPaid,
        pendingAmount,
      };
    } catch (error) {
      Logger.error('Error getting purchase order summary', { error, companyId, branchId });
      throw error;
    }
  }
}
