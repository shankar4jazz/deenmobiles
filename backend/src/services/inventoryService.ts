import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { StockMovementService } from './stockMovementService';
import { InventoryCategory, GSTRate, TaxType, Unit, StockMovementType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateInventoryData {
  partNumber?: string;
  partName: string;
  description?: string;
  modelVariant?: string;
  brandName?: string;
  category?: InventoryCategory;
  unit: Unit;
  purchasePrice: number;
  salesPrice: number;
  hsnCode: string;
  gstRate: GSTRate;
  taxType: TaxType;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  supplierId?: string;
  supplierInvoiceNumber?: string;
  purchaseDate?: Date;
  billAttachmentUrl?: string;
  active?: boolean;
  branchId: string;
  companyId: string;
}

interface UpdateInventoryData {
  partNumber?: string;
  partName?: string;
  description?: string;
  modelVariant?: string;
  brandName?: string;
  category?: InventoryCategory;
  unit?: Unit;
  purchasePrice?: number;
  salesPrice?: number;
  hsnCode?: string;
  gstRate?: GSTRate;
  taxType?: TaxType;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  supplierId?: string;
  supplierInvoiceNumber?: string;
  purchaseDate?: Date;
  billAttachmentUrl?: string;
  active?: boolean;
  branchId?: string;
}

interface InventoryFilters {
  companyId: string;
  branchId?: string;
  search?: string;
  category?: InventoryCategory;
  brandName?: string;
  gstRate?: GSTRate;
  stockStatus?: 'all' | 'low' | 'out';
  active?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface StockAdjustmentData {
  quantity: number;
  movementType: StockMovementType;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
  userId: string;
}

export class InventoryService {
  /**
   * Generate a unique part number
   */
  private static async generatePartNumber(companyId: string, branchId: string): Promise<string> {
    try {
      // Get branch code
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { code: true },
      });

      if (!branch) {
        throw new AppError(404, 'Branch not found');
      }

      // Get count of inventory items for this branch
      const count = await prisma.inventory.count({
        where: { branchId },
      });

      // Generate code like BRN-0001, BRN-0002, etc.
      const code = `${branch.code}-${(count + 1).toString().padStart(4, '0')}`;

      // Check if code already exists
      const existing = await prisma.inventory.findUnique({
        where: { partNumber: code },
      });

      if (existing) {
        // If exists, add timestamp
        return `${branch.code}-${Date.now()}`;
      }

      return code;
    } catch (error) {
      Logger.error('Error generating part number', { error, companyId, branchId });
      // Fallback to timestamp-based code
      return `PART-${Date.now()}`;
    }
  }

  /**
   * Calculate GST amount based on price and GST rate
   */
  static calculateGST(price: number, gstRate: GSTRate): {
    gstPercentage: number;
    gstAmount: number;
    totalWithGST: number;
  } {
    const gstPercentageMap = {
      ZERO: 0,
      FIVE: 5,
      TWELVE: 12,
      EIGHTEEN: 18,
      TWENTY_EIGHT: 28,
    };

    const gstPercentage = gstPercentageMap[gstRate];
    const gstAmount = (price * gstPercentage) / 100;
    const totalWithGST = price + gstAmount;

    return {
      gstPercentage,
      gstAmount,
      totalWithGST,
    };
  }

  /**
   * Create a new inventory item
   */
  static async createInventory(data: CreateInventoryData, userId: string) {
    try {
      // Verify company and branch
      const branch = await prisma.branch.findFirst({
        where: {
          id: data.branchId,
          companyId: data.companyId,
        },
      });

      if (!branch) {
        throw new AppError(404, 'Branch not found');
      }

      // Generate part number if not provided
      const partNumber = data.partNumber || await this.generatePartNumber(data.companyId, data.branchId);

      // Check if part number already exists
      const existingPart = await prisma.inventory.findUnique({
        where: { partNumber },
      });

      if (existingPart) {
        throw new AppError(400, 'Part number already exists');
      }

      // Verify supplier if provided
      if (data.supplierId) {
        const supplier = await prisma.supplier.findFirst({
          where: {
            id: data.supplierId,
            companyId: data.companyId,
          },
        });

        if (!supplier) {
          throw new AppError(404, 'Supplier not found');
        }
      }

      const initialStock = data.stockQuantity || 0;

      // Create inventory using transaction
      const inventory = await prisma.$transaction(async (tx) => {
        // Create inventory item
        const newInventory = await tx.inventory.create({
          data: {
            ...data,
            partNumber,
            stockQuantity: initialStock,
          },
          include: {
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
                code: true,
              },
            },
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Log stock movement if initial stock > 0
        if (initialStock > 0) {
          await StockMovementService.logStockMovement(
            {
              inventoryId: newInventory.id,
              movementType: StockMovementType.OPENING_STOCK,
              quantity: initialStock,
              previousQty: 0,
              newQty: initialStock,
              notes: 'Initial stock entry',
              userId,
              branchId: data.branchId,
              companyId: data.companyId,
            },
            tx
          );
        }

        return newInventory;
      });

      Logger.info('Inventory item created successfully', {
        inventoryId: inventory.id,
        partNumber: inventory.partNumber,
        companyId: data.companyId,
      });

      return inventory;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error creating inventory', { error, data });
      throw new AppError(500, 'Failed to create inventory item');
    }
  }

  /**
   * Get all inventory items with filters and pagination
   */
  static async getInventories(filters: InventoryFilters) {
    try {
      const {
        companyId,
        branchId,
        search,
        category,
        brandName,
        gstRate,
        stockStatus,
        active,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        companyId,
      };

      if (branchId) {
        where.branchId = branchId;
      }

      if (typeof active === 'boolean') {
        where.active = active;
      }

      if (category) {
        where.category = category;
      }

      if (brandName) {
        where.brandName = { contains: brandName, mode: 'insensitive' };
      }

      if (gstRate) {
        where.gstRate = gstRate;
      }

      if (search) {
        where.OR = [
          { partNumber: { contains: search, mode: 'insensitive' } },
          { partName: { contains: search, mode: 'insensitive' } },
          { brandName: { contains: search, mode: 'insensitive' } },
          { hsnCode: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Handle stock status filter
      if (stockStatus === 'out') {
        where.stockQuantity = { lte: 0 };
      } else if (stockStatus === 'low') {
        where.OR = [
          {
            AND: [
              { minStockLevel: { not: null } },
              { stockQuantity: { lte: prisma.inventory.fields.minStockLevel, gt: 0 } },
            ],
          },
          {
            AND: [
              { reorderLevel: { not: null } },
              { stockQuantity: { lte: prisma.inventory.fields.reorderLevel, gt: 0 } },
            ],
          },
        ];
      }

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get inventory items and total count
      const [inventories, total] = await Promise.all([
        prisma.inventory.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                supplierCode: true,
                phone: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            itemGSTRate: {
              select: {
                id: true,
                name: true,
                rate: true,
              },
            },
            _count: {
              select: { stockMovements: true },
            },
          },
        }),
        prisma.inventory.count({ where }),
      ]);

      return {
        inventories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching inventories', { error, filters });
      throw new AppError(500, 'Failed to fetch inventories');
    }
  }

  /**
   * Get a single inventory item by ID
   */
  static async getInventoryById(id: string, companyId: string) {
    try {
      const inventory = await prisma.inventory.findFirst({
        where: {
          id,
          companyId,
        },
        include: {
          supplier: true,
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { stockMovements: true },
          },
        },
      });

      if (!inventory) {
        throw new AppError(404, 'Inventory item not found');
      }

      return inventory;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error fetching inventory by ID', { error, id, companyId });
      throw new AppError(500, 'Failed to fetch inventory item');
    }
  }

  /**
   * Update an inventory item
   */
  static async updateInventory(
    id: string,
    companyId: string,
    data: UpdateInventoryData,
    userId: string
  ) {
    try {
      // Check if inventory exists
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          id,
          companyId,
        },
      });

      if (!existingInventory) {
        throw new AppError(404, 'Inventory item not found');
      }

      // Check if part number is being changed and if it already exists
      if (data.partNumber && data.partNumber !== existingInventory.partNumber) {
        const duplicatePartNumber = await prisma.inventory.findUnique({
          where: { partNumber: data.partNumber },
        });

        if (duplicatePartNumber) {
          throw new AppError(400, 'Part number already exists');
        }
      }

      // Verify supplier if being changed
      if (data.supplierId && data.supplierId !== existingInventory.supplierId) {
        const supplier = await prisma.supplier.findFirst({
          where: {
            id: data.supplierId,
            companyId,
          },
        });

        if (!supplier) {
          throw new AppError(404, 'Supplier not found');
        }
      }

      // Update inventory
      const inventory = await prisma.inventory.update({
        where: { id },
        data,
        include: {
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
              code: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { stockMovements: true },
          },
        },
      });

      Logger.info('Inventory item updated successfully', {
        inventoryId: id,
        companyId,
      });

      return inventory;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error updating inventory', { error, id, data });
      throw new AppError(500, 'Failed to update inventory item');
    }
  }

  /**
   * Adjust stock quantity (manual adjustment)
   */
  static async adjustStock(
    id: string,
    companyId: string,
    adjustmentData: StockAdjustmentData
  ) {
    try {
      // Get inventory item
      const inventory = await prisma.inventory.findFirst({
        where: {
          id,
          companyId,
        },
      });

      if (!inventory) {
        throw new AppError(404, 'Inventory item not found');
      }

      const previousQty = parseFloat(inventory.stockQuantity.toString());
      const adjustment = adjustmentData.quantity;
      let newQty: number;

      // Calculate new quantity based on movement type
      switch (adjustmentData.movementType) {
        case StockMovementType.PURCHASE:
        case StockMovementType.RETURN:
        case StockMovementType.ADJUSTMENT:
          newQty = previousQty + adjustment;
          break;
        case StockMovementType.SALE:
        case StockMovementType.SERVICE_USE:
        case StockMovementType.DAMAGE:
        case StockMovementType.TRANSFER:
          newQty = previousQty - adjustment;
          break;
        default:
          newQty = adjustment; // For OPENING_STOCK or direct set
      }

      // Prevent negative stock
      if (newQty < 0) {
        throw new AppError(400, 'Insufficient stock quantity');
      }

      // Update stock in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update inventory
        const updatedInventory = await tx.inventory.update({
          where: { id },
          data: { stockQuantity: newQty },
          include: {
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
                code: true,
              },
            },
          },
        });

        // Log stock movement
        await StockMovementService.logStockMovement(
          {
            inventoryId: id,
            movementType: adjustmentData.movementType,
            quantity: adjustment,
            previousQty,
            newQty,
            notes: adjustmentData.notes,
            referenceType: adjustmentData.referenceType,
            referenceId: adjustmentData.referenceId,
            userId: adjustmentData.userId,
            branchId: inventory.branchId,
            companyId,
          },
          tx
        );

        return updatedInventory;
      });

      Logger.info('Stock adjusted successfully', {
        inventoryId: id,
        previousQty,
        newQty,
        adjustment,
        movementType: adjustmentData.movementType,
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error adjusting stock', { error, id, adjustmentData });
      throw new AppError(500, 'Failed to adjust stock');
    }
  }

  /**
   * Delete an inventory item (soft delete)
   */
  static async deleteInventory(id: string, companyId: string) {
    try {
      // Check if inventory exists
      const inventory = await prisma.inventory.findFirst({
        where: {
          id,
          companyId,
        },
        include: {
          _count: {
            select: { stockMovements: true },
          },
        },
      });

      if (!inventory) {
        throw new AppError(404, 'Inventory item not found');
      }

      // Check if has stock movements (audit trail)
      if (inventory._count.stockMovements > 0) {
        // Soft delete
        const updatedInventory = await prisma.inventory.update({
          where: { id },
          data: { active: false },
        });

        Logger.info('Inventory item soft deleted (has stock movements)', {
          inventoryId: id,
          companyId,
          movementsCount: inventory._count.stockMovements,
        });

        return {
          inventory: updatedInventory,
          message: 'Inventory item deactivated successfully (has transaction history)',
        };
      }

      // Hard delete if no stock movements
      await prisma.inventory.delete({
        where: { id },
      });

      Logger.info('Inventory item deleted successfully', {
        inventoryId: id,
        companyId,
      });

      return {
        inventory: null,
        message: 'Inventory item deleted successfully',
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error deleting inventory', { error, id, companyId });
      throw new AppError(500, 'Failed to delete inventory item');
    }
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems(companyId: string, branchId?: string) {
    try {
      return await StockMovementService.getLowStockAlerts(companyId, branchId);
    } catch (error) {
      Logger.error('Error fetching low stock items', { error, companyId, branchId });
      throw new AppError(500, 'Failed to fetch low stock items');
    }
  }

  /**
   * Get stock movement history for an inventory item
   */
  static async getStockMovementHistory(
    id: string,
    companyId: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      // Verify inventory exists
      const inventory = await this.getInventoryById(id, companyId);

      return await StockMovementService.getInventoryMovementHistory(id, companyId, page, limit);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error fetching stock movement history', { error, id, companyId });
      throw new AppError(500, 'Failed to fetch stock movement history');
    }
  }
}
