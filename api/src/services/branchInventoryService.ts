import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { StockMovementType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface AddItemToBranchData {
  itemId: string;
  branchId: string;
  companyId: string;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  supplierId?: string;
  lastPurchasePrice?: number;
  lastPurchaseDate?: Date;
  userId: string; // For stock movement tracking
}

interface UpdateBranchInventoryData {
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  supplierId?: string;
  isActive?: boolean;
}

interface AdjustStockData {
  branchInventoryId: string;
  quantity: number;
  movementType: StockMovementType;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
  userId: string;
  branchId: string;
  companyId: string;
}

interface BranchInventoryFilters {
  companyId: string;
  branchId?: string;
  itemId?: string;
  search?: string;
  stockStatus?: 'all' | 'low' | 'out' | 'normal';
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class BranchInventoryService {
  /**
   * Get all branch inventories with filters and pagination
   */
  static async getAllBranchInventories(filters: BranchInventoryFilters) {
    try {
      const {
        companyId,
        branchId,
        itemId,
        search,
        stockStatus = 'all',
        isActive,
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { companyId };

      if (branchId) {
        where.branchId = branchId;
      }

      if (itemId) {
        where.itemId = itemId;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      // Stock status filters
      if (stockStatus === 'out') {
        where.stockQuantity = { lte: 0 };
      } else if (stockStatus === 'low') {
        where.AND = [
          { stockQuantity: { gt: 0 } },
          {
            OR: [
              { stockQuantity: { lte: prisma.branchInventory.fields.reorderLevel } },
              { stockQuantity: { lte: prisma.branchInventory.fields.minStockLevel } },
            ],
          },
        ];
      } else if (stockStatus === 'normal') {
        where.stockQuantity = { gt: 0 };
      }

      if (search) {
        where.item = {
          OR: [
            { itemName: { contains: search, mode: 'insensitive' } },
            { itemCode: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        };
      }

      // Get branch inventories
      const inventories = await prisma.branchInventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          item: {
            include: {
              itemCategory: {
                select: { id: true, name: true },
              },
              itemUnit: {
                select: { id: true, name: true, symbol: true },
              },
              itemGSTRate: {
                select: { id: true, rate: true },
              },
              itemBrand: {
                select: { id: true, name: true },
              },
              itemModel: {
                select: { id: true, name: true },
              },
            },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
          supplier: {
            select: { id: true, name: true, supplierCode: true },
          },
          _count: {
            select: { stockMovements: true },
          },
        },
      });

      // Get total count
      const total = await prisma.branchInventory.count({ where });

      return {
        inventories: inventories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error getting branch inventories', error);
      throw error;
    }
  }

  /**
   * Get branch inventory by ID
   */
  static async getBranchInventoryById(id: string, companyId: string) {
    try {
      const inventory = await prisma.branchInventory.findFirst({
        where: { id, companyId },
        include: {
          item: {
            include: {
              itemCategory: true,
              itemUnit: true,
              itemGSTRate: true,
              itemBrand: true,
              itemModel: true,
            },
          },
          branch: true,
          supplier: true,
          stockMovements: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (!inventory) {
        throw new AppError(404, 'Branch inventory not found');
      }

      return inventory;
    } catch (error) {
      Logger.error('Error getting branch inventory by ID', error);
      throw error;
    }
  }

  /**
   * Add an item to branch inventory
   */
  static async addItemToBranch(data: AddItemToBranchData) {
    try {
      const {
        itemId,
        branchId,
        companyId,
        stockQuantity = 0,
        minStockLevel,
        maxStockLevel,
        reorderLevel,
        supplierId,
        lastPurchasePrice,
        lastPurchaseDate,
        userId,
      } = data;

      // Check if item exists
      const item = await prisma.item.findFirst({
        where: { id: itemId, companyId },
      });

      if (!item) {
        throw new AppError(404, 'Item not found');
      }

      // Check if branch exists
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, companyId },
      });

      if (!branch) {
        throw new AppError(404, 'Branch not found');
      }

      // Check if item already exists in this branch
      const existingInventory = await prisma.branchInventory.findFirst({
        where: { itemId, branchId },
      });

      if (existingInventory) {
        throw new AppError(400, 'This item is already in the branch inventory');
      }

      // Create branch inventory
      const branchInventory = await prisma.branchInventory.create({
        data: {
          itemId,
          branchId,
          companyId,
          stockQuantity: new Decimal(stockQuantity),
          minStockLevel: minStockLevel ? new Decimal(minStockLevel) : null,
          maxStockLevel: maxStockLevel ? new Decimal(maxStockLevel) : null,
          reorderLevel: reorderLevel ? new Decimal(reorderLevel) : null,
          supplierId,
          lastPurchasePrice: lastPurchasePrice ? new Decimal(lastPurchasePrice) : null,
          lastPurchaseDate,
        },
        include: {
          item: true,
          branch: true,
        },
      });

      // Create stock movement for opening stock if quantity > 0
      if (stockQuantity > 0) {
        await prisma.stockMovement.create({
          data: {
            branchInventoryId: branchInventory.id,
            movementType: StockMovementType.OPENING_STOCK,
            quantity: new Decimal(stockQuantity),
            previousQty: new Decimal(0),
            newQty: new Decimal(stockQuantity),
            notes: 'Opening stock when adding item to branch',
            userId,
            branchId,
            companyId,
          },
        });
      }

      Logger.info('Item added to branch inventory', {
        branchInventoryId: branchInventory.id,
        itemId,
        branchId,
      });

      return branchInventory;
    } catch (error) {
      Logger.error('Error adding item to branch', error);
      throw error;
    }
  }

  /**
   * Update branch inventory settings
   */
  static async updateBranchInventory(id: string, companyId: string, data: UpdateBranchInventoryData) {
    try {
      // Check if branch inventory exists
      const existing = await prisma.branchInventory.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Branch inventory not found');
      }

      // Prepare update data
      const updateData: any = { ...data };
      if (data.minStockLevel !== undefined) {
        updateData.minStockLevel = data.minStockLevel ? new Decimal(data.minStockLevel) : null;
      }
      if (data.maxStockLevel !== undefined) {
        updateData.maxStockLevel = data.maxStockLevel ? new Decimal(data.maxStockLevel) : null;
      }
      if (data.reorderLevel !== undefined) {
        updateData.reorderLevel = data.reorderLevel ? new Decimal(data.reorderLevel) : null;
      }

      // Update branch inventory
      const branchInventory = await prisma.branchInventory.update({
        where: { id },
        data: updateData,
        include: {
          item: true,
          branch: true,
        },
      });

      Logger.info('Branch inventory updated', { branchInventoryId: id });
      return branchInventory;
    } catch (error) {
      Logger.error('Error updating branch inventory', error);
      throw error;
    }
  }

  /**
   * Adjust stock quantity (used for manual adjustments, not purchases/sales)
   */
  static async adjustStock(data: AdjustStockData) {
    try {
      const {
        branchInventoryId,
        quantity,
        movementType,
        notes,
        referenceType,
        referenceId,
        userId,
        branchId,
        companyId,
      } = data;

      // Get current branch inventory
      const branchInventory = await prisma.branchInventory.findFirst({
        where: { id: branchInventoryId, companyId },
      });

      if (!branchInventory) {
        throw new AppError(404, 'Branch inventory not found');
      }

      const currentQty = Number(branchInventory.stockQuantity);
      let newQty = currentQty;

      // Calculate new quantity based on movement type
      if (
        movementType === StockMovementType.PURCHASE ||
        movementType === StockMovementType.RETURN ||
        movementType === StockMovementType.ADJUSTMENT
      ) {
        newQty = currentQty + quantity;
      } else if (
        movementType === StockMovementType.SALE ||
        movementType === StockMovementType.SERVICE_USE ||
        movementType === StockMovementType.DAMAGE
      ) {
        newQty = currentQty - quantity;
      }

      // Validate new quantity
      if (newQty < 0) {
        throw new AppError(400, 'Insufficient stock quantity');
      }

      // Update stock quantity and create movement in transaction
      const result = await prisma.$transaction([
        // Update branch inventory
        prisma.branchInventory.update({
          where: { id: branchInventoryId },
          data: { stockQuantity: new Decimal(newQty) },
        }),
        // Create stock movement
        prisma.stockMovement.create({
          data: {
            branchInventoryId,
            movementType,
            quantity: new Decimal(Math.abs(quantity)),
            previousQty: new Decimal(currentQty),
            newQty: new Decimal(newQty),
            referenceType,
            referenceId,
            notes,
            userId,
            branchId,
            companyId,
          },
        }),
      ]);

      Logger.info('Stock adjusted', {
        branchInventoryId,
        movementType,
        quantity,
        newQty,
      });

      return result[0]; // Return updated branch inventory
    } catch (error) {
      Logger.error('Error adjusting stock', error);
      throw error;
    }
  }

  /**
   * Remove item from branch (soft delete)
   */
  static async removeItemFromBranch(id: string, companyId: string) {
    try {
      // Check if branch inventory exists
      const existing = await prisma.branchInventory.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Branch inventory not found');
      }

      // Check if there's stock
      const currentStock = Number(existing.stockQuantity);
      if (currentStock > 0) {
        throw new AppError(
          400,
          `Cannot remove item with stock quantity of ${currentStock}. Please adjust stock to zero first.`
        );
      }

      // Deactivate branch inventory
      const branchInventory = await prisma.branchInventory.update({
        where: { id },
        data: { isActive: false },
      });

      Logger.info('Item removed from branch', { branchInventoryId: id });
      return branchInventory;
    } catch (error) {
      Logger.error('Error removing item from branch', error);
      throw error;
    }
  }

  /**
   * Get low stock items for a branch
   */
  static async getLowStockItems(branchId: string, companyId: string) {
    try {
      const lowStockItems = await prisma.branchInventory.findMany({
        where: {
          branchId,
          companyId,
          isActive: true,
          AND: [
            { stockQuantity: { gt: 0 } },
            {
              OR: [
                {
                  AND: [
                    { reorderLevel: { not: null } },
                    { stockQuantity: { lte: prisma.branchInventory.fields.reorderLevel } },
                  ],
                },
                {
                  AND: [
                    { minStockLevel: { not: null } },
                    { stockQuantity: { lte: prisma.branchInventory.fields.minStockLevel } },
                  ],
                },
              ],
            },
          ],
        },
        include: {
          item: {
            select: {
              id: true,
              itemCode: true,
              itemName: true,
              itemUnit: {
                select: { name: true, symbol: true },
              },
            },
          },
        },
        orderBy: { stockQuantity: 'asc' },
      });

      return lowStockItems;
    } catch (error) {
      Logger.error('Error getting low stock items', error);
      throw error;
    }
  }

  /**
   * Get out of stock items for a branch
   */
  static async getOutOfStockItems(branchId: string, companyId: string) {
    try {
      const outOfStockItems = await prisma.branchInventory.findMany({
        where: {
          branchId,
          companyId,
          isActive: true,
          stockQuantity: { lte: 0 },
        },
        include: {
          item: {
            select: {
              id: true,
              itemCode: true,
              itemName: true,
              itemUnit: {
                select: { name: true, symbol: true },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return outOfStockItems;
    } catch (error) {
      Logger.error('Error getting out of stock items', error);
      throw error;
    }
  }

  /**
   * Get branch inventory dropdown (for forms)
   */
  static async getBranchInventoryDropdown(branchId: string, companyId: string) {
    try {
      const inventories = await prisma.branchInventory.findMany({
        where: {
          branchId,
          companyId,
          isActive: true,
          stockQuantity: { gt: 0 },
        },
        select: {
          id: true,
          stockQuantity: true,
          item: {
            select: {
              id: true,
              itemCode: true,
              itemName: true,
              salesPrice: true,
              itemUnit: {
                select: { name: true, symbol: true },
              },
            },
          },
        },
        orderBy: { item: { itemName: 'asc' } },
      });

      return inventories;
    } catch (error) {
      Logger.error('Error getting branch inventory dropdown', error);
      throw error;
    }
  }
}
