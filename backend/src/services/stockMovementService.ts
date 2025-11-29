import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { StockMovementType } from '@prisma/client';

interface LogStockMovementData {
  inventoryId: string;
  movementType: StockMovementType;
  quantity: number;
  previousQty: number;
  newQty: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  userId: string;
  branchId: string;
  companyId: string;
}

interface StockMovementFilters {
  inventoryId?: string;
  branchId?: string;
  companyId: string;
  movementType?: StockMovementType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class StockMovementService {
  /**
   * Log a stock movement and create activity log entry
   */
  static async logStockMovement(data: LogStockMovementData, tx?: any) {
    try {
      const prismaClient = tx || prisma;

      // Create stock movement record
      const stockMovement = await prismaClient.stockMovement.create({
        data: {
          inventoryId: data.inventoryId,
          movementType: data.movementType,
          quantity: data.quantity,
          previousQty: data.previousQty,
          newQty: data.newQty,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          notes: data.notes,
          userId: data.userId,
          branchId: data.branchId,
          companyId: data.companyId,
        },
        include: {
          inventory: {
            select: {
              partNumber: true,
              partName: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Create activity log entry
      await prismaClient.activityLog.create({
        data: {
          userId: data.userId,
          action: 'STOCK_MOVEMENT',
          entity: 'inventory',
          entityId: data.inventoryId,
          details: JSON.stringify({
            movementType: data.movementType,
            quantity: data.quantity,
            previousQty: data.previousQty,
            newQty: data.newQty,
            partName: stockMovement.inventory.partName,
            partNumber: stockMovement.inventory.partNumber,
            notes: data.notes,
          }),
        },
      });

      Logger.info('Stock movement logged successfully', {
        inventoryId: data.inventoryId,
        movementType: data.movementType,
        quantity: data.quantity,
        userId: data.userId,
      });

      return stockMovement;
    } catch (error) {
      Logger.error('Error logging stock movement', { error, data });
      throw new AppError(500, 'Failed to log stock movement');
    }
  }

  /**
   * Get stock movements with filters and pagination
   */
  static async getStockMovements(filters: StockMovementFilters) {
    try {
      const {
        inventoryId,
        branchId,
        companyId,
        movementType,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = filters;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        companyId,
      };

      if (inventoryId) {
        where.inventoryId = inventoryId;
      }

      if (branchId) {
        where.branchId = branchId;
      }

      if (movementType) {
        where.movementType = movementType;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = startDate;
        }
        if (endDate) {
          where.createdAt.lte = endDate;
        }
      }

      // Get stock movements and total count
      const [movements, total] = await Promise.all([
        prisma.stockMovement.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            inventory: {
              select: {
                partNumber: true,
                partName: true,
                brandName: true,
                unit: true,
              },
            },
            branchInventory: {
              select: {
                id: true,
                stockQuantity: true,
                item: {
                  select: {
                    itemName: true,
                    itemCode: true,
                    itemCategory: { select: { name: true } },
                    itemBrand: { select: { name: true } },
                    itemUnit: { select: { name: true, symbol: true } },
                  },
                },
              },
            },
            user: {
              select: {
                name: true,
                email: true,
                role: true,
                customRole: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            branch: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        }),
        prisma.stockMovement.count({ where }),
      ]);

      return {
        movements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching stock movements', { error, filters });
      throw new AppError(500, 'Failed to fetch stock movements');
    }
  }

  /**
   * Get stock movement history for a specific inventory item
   */
  static async getInventoryMovementHistory(
    inventoryId: string,
    companyId: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      return await this.getStockMovements({
        inventoryId,
        companyId,
        page,
        limit,
      });
    } catch (error) {
      Logger.error('Error fetching inventory movement history', {
        error,
        inventoryId,
        companyId,
      });
      throw new AppError(500, 'Failed to fetch inventory movement history');
    }
  }

  /**
   * Get stock movement summary for a branch or company
   */
  static async getStockMovementSummary(companyId: string, branchId?: string) {
    try {
      const where: any = { companyId };
      if (branchId) {
        where.branchId = branchId;
      }

      // Get summary by movement type
      const summary = await prisma.stockMovement.groupBy({
        by: ['movementType'],
        where,
        _sum: {
          quantity: true,
        },
        _count: {
          id: true,
        },
      });

      // Get total value changes (requires inventory data)
      const movements = await prisma.stockMovement.findMany({
        where,
        include: {
          inventory: {
            select: {
              purchasePrice: true,
            },
          },
        },
      });

      const totalValueChange = movements.reduce((acc, movement) => {
        const purchasePrice = movement.inventory?.purchasePrice ?? 0;
        const valueChange = parseFloat(movement.quantity.toString()) *
          parseFloat(purchasePrice.toString());
        return acc + valueChange;
      }, 0);

      return {
        summary: summary.map((item) => ({
          movementType: item.movementType,
          totalQuantity: item._sum.quantity,
          count: item._count.id,
        })),
        totalValueChange,
      };
    } catch (error) {
      Logger.error('Error fetching stock movement summary', { error, companyId, branchId });
      throw new AppError(500, 'Failed to fetch stock movement summary');
    }
  }

  /**
   * Get low stock alerts (items below min stock or reorder level)
   */
  static async getLowStockAlerts(companyId: string, branchId?: string) {
    try {
      const where: any = {
        companyId,
        active: true,
        OR: [
          {
            AND: [
              { minStockLevel: { not: null } },
              { stockQuantity: { lte: prisma.inventory.fields.minStockLevel } },
            ],
          },
          {
            AND: [
              { reorderLevel: { not: null } },
              { stockQuantity: { lte: prisma.inventory.fields.reorderLevel } },
            ],
          },
        ],
      };

      if (branchId) {
        where.branchId = branchId;
      }

      const lowStockItems = await prisma.inventory.findMany({
        where,
        select: {
          id: true,
          partNumber: true,
          partName: true,
          brandName: true,
          stockQuantity: true,
          minStockLevel: true,
          reorderLevel: true,
          unit: true,
          branch: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        orderBy: { stockQuantity: 'asc' },
      });

      return lowStockItems;
    } catch (error) {
      Logger.error('Error fetching low stock alerts', { error, companyId, branchId });
      throw new AppError(500, 'Failed to fetch low stock alerts');
    }
  }
}
