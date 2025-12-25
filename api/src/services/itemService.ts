import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { TaxType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateItemData {
  itemName: string;
  description?: string;
  modelVariant?: string;
  brandId?: string;
  modelId?: string;
  categoryId?: string;
  unitId?: string;
  purchasePrice?: number;
  salesPrice?: number;
  hsnCode?: string;
  gstRateId?: string;
  taxType?: TaxType;
  companyId: string;
  // Warranty fields
  warrantyDays?: number;
  warrantyType?: string;
}

interface UpdateItemData {
  itemName?: string;
  description?: string;
  modelVariant?: string;
  brandId?: string;
  modelId?: string;
  categoryId?: string;
  unitId?: string;
  purchasePrice?: number;
  salesPrice?: number;
  hsnCode?: string;
  gstRateId?: string;
  taxType?: TaxType;
  isActive?: boolean;
  // Warranty fields
  warrantyDays?: number;
  warrantyType?: string;
}

interface ItemFilters {
  companyId: string;
  search?: string;
  categoryId?: string;
  brandId?: string;
  modelId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ItemService {
  /**
   * Generate a unique item code
   */
  private static async generateItemCode(companyId: string): Promise<string> {
    try {
      // Get company initials
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });

      if (!company) {
        throw new AppError(404, 'Company not found');
      }

      // Get first 3 letters of company name
      const companyPrefix = company.name
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, '');

      // Get count of items for this company
      const count = await prisma.item.count({
        where: { companyId },
      });

      // Generate item code: PREFIX-0001
      const itemNumber = (count + 1).toString().padStart(4, '0');
      return `${companyPrefix}-ITM-${itemNumber}`;
    } catch (error) {
      Logger.error('Error generating item code', error);
      throw error;
    }
  }

  /**
   * Get all items with filters and pagination
   */
  static async getAllItems(filters: ItemFilters) {
    try {
      const {
        companyId,
        search,
        categoryId,
        brandId,
        modelId,
        isActive,
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { companyId };

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (brandId) {
        where.brandId = brandId;
      }

      if (modelId) {
        where.modelId = modelId;
      }

      if (search) {
        where.OR = [
          { itemName: { contains: search, mode: 'insensitive' } },
          { itemCode: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { hsnCode: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get items
      const items = await prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          itemCategory: {
            select: { id: true, name: true, code: true },
          },
          itemUnit: {
            select: { id: true, name: true, code: true, symbol: true },
          },
          itemGSTRate: {
            select: { id: true, name: true, rate: true },
          },
          itemBrand: {
            select: { id: true, name: true, code: true },
          },
          itemModel: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: {
              branchInventories: true,
              purchaseOrderItems: true,
            },
          },
        },
      });

      // Get total count
      const total = await prisma.item.count({ where });

      return {
        items: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error getting items', error);
      throw error;
    }
  }

  /**
   * Get item by ID
   */
  static async getItemById(id: string, companyId: string) {
    try {
      const item = await prisma.item.findFirst({
        where: { id, companyId },
        include: {
          itemCategory: {
            select: { id: true, name: true, code: true },
          },
          itemUnit: {
            select: { id: true, name: true, code: true, symbol: true },
          },
          itemGSTRate: {
            select: { id: true, name: true, rate: true },
          },
          itemBrand: {
            select: { id: true, name: true, code: true },
          },
          itemModel: {
            select: { id: true, name: true, code: true, brand: true },
          },
          branchInventories: {
            select: {
              id: true,
              stockQuantity: true,
              minStockLevel: true,
              maxStockLevel: true,
              reorderLevel: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
            orderBy: {
              branch: {
                name: 'asc',
              },
            },
          },
          _count: {
            select: {
              branchInventories: true,
              purchaseOrderItems: true,
            },
          },
        },
      });

      if (!item) {
        throw new AppError(404, 'Item not found');
      }

      return item;
    } catch (error) {
      Logger.error('Error getting item by ID', error);
      throw error;
    }
  }

  /**
   * Create a new item
   */
  static async createItem(data: CreateItemData) {
    try {
      const {
        itemName,
        description,
        modelVariant,
        brandId,
        modelId,
        categoryId,
        unitId,
        purchasePrice,
        salesPrice,
        hsnCode,
        gstRateId,
        taxType,
        companyId,
        warrantyDays,
        warrantyType,
      } = data;

      // Validate that item name doesn't already exist for this company
      const existingItem = await prisma.item.findFirst({
        where: {
          itemName: { equals: itemName, mode: 'insensitive' },
          companyId,
        },
      });

      if (existingItem) {
        throw new AppError(400, 'Item with this name already exists');
      }

      // Generate unique item code
      const itemCode = await this.generateItemCode(companyId);

      // Create item
      const item = await prisma.item.create({
        data: {
          itemCode,
          itemName,
          description,
          modelVariant,
          brandId,
          modelId,
          categoryId,
          unitId,
          purchasePrice: purchasePrice ? new Decimal(purchasePrice) : null,
          salesPrice: salesPrice ? new Decimal(salesPrice) : null,
          hsnCode,
          gstRateId,
          taxType,
          companyId,
          warrantyDays: warrantyDays || 0,
          warrantyType: warrantyType || 'NONE',
        },
        include: {
          itemCategory: {
            select: { id: true, name: true, code: true },
          },
          itemUnit: {
            select: { id: true, name: true, code: true, symbol: true },
          },
          itemGSTRate: {
            select: { id: true, name: true, rate: true },
          },
          itemBrand: {
            select: { id: true, name: true, code: true },
          },
          itemModel: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      Logger.info('Item created successfully', { itemId: item.id, itemCode: item.itemCode });
      return item;
    } catch (error) {
      Logger.error('Error creating item', error);
      throw error;
    }
  }

  /**
   * Update an item
   */
  static async updateItem(id: string, companyId: string, data: UpdateItemData) {
    try {
      // Check if item exists
      const existingItem = await prisma.item.findFirst({
        where: { id, companyId },
      });

      if (!existingItem) {
        throw new AppError(404, 'Item not found');
      }

      // If updating name, check for duplicates
      if (data.itemName) {
        const duplicateItem = await prisma.item.findFirst({
          where: {
            itemName: { equals: data.itemName, mode: 'insensitive' },
            companyId,
            id: { not: id },
          },
        });

        if (duplicateItem) {
          throw new AppError(400, 'Item with this name already exists');
        }
      }

      // Prepare update data
      const updateData: any = { ...data };
      if (data.purchasePrice !== undefined) {
        updateData.purchasePrice = data.purchasePrice ? new Decimal(data.purchasePrice) : null;
      }
      if (data.salesPrice !== undefined) {
        updateData.salesPrice = data.salesPrice ? new Decimal(data.salesPrice) : null;
      }
      // Handle warranty fields
      if (data.warrantyDays !== undefined) {
        updateData.warrantyDays = data.warrantyDays;
      }
      if (data.warrantyType !== undefined) {
        updateData.warrantyType = data.warrantyType;
      }

      // Update item
      const item = await prisma.item.update({
        where: { id },
        data: updateData,
        include: {
          itemCategory: {
            select: { id: true, name: true, code: true },
          },
          itemUnit: {
            select: { id: true, name: true, code: true, symbol: true },
          },
          itemGSTRate: {
            select: { id: true, name: true, rate: true },
          },
          itemBrand: {
            select: { id: true, name: true, code: true },
          },
          itemModel: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      Logger.info('Item updated successfully', { itemId: item.id });
      return item;
    } catch (error) {
      Logger.error('Error updating item', error);
      throw error;
    }
  }

  /**
   * Deactivate an item (soft delete)
   */
  static async deactivateItem(id: string, companyId: string) {
    try {
      // Check if item exists
      const existingItem = await prisma.item.findFirst({
        where: { id, companyId },
      });

      if (!existingItem) {
        throw new AppError(404, 'Item not found');
      }

      // Check if item is used in any branch inventories
      const branchInventoryCount = await prisma.branchInventory.count({
        where: { itemId: id, isActive: true },
      });

      if (branchInventoryCount > 0) {
        throw new AppError(
          400,
          `Cannot deactivate item. It is currently stocked in ${branchInventoryCount} branch(es)`
        );
      }

      // Deactivate item
      const item = await prisma.item.update({
        where: { id },
        data: { isActive: false },
      });

      Logger.info('Item deactivated successfully', { itemId: item.id });
      return item;
    } catch (error) {
      Logger.error('Error deactivating item', error);
      throw error;
    }
  }

  /**
   * Get items dropdown list (for selection in forms)
   */
  static async getItemsDropdown(companyId: string, filters?: { categoryId?: string; brandId?: string }) {
    try {
      const where: any = {
        companyId,
        isActive: true,
      };

      if (filters?.categoryId) {
        where.categoryId = filters.categoryId;
      }

      if (filters?.brandId) {
        where.brandId = filters.brandId;
      }

      const items = await prisma.item.findMany({
        where,
        select: {
          id: true,
          itemCode: true,
          itemName: true,
          salesPrice: true,
          purchasePrice: true,
          hsnCode: true,
          taxType: true,
          warrantyDays: true,
          warrantyType: true,
          itemUnit: {
            select: { name: true, symbol: true },
          },
          itemGSTRate: {
            select: { rate: true },
          },
          itemBrand: {
            select: { name: true },
          },
          itemModel: {
            select: { name: true },
          },
        },
        orderBy: { itemName: 'asc' },
      });

      return items;
    } catch (error) {
      Logger.error('Error getting items dropdown', error);
      throw error;
    }
  }

  /**
   * Check if an item name already exists
   */
  static async checkItemNameExists(
    itemName: string,
    companyId: string,
    excludeItemId?: string
  ): Promise<{ exists: boolean }> {
    try {
      const where: any = {
        itemName: { equals: itemName, mode: 'insensitive' },
        companyId,
      };

      if (excludeItemId) {
        where.id = { not: excludeItemId };
      }

      const existingItem = await prisma.item.findFirst({
        where,
        select: { id: true },
      });

      return { exists: !!existingItem };
    } catch (error) {
      Logger.error('Error checking item name', error);
      throw error;
    }
  }
}
