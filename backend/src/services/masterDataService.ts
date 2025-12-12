import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';

// ==================== Item Category Interfaces ====================
interface CreateCategoryData {
  name: string;
  code: string;
  description?: string;
  companyId: string;
}

interface UpdateCategoryData {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

// ==================== Item Unit Interfaces ====================
interface CreateUnitData {
  name: string;
  code: string;
  symbol?: string;
  description?: string;
  companyId: string;
}

interface UpdateUnitData {
  name?: string;
  code?: string;
  symbol?: string;
  description?: string;
  isActive?: boolean;
}

// ==================== Item GST Rate Interfaces ====================
interface CreateGSTRateData {
  name: string;
  rate: number;
  description?: string;
  companyId: string;
}

interface UpdateGSTRateData {
  name?: string;
  rate?: number;
  description?: string;
  isActive?: boolean;
}

// ==================== Item Brand Interfaces ====================
interface CreateBrandData {
  name: string;
  code?: string;
  description?: string;
  companyId: string;
}

interface UpdateBrandData {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

// ==================== Item Model Interfaces ====================
interface CreateModelData {
  name: string;
  code?: string;
  description?: string;
  brandId?: string;
  companyId: string;
}

interface UpdateModelData {
  name?: string;
  code?: string;
  description?: string;
  brandId?: string;
  isActive?: boolean;
}

// ==================== Fault Interfaces ====================
interface CreateFaultData {
  name: string;
  code?: string;
  description?: string;
  defaultPrice?: number;
  technicianPoints?: number;
  companyId: string;
}

interface UpdateFaultData {
  name?: string;
  code?: string;
  description?: string;
  defaultPrice?: number;
  technicianPoints?: number;
  isActive?: boolean;
}

// ==================== Payment Method Interfaces ====================
interface CreatePaymentMethodData {
  name: string;
  code: string;
  description?: string;
  companyId: string;
}

interface UpdatePaymentMethodData {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

// ==================== Device Condition Interfaces ====================
interface CreateDeviceConditionData {
  name: string;
  code?: string;
  description?: string;
  companyId: string;
}

interface UpdateDeviceConditionData {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

// ==================== Service Issue Interfaces ====================
interface CreateServiceIssueData {
  name: string;
  description?: string;
  companyId: string;
}

interface UpdateServiceIssueData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// ==================== Filter Interfaces ====================
interface MasterDataFilters {
  companyId: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

interface ModelFilters extends MasterDataFilters {
  brandId?: string;
}

export class MasterDataService {
  // ==================== ITEM CATEGORY METHODS ====================

  /**
   * Get all item categories
   */
  static async getAllCategories(filters: MasterDataFilters) {
    try {
      const {
        companyId,
        search,
        isActive,
        page = 1,
        limit = 100,
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {
        companyId,
      };

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [categories, total] = await Promise.all([
        prisma.itemCategory.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.itemCategory.count({ where }),
      ]);

      return {
        data: categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching categories', { error, filters });
      throw new AppError(500, 'Failed to fetch categories');
    }
  }

  /**
   * Get a single category by ID
   */
  static async getCategoryById(id: string, companyId: string) {
    try {
      const category = await prisma.itemCategory.findFirst({
        where: { id, companyId },
      });

      if (!category) {
        throw new AppError(404, 'Category not found');
      }

      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching category', { error, id, companyId });
      throw new AppError(500, 'Failed to fetch category');
    }
  }

  /**
   * Create a new item category
   */
  static async createCategory(data: CreateCategoryData) {
    try {
      // Check if code already exists for this company (only if code is provided)
      if (data.code) {
        const existing = await prisma.itemCategory.findFirst({
          where: {
            code: data.code,
            companyId: data.companyId,
          },
        });

        if (existing) {
          throw new AppError(400, 'Category code already exists');
        }
      }

      const category = await prisma.itemCategory.create({
        data: {
          name: data.name,
          code: data.code ? data.code.toUpperCase() : undefined,
          description: data.description,
          companyId: data.companyId,
        },
      });

      Logger.info('Category created', { categoryId: category.id, name: category.name });
      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating category', { error, data });
      throw new AppError(500, 'Failed to create category');
    }
  }

  /**
   * Update an item category
   */
  static async updateCategory(id: string, companyId: string, data: UpdateCategoryData) {
    try {
      // Check if category exists
      const existing = await prisma.itemCategory.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Category not found');
      }

      // If updating code, check for duplicates
      if (data.code && data.code !== existing.code) {
        const duplicate = await prisma.itemCategory.findFirst({
          where: {
            code: data.code,
            companyId,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new AppError(400, 'Category code already exists');
        }
      }

      const category = await prisma.itemCategory.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code && { code: data.code.toUpperCase() }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      Logger.info('Category updated', { categoryId: id });
      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating category', { error, id, data });
      throw new AppError(500, 'Failed to update category');
    }
  }

  /**
   * Deactivate a category (soft delete)
   */
  static async deactivateCategory(id: string, companyId: string) {
    try {
      // Check if category exists
      const existing = await prisma.itemCategory.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Category not found');
      }

      // Check if category is being used
      const usageCount = await prisma.inventory.count({
        where: { categoryId: id },
      });

      if (usageCount > 0) {
        throw new AppError(400, `Cannot deactivate category. It is being used by ${usageCount} inventory item(s)`);
      }

      const category = await prisma.itemCategory.update({
        where: { id },
        data: { isActive: false },
      });

      Logger.info('Category deactivated', { categoryId: id });
      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deactivating category', { error, id });
      throw new AppError(500, 'Failed to deactivate category');
    }
  }

  // ==================== ITEM UNIT METHODS ====================

  /**
   * Get all item units
   */
  static async getAllUnits(filters: MasterDataFilters) {
    try {
      const {
        companyId,
        search,
        isActive,
        page = 1,
        limit = 100,
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {
        companyId,
      };

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { symbol: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [units, total] = await Promise.all([
        prisma.itemUnit.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.itemUnit.count({ where }),
      ]);

      return {
        data: units,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching units', { error, filters });
      throw new AppError(500, 'Failed to fetch units');
    }
  }

  /**
   * Get a single unit by ID
   */
  static async getUnitById(id: string, companyId: string) {
    try {
      const unit = await prisma.itemUnit.findFirst({
        where: { id, companyId },
      });

      if (!unit) {
        throw new AppError(404, 'Unit not found');
      }

      return unit;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching unit', { error, id, companyId });
      throw new AppError(500, 'Failed to fetch unit');
    }
  }

  /**
   * Create a new item unit
   */
  static async createUnit(data: CreateUnitData) {
    try {
      // Check if code already exists for this company
      const existing = await prisma.itemUnit.findFirst({
        where: {
          code: data.code,
          companyId: data.companyId,
        },
      });

      if (existing) {
        throw new AppError(400, 'Unit code already exists');
      }

      const unit = await prisma.itemUnit.create({
        data: {
          name: data.name,
          code: data.code.toUpperCase(),
          symbol: data.symbol,
          description: data.description,
          companyId: data.companyId,
        },
      });

      Logger.info('Unit created', { unitId: unit.id, name: unit.name });
      return unit;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating unit', { error, data });
      throw new AppError(500, 'Failed to create unit');
    }
  }

  /**
   * Update an item unit
   */
  static async updateUnit(id: string, companyId: string, data: UpdateUnitData) {
    try {
      // Check if unit exists
      const existing = await prisma.itemUnit.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Unit not found');
      }

      // If updating code, check for duplicates
      if (data.code && data.code !== existing.code) {
        const duplicate = await prisma.itemUnit.findFirst({
          where: {
            code: data.code,
            companyId,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new AppError(400, 'Unit code already exists');
        }
      }

      const unit = await prisma.itemUnit.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code && { code: data.code.toUpperCase() }),
          ...(data.symbol !== undefined && { symbol: data.symbol }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      Logger.info('Unit updated', { unitId: id });
      return unit;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating unit', { error, id, data });
      throw new AppError(500, 'Failed to update unit');
    }
  }

  /**
   * Deactivate a unit (soft delete)
   */
  static async deactivateUnit(id: string, companyId: string) {
    try {
      // Check if unit exists
      const existing = await prisma.itemUnit.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Unit not found');
      }

      // Check if unit is being used
      const usageCount = await prisma.inventory.count({
        where: { unitId: id },
      });

      if (usageCount > 0) {
        throw new AppError(400, `Cannot deactivate unit. It is being used by ${usageCount} inventory item(s)`);
      }

      const unit = await prisma.itemUnit.update({
        where: { id },
        data: { isActive: false },
      });

      Logger.info('Unit deactivated', { unitId: id });
      return unit;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deactivating unit', { error, id });
      throw new AppError(500, 'Failed to deactivate unit');
    }
  }

  // ==================== ITEM GST RATE METHODS ====================

  /**
   * Get all GST rates
   */
  static async getAllGSTRates(filters: MasterDataFilters) {
    try {
      const {
        companyId,
        search,
        isActive,
        page = 1,
        limit = 100,
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {
        companyId,
      };

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [gstRates, total] = await Promise.all([
        prisma.itemGSTRate.findMany({
          where,
          skip,
          take: limit,
          orderBy: { rate: 'asc' },
        }),
        prisma.itemGSTRate.count({ where }),
      ]);

      return {
        data: gstRates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching GST rates', { error, filters });
      throw new AppError(500, 'Failed to fetch GST rates');
    }
  }

  /**
   * Get a single GST rate by ID
   */
  static async getGSTRateById(id: string, companyId: string) {
    try {
      const gstRate = await prisma.itemGSTRate.findFirst({
        where: { id, companyId },
      });

      if (!gstRate) {
        throw new AppError(404, 'GST rate not found');
      }

      return gstRate;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching GST rate', { error, id, companyId });
      throw new AppError(500, 'Failed to fetch GST rate');
    }
  }

  /**
   * Create a new GST rate
   */
  static async createGSTRate(data: CreateGSTRateData) {
    try {
      // Check if a GST rate with the same rate already exists for this company
      const existing = await prisma.itemGSTRate.findFirst({
        where: {
          rate: data.rate,
          companyId: data.companyId,
        },
      });

      if (existing) {
        throw new AppError(400, 'GST rate already exists');
      }

      const gstRate = await prisma.itemGSTRate.create({
        data: {
          name: data.name,
          rate: data.rate,
          description: data.description,
          companyId: data.companyId,
        },
      });

      Logger.info('GST rate created', { gstRateId: gstRate.id, rate: gstRate.rate });
      return gstRate;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating GST rate', { error, data });
      throw new AppError(500, 'Failed to create GST rate');
    }
  }

  /**
   * Update a GST rate
   */
  static async updateGSTRate(id: string, companyId: string, data: UpdateGSTRateData) {
    try {
      // Check if GST rate exists
      const existing = await prisma.itemGSTRate.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'GST rate not found');
      }

      // If updating rate, check for duplicates
      if (data.rate !== undefined && data.rate !== existing.rate.toNumber()) {
        const duplicate = await prisma.itemGSTRate.findFirst({
          where: {
            rate: data.rate,
            companyId,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new AppError(400, 'GST rate already exists');
        }
      }

      const gstRate = await prisma.itemGSTRate.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.rate !== undefined && { rate: data.rate }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      Logger.info('GST rate updated', { gstRateId: id });
      return gstRate;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating GST rate', { error, id, data });
      throw new AppError(500, 'Failed to update GST rate');
    }
  }

  /**
   * Deactivate a GST rate (soft delete)
   */
  static async deactivateGSTRate(id: string, companyId: string) {
    try {
      // Check if GST rate exists
      const existing = await prisma.itemGSTRate.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'GST rate not found');
      }

      // Check if GST rate is being used
      const usageCount = await prisma.inventory.count({
        where: { gstRateId: id },
      });

      if (usageCount > 0) {
        throw new AppError(400, `Cannot deactivate GST rate. It is being used by ${usageCount} inventory item(s)`);
      }

      const gstRate = await prisma.itemGSTRate.update({
        where: { id },
        data: { isActive: false },
      });

      Logger.info('GST rate deactivated', { gstRateId: id });
      return gstRate;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deactivating GST rate', { error, id });
      throw new AppError(500, 'Failed to deactivate GST rate');
    }
  }

  // ==================== ITEM BRAND METHODS ====================

  /**
   * Get all item brands
   */
  static async getAllBrands(filters: MasterDataFilters) {
    try {
      const {
        companyId,
        search,
        isActive,
        page = 1,
        limit = 100,
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {
        companyId,
      };

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [brands, total] = await Promise.all([
        prisma.itemBrand.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: {
                models: true,
                inventories: true,
              },
            },
          },
        }),
        prisma.itemBrand.count({ where }),
      ]);

      return {
        data: brands,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching brands', { error, filters });
      throw new AppError(500, 'Failed to fetch brands');
    }
  }

  /**
   * Get a single brand by ID
   */
  static async getBrandById(id: string, companyId: string) {
    try {
      const brand = await prisma.itemBrand.findFirst({
        where: { id, companyId },
        include: {
          models: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
          _count: {
            select: {
              inventories: true,
            },
          },
        },
      });

      if (!brand) {
        throw new AppError(404, 'Brand not found');
      }

      return brand;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching brand', { error, id, companyId });
      throw new AppError(500, 'Failed to fetch brand');
    }
  }

  /**
   * Create a new item brand
   */
  static async createBrand(data: CreateBrandData) {
    try {
      // Check if code already exists for this company (only if code is provided)
      if (data.code) {
        const existing = await prisma.itemBrand.findFirst({
          where: {
            code: data.code,
            companyId: data.companyId,
          },
        });

        if (existing) {
          throw new AppError(400, 'Brand code already exists');
        }
      }

      const brand = await prisma.itemBrand.create({
        data: {
          name: data.name,
          code: data.code ? data.code.toUpperCase() : undefined,
          description: data.description,
          companyId: data.companyId,
        },
      });

      Logger.info('Brand created', { brandId: brand.id, name: brand.name });
      return brand;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating brand', { error, data });
      throw new AppError(500, 'Failed to create brand');
    }
  }

  /**
   * Update an item brand
   */
  static async updateBrand(id: string, companyId: string, data: UpdateBrandData) {
    try {
      // Check if brand exists
      const existing = await prisma.itemBrand.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Brand not found');
      }

      // If updating code, check for duplicates
      if (data.code && data.code !== existing.code) {
        const duplicate = await prisma.itemBrand.findFirst({
          where: {
            code: data.code,
            companyId,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new AppError(400, 'Brand code already exists');
        }
      }

      const brand = await prisma.itemBrand.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code !== undefined && { code: data.code ? data.code.toUpperCase() : null }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      Logger.info('Brand updated', { brandId: id });
      return brand;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating brand', { error, id, data });
      throw new AppError(500, 'Failed to update brand');
    }
  }

  /**
   * Deactivate a brand (soft delete)
   */
  static async deactivateBrand(id: string, companyId: string) {
    try {
      // Check if brand exists
      const existing = await prisma.itemBrand.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Brand not found');
      }

      // Check if brand is being used
      const usageCount = await prisma.inventory.count({
        where: { brandId: id },
      });

      if (usageCount > 0) {
        throw new AppError(400, `Cannot deactivate brand. It is being used by ${usageCount} inventory item(s)`);
      }

      const brand = await prisma.itemBrand.update({
        where: { id },
        data: { isActive: false },
      });

      Logger.info('Brand deactivated', { brandId: id });
      return brand;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deactivating brand', { error, id });
      throw new AppError(500, 'Failed to deactivate brand');
    }
  }

  // ==================== ITEM MODEL METHODS ====================

  /**
   * Get all item models
   */
  static async getAllModels(filters: ModelFilters) {
    try {
      const {
        companyId,
        search,
        isActive,
        brandId,
        page = 1,
        limit = 100,
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {
        companyId,
      };

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (brandId) {
        where.brandId = brandId;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [models, total] = await Promise.all([
        prisma.itemModel.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
          include: {
            brand: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            _count: {
              select: {
                inventories: true,
              },
            },
          },
        }),
        prisma.itemModel.count({ where }),
      ]);

      return {
        data: models,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching models', { error, filters });
      throw new AppError(500, 'Failed to fetch models');
    }
  }

  /**
   * Get a single model by ID
   */
  static async getModelById(id: string, companyId: string) {
    try {
      const model = await prisma.itemModel.findFirst({
        where: { id, companyId },
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              inventories: true,
            },
          },
        },
      });

      if (!model) {
        throw new AppError(404, 'Model not found');
      }

      return model;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching model', { error, id, companyId });
      throw new AppError(500, 'Failed to fetch model');
    }
  }

  /**
   * Create a new item model
   */
  static async createModel(data: CreateModelData) {
    try {
      // Check if code already exists for this company (only if code is provided)
      if (data.code) {
        const existing = await prisma.itemModel.findFirst({
          where: {
            code: data.code,
            companyId: data.companyId,
          },
        });

        if (existing) {
          throw new AppError(400, 'Model code already exists');
        }
      }

      // Validate brandId if provided
      if (data.brandId) {
        const brand = await prisma.itemBrand.findFirst({
          where: {
            id: data.brandId,
            companyId: data.companyId,
            isActive: true,
          },
        });

        if (!brand) {
          throw new AppError(400, 'Invalid or inactive brand');
        }
      }

      const model = await prisma.itemModel.create({
        data: {
          name: data.name,
          code: data.code ? data.code.toUpperCase() : undefined,
          description: data.description,
          brandId: data.brandId,
          companyId: data.companyId,
        },
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      Logger.info('Model created', { modelId: model.id, name: model.name });
      return model;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating model', { error, data });
      throw new AppError(500, 'Failed to create model');
    }
  }

  /**
   * Update an item model
   */
  static async updateModel(id: string, companyId: string, data: UpdateModelData) {
    try {
      // Check if model exists
      const existing = await prisma.itemModel.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Model not found');
      }

      // If updating code, check for duplicates
      if (data.code && data.code !== existing.code) {
        const duplicate = await prisma.itemModel.findFirst({
          where: {
            code: data.code,
            companyId,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new AppError(400, 'Model code already exists');
        }
      }

      // Validate brandId if provided
      if (data.brandId !== undefined && data.brandId !== null) {
        const brand = await prisma.itemBrand.findFirst({
          where: {
            id: data.brandId,
            companyId,
            isActive: true,
          },
        });

        if (!brand) {
          throw new AppError(400, 'Invalid or inactive brand');
        }
      }

      const model = await prisma.itemModel.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code !== undefined && { code: data.code ? data.code.toUpperCase() : null }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.brandId !== undefined && { brandId: data.brandId }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      Logger.info('Model updated', { modelId: id });
      return model;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating model', { error, id, data });
      throw new AppError(500, 'Failed to update model');
    }
  }

  /**
   * Deactivate a model (soft delete)
   */
  static async deactivateModel(id: string, companyId: string) {
    try {
      // Check if model exists
      const existing = await prisma.itemModel.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Model not found');
      }

      // Check if model is being used
      const usageCount = await prisma.inventory.count({
        where: { modelId: id },
      });

      if (usageCount > 0) {
        throw new AppError(400, `Cannot deactivate model. It is being used by ${usageCount} inventory item(s)`);
      }

      const model = await prisma.itemModel.update({
        where: { id },
        data: { isActive: false },
      });

      Logger.info('Model deactivated', { modelId: id });
      return model;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deactivating model', { error, id });
      throw new AppError(500, 'Failed to deactivate model');
    }
  }

  // ==================== SERVICE CATEGORY METHODS ====================

  /**
   * Get all service categories
   */
  static async getAllFaults(filters: MasterDataFilters) {
    try {
      const {
        companyId,
        search,
        isActive,
        page = 1,
        limit = 100,
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {
        companyId,
      };

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [faults, total] = await Promise.all([
        prisma.fault.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.fault.count({ where }),
      ]);

      return {
        data: faults,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching faults', { error, filters });
      throw new AppError(500, 'Failed to fetch faults');
    }
  }

  /**
   * Get a single fault by ID
   */
  static async getFaultById(id: string, companyId: string) {
    try {
      const fault = await prisma.fault.findFirst({
        where: { id, companyId },
      });

      if (!fault) {
        throw new AppError(404, 'Fault not found');
      }

      return fault;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching fault', { error, id, companyId });
      throw new AppError(500, 'Failed to fetch fault');
    }
  }

  /**
   * Create a new fault
   */
  static async createFault(data: CreateFaultData) {
    try {
      // Validate defaultPrice if provided
      if (data.defaultPrice !== undefined && data.defaultPrice < 0) {
        throw new AppError(400, 'Default price must be greater than or equal to 0');
      }

      // Validate technicianPoints if provided
      if (data.technicianPoints !== undefined && data.technicianPoints < 0) {
        throw new AppError(400, 'Technician points must be greater than or equal to 0');
      }

      // Check if code already exists for this company (only if code is provided)
      if (data.code) {
        const existing = await prisma.fault.findFirst({
          where: {
            code: {
              equals: data.code,
              mode: 'insensitive',
            },
            companyId: data.companyId,
          },
        });

        if (existing) {
          throw new AppError(400, 'Fault code already exists');
        }
      }

      const fault = await prisma.fault.create({
        data: {
          name: data.name,
          code: data.code ? data.code.toUpperCase() : undefined,
          description: data.description,
          defaultPrice: data.defaultPrice ?? 0,
          technicianPoints: data.technicianPoints ?? 0,
          companyId: data.companyId,
        },
      });

      Logger.info('Fault created', { faultId: fault.id, name: fault.name });
      return fault;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating fault', { error, data });
      throw new AppError(500, 'Failed to create fault');
    }
  }

  /**
   * Update a fault
   */
  static async updateFault(id: string, companyId: string, data: UpdateFaultData) {
    try {
      // Validate defaultPrice if provided
      if (data.defaultPrice !== undefined && data.defaultPrice < 0) {
        throw new AppError(400, 'Default price must be greater than or equal to 0');
      }

      // Validate technicianPoints if provided
      if (data.technicianPoints !== undefined && data.technicianPoints < 0) {
        throw new AppError(400, 'Technician points must be greater than or equal to 0');
      }

      // Check if fault exists
      const existing = await prisma.fault.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Fault not found');
      }

      // If updating code, check for duplicates (case-insensitive)
      if (data.code && data.code.toUpperCase() !== existing.code?.toUpperCase()) {
        const duplicate = await prisma.fault.findFirst({
          where: {
            code: {
              equals: data.code,
              mode: 'insensitive',
            },
            companyId,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new AppError(400, 'Fault code already exists');
        }
      }

      const fault = await prisma.fault.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code !== undefined && { code: data.code ? data.code.toUpperCase() : null }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.defaultPrice !== undefined && { defaultPrice: data.defaultPrice }),
          ...(data.technicianPoints !== undefined && { technicianPoints: data.technicianPoints }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      Logger.info('Fault updated', { faultId: id });
      return fault;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating fault', { error, id, data });
      throw new AppError(500, 'Failed to update fault');
    }
  }

  /**
   * Deactivate a fault (soft delete)
   */
  static async deactivateFault(id: string, companyId: string) {
    try {
      // Check if fault exists
      const existing = await prisma.fault.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Fault not found');
      }

      const fault = await prisma.fault.update({
        where: { id },
        data: { isActive: false },
      });

      Logger.info('Fault deactivated', { faultId: id });
      return fault;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deactivating fault', { error, id });
      throw new AppError(500, 'Failed to deactivate fault');
    }
  }

  // ==================== PAYMENT METHOD METHODS ====================

  /**
   * Get all payment methods
   */
  static async getAllPaymentMethods(filters: MasterDataFilters) {
    try {
      const {
        companyId,
        search,
        isActive,
        page = 1,
        limit = 100,
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {
        companyId,
      };

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [paymentMethods, total] = await Promise.all([
        prisma.paymentMethod.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.paymentMethod.count({ where }),
      ]);

      return {
        data: paymentMethods,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching payment methods', { error, filters });
      throw new AppError(500, 'Failed to fetch payment methods');
    }
  }

  /**
   * Get a single payment method by ID
   */
  static async getPaymentMethodById(id: string, companyId: string) {
    try {
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: { id, companyId },
      });

      if (!paymentMethod) {
        throw new AppError(404, 'Payment method not found');
      }

      return paymentMethod;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching payment method', { error, id, companyId });
      throw new AppError(500, 'Failed to fetch payment method');
    }
  }

  /**
   * Create a new payment method
   */
  static async createPaymentMethod(data: CreatePaymentMethodData) {
    try {
      // Check if code already exists for this company
      const existing = await prisma.paymentMethod.findFirst({
        where: {
          code: data.code,
          companyId: data.companyId,
        },
      });

      if (existing) {
        throw new AppError(400, 'Payment method code already exists');
      }

      const paymentMethod = await prisma.paymentMethod.create({
        data: {
          name: data.name,
          code: data.code.toUpperCase(),
          description: data.description,
          companyId: data.companyId,
        },
      });

      Logger.info('Payment method created', { paymentMethodId: paymentMethod.id, name: paymentMethod.name });
      return paymentMethod;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating payment method', { error, data });
      throw new AppError(500, 'Failed to create payment method');
    }
  }

  /**
   * Update a payment method
   */
  static async updatePaymentMethod(id: string, companyId: string, data: UpdatePaymentMethodData) {
    try {
      // Check if payment method exists
      const existing = await prisma.paymentMethod.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Payment method not found');
      }

      // If updating code, check for duplicates
      if (data.code && data.code !== existing.code) {
        const duplicate = await prisma.paymentMethod.findFirst({
          where: {
            code: data.code,
            companyId,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new AppError(400, 'Payment method code already exists');
        }
      }

      const paymentMethod = await prisma.paymentMethod.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code && { code: data.code.toUpperCase() }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      Logger.info('Payment method updated', { paymentMethodId: id });
      return paymentMethod;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating payment method', { error, id, data });
      throw new AppError(500, 'Failed to update payment method');
    }
  }

  /**
   * Deactivate a payment method (soft delete)
   */
  static async deactivatePaymentMethod(id: string, companyId: string) {
    try {
      // Check if payment method exists
      const existing = await prisma.paymentMethod.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Payment method not found');
      }

      // Check if payment method is being used in supplier payments
      const supplierPaymentCount = await prisma.supplierPayment.count({
        where: { paymentMethodId: id },
      });

      // Check if payment method is being used in invoice payments
      const invoicePaymentCount = await prisma.payment.count({
        where: { paymentMethodId: id },
      });

      const totalUsage = supplierPaymentCount + invoicePaymentCount;

      if (totalUsage > 0) {
        throw new AppError(400, `Cannot deactivate payment method. It is being used by ${totalUsage} payment(s)`);
      }

      const paymentMethod = await prisma.paymentMethod.update({
        where: { id },
        data: { isActive: false },
      });

      Logger.info('Payment method deactivated', { paymentMethodId: id });
      return paymentMethod;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deactivating payment method', { error, id });
      throw new AppError(500, 'Failed to deactivate payment method');
    }
  }

  // ==================== EXPENSE CATEGORY METHODS ====================

  /**
   * Get all expense categories
   */
  static async getAllExpenseCategories(filters: MasterDataFilters) {
    try {
      const {
        companyId,
        search,
        isActive,
        page = 1,
        limit = 100,
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {
        companyId,
      };

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [expenseCategories, total] = await Promise.all([
        prisma.expenseCategory.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.expenseCategory.count({ where }),
      ]);

      return {
        data: expenseCategories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching expense categories', { error, filters });
      throw new AppError(500, 'Failed to fetch expense categories');
    }
  }

  /**
   * Get a single expense category by ID
   */
  static async getExpenseCategoryById(id: string, companyId: string) {
    try {
      const expenseCategory = await prisma.expenseCategory.findFirst({
        where: { id, companyId },
      });

      if (!expenseCategory) {
        throw new AppError(404, 'Expense category not found');
      }

      return expenseCategory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching expense category', { error, id, companyId });
      throw new AppError(500, 'Failed to fetch expense category');
    }
  }

  /**
   * Create a new expense category
   */
  static async createExpenseCategory(data: CreateCategoryData) {
    try {
      // Check if code already exists for this company (only if code is provided)
      if (data.code) {
        const existing = await prisma.expenseCategory.findFirst({
          where: {
            code: data.code,
            companyId: data.companyId,
          },
        });

        if (existing) {
          throw new AppError(400, 'Expense category code already exists');
        }
      }

      const expenseCategory = await prisma.expenseCategory.create({
        data: {
          name: data.name,
          code: data.code ? data.code.toUpperCase() : undefined,
          description: data.description,
          companyId: data.companyId,
        },
      });

      Logger.info('Expense category created', { expenseCategoryId: expenseCategory.id, name: expenseCategory.name });
      return expenseCategory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating expense category', { error, data });
      throw new AppError(500, 'Failed to create expense category');
    }
  }

  /**
   * Update an expense category
   */
  static async updateExpenseCategory(id: string, companyId: string, data: UpdateCategoryData) {
    try {
      // Check if expense category exists
      const existing = await prisma.expenseCategory.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Expense category not found');
      }

      // If updating code, check for duplicates
      if (data.code && data.code !== existing.code) {
        const duplicate = await prisma.expenseCategory.findFirst({
          where: {
            code: data.code,
            companyId,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new AppError(400, 'Expense category code already exists');
        }
      }

      const expenseCategory = await prisma.expenseCategory.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code && { code: data.code.toUpperCase() }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      Logger.info('Expense category updated', { expenseCategoryId: id });
      return expenseCategory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating expense category', { error, id, data });
      throw new AppError(500, 'Failed to update expense category');
    }
  }

  /**
   * Deactivate an expense category (soft delete)
   */
  static async deactivateExpenseCategory(id: string, companyId: string) {
    try {
      // Check if expense category exists
      const existing = await prisma.expenseCategory.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Expense category not found');
      }

      // Check if expense category is being used
      const usageCount = await prisma.expense.count({
        where: { categoryId: id },
      });

      if (usageCount > 0) {
        throw new AppError(400, `Cannot deactivate expense category. It is being used by ${usageCount} expense(s)`);
      }

      const expenseCategory = await prisma.expenseCategory.update({
        where: { id },
        data: { isActive: false },
      });

      Logger.info('Expense category deactivated', { expenseCategoryId: id });
      return expenseCategory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deactivating expense category', { error, id });
      throw new AppError(500, 'Failed to deactivate expense category');
    }
  }

  // ==================== DEVICE CONDITION METHODS ====================

  /**
   * Get all device conditions
   */
  static async getAllDeviceConditions(filters: MasterDataFilters) {
    try {
      const {
        companyId,
        search,
        isActive,
        page = 1,
        limit = 100,
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {
        companyId,
      };

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [deviceConditions, total] = await Promise.all([
        prisma.deviceCondition.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.deviceCondition.count({ where }),
      ]);

      return {
        data: deviceConditions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching device conditions', { error, filters });
      throw new AppError(500, 'Failed to fetch device conditions');
    }
  }

  /**
   * Get device condition by ID
   */
  static async getDeviceConditionById(id: string, companyId: string) {
    try {
      const deviceCondition = await prisma.deviceCondition.findFirst({
        where: { id, companyId },
      });

      if (!deviceCondition) {
        throw new AppError(404, 'Device condition not found');
      }

      return deviceCondition;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching device condition', { error, id });
      throw new AppError(500, 'Failed to fetch device condition');
    }
  }

  /**
   * Create a new device condition
   */
  static async createDeviceCondition(data: CreateDeviceConditionData) {
    try {
      // Check for duplicate code
      if (data.code) {
        const duplicate = await prisma.deviceCondition.findFirst({
          where: {
            companyId: data.companyId,
            code: { equals: data.code, mode: 'insensitive' },
          },
        });

        if (duplicate) {
          throw new AppError(400, 'Device condition code already exists');
        }
      }

      const deviceCondition = await prisma.deviceCondition.create({
        data: {
          name: data.name,
          code: data.code?.toUpperCase(),
          description: data.description,
          companyId: data.companyId,
        },
      });

      Logger.info('Device condition created', { deviceConditionId: deviceCondition.id });
      return deviceCondition;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating device condition', { error, data });
      throw new AppError(500, 'Failed to create device condition');
    }
  }

  /**
   * Update a device condition
   */
  static async updateDeviceCondition(id: string, companyId: string, data: UpdateDeviceConditionData) {
    try {
      // Check if device condition exists
      const existing = await prisma.deviceCondition.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Device condition not found');
      }

      // Check for duplicate code if being updated
      if (data.code) {
        const duplicate = await prisma.deviceCondition.findFirst({
          where: {
            companyId,
            code: { equals: data.code, mode: 'insensitive' },
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new AppError(400, 'Device condition code already exists');
        }
      }

      const deviceCondition = await prisma.deviceCondition.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code && { code: data.code.toUpperCase() }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      Logger.info('Device condition updated', { deviceConditionId: id });
      return deviceCondition;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating device condition', { error, id, data });
      throw new AppError(500, 'Failed to update device condition');
    }
  }

  /**
   * Deactivate a device condition (soft delete)
   */
  static async deactivateDeviceCondition(id: string, companyId: string) {
    try {
      // Check if device condition exists
      const existing = await prisma.deviceCondition.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Device condition not found');
      }

      // Check if device condition is being used in services
      const usageCount = await prisma.service.count({
        where: { conditionId: id },
      });

      if (usageCount > 0) {
        throw new AppError(400, `Cannot deactivate device condition. It is being used by ${usageCount} service(s)`);
      }

      const deviceCondition = await prisma.deviceCondition.update({
        where: { id },
        data: { isActive: false },
      });

      Logger.info('Device condition deactivated', { deviceConditionId: id });
      return deviceCondition;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deactivating device condition', { error, id });
      throw new AppError(500, 'Failed to deactivate device condition');
    }
  }

  // ==================== SERVICE ISSUE METHODS ====================

  /**
   * Get all service issues
   */
  static async getAllServiceIssues(filters: MasterDataFilters) {
    try {
      const {
        companyId,
        search,
        isActive,
        page = 1,
        limit = 50,
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {
        companyId,
      };

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [serviceIssues, total] = await Promise.all([
        prisma.serviceIssue.findMany({
          where,
          skip,
          take: limit,
          include: {
            _count: {
              select: { services: true },
            },
          },
          orderBy: {
            services: {
              _count: 'desc',
            },
          },
        }),
        prisma.serviceIssue.count({ where }),
      ]);

      return {
        data: serviceIssues,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching service issues', { error, filters });
      throw new AppError(500, 'Failed to fetch service issues');
    }
  }

  /**
   * Get service issue by ID
   */
  static async getServiceIssueById(id: string, companyId: string) {
    try {
      const serviceIssue = await prisma.serviceIssue.findFirst({
        where: { id, companyId },
      });

      if (!serviceIssue) {
        throw new AppError(404, 'Service issue not found');
      }

      return serviceIssue;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching service issue', { error, id });
      throw new AppError(500, 'Failed to fetch service issue');
    }
  }

  /**
   * Create a new service issue
   */
  static async createServiceIssue(data: CreateServiceIssueData) {
    try {
      // Check for duplicate name (case-insensitive)
      const duplicate = await prisma.serviceIssue.findFirst({
        where: {
          companyId: data.companyId,
          name: { equals: data.name, mode: 'insensitive' },
        },
      });

      if (duplicate) {
        // Return existing issue instead of error for auto-create flow
        return duplicate;
      }

      const serviceIssue = await prisma.serviceIssue.create({
        data: {
          name: data.name,
          description: data.description,
          companyId: data.companyId,
        },
      });

      Logger.info('Service issue created', { serviceIssueId: serviceIssue.id });
      return serviceIssue;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating service issue', { error, data });
      throw new AppError(500, 'Failed to create service issue');
    }
  }

  /**
   * Update a service issue
   */
  static async updateServiceIssue(id: string, companyId: string, data: UpdateServiceIssueData) {
    try {
      // Check if service issue exists
      const existing = await prisma.serviceIssue.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Service issue not found');
      }

      // Check for duplicate name if being updated
      if (data.name) {
        const duplicate = await prisma.serviceIssue.findFirst({
          where: {
            companyId,
            name: { equals: data.name, mode: 'insensitive' },
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new AppError(400, 'Service issue name already exists');
        }
      }

      const serviceIssue = await prisma.serviceIssue.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      Logger.info('Service issue updated', { serviceIssueId: id });
      return serviceIssue;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating service issue', { error, id, data });
      throw new AppError(500, 'Failed to update service issue');
    }
  }

  /**
   * Deactivate a service issue (soft delete)
   */
  static async deactivateServiceIssue(id: string, companyId: string) {
    try {
      // Check if service issue exists
      const existing = await prisma.serviceIssue.findFirst({
        where: { id, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Service issue not found');
      }

      const serviceIssue = await prisma.serviceIssue.update({
        where: { id },
        data: { isActive: false },
      });

      Logger.info('Service issue deactivated', { serviceIssueId: id });
      return serviceIssue;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deactivating service issue', { error, id });
      throw new AppError(500, 'Failed to deactivate service issue');
    }
  }

  // ==================== ACCESSORY METHODS (Global) ====================

  /**
   * Get all accessories (global - not company scoped)
   */
  static async getAllAccessories(filters: Omit<MasterDataFilters, 'companyId'> & { companyId?: string }) {
    try {
      const {
        search,
        isActive,
        page = 1,
        limit = 100,
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {};

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [accessories, total] = await Promise.all([
        prisma.accessory.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.accessory.count({ where }),
      ]);

      return {
        data: accessories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching accessories', { error, filters });
      throw new AppError(500, 'Failed to fetch accessories');
    }
  }

  /**
   * Get accessory by ID
   */
  static async getAccessoryById(id: string) {
    try {
      const accessory = await prisma.accessory.findUnique({
        where: { id },
      });

      if (!accessory) {
        throw new AppError(404, 'Accessory not found');
      }

      return accessory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching accessory', { error, id });
      throw new AppError(500, 'Failed to fetch accessory');
    }
  }

  /**
   * Create a new accessory (global)
   */
  static async createAccessory(data: { name: string; code?: string; description?: string }) {
    try {
      // Check for duplicate name
      const existingByName = await prisma.accessory.findUnique({
        where: { name: data.name },
      });

      if (existingByName) {
        // Return existing accessory for auto-create flow
        return existingByName;
      }

      // Check for duplicate code if provided
      if (data.code) {
        const existingByCode = await prisma.accessory.findUnique({
          where: { code: data.code.toUpperCase() },
        });

        if (existingByCode) {
          throw new AppError(400, 'Accessory code already exists');
        }
      }

      const accessory = await prisma.accessory.create({
        data: {
          name: data.name,
          code: data.code?.toUpperCase(),
          description: data.description,
        },
      });

      Logger.info('Accessory created', { accessoryId: accessory.id, name: accessory.name });
      return accessory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating accessory', { error, data });
      throw new AppError(500, 'Failed to create accessory');
    }
  }

  /**
   * Update an accessory
   */
  static async updateAccessory(id: string, data: { name?: string; code?: string; description?: string; isActive?: boolean }) {
    try {
      // Check if accessory exists
      const existing = await prisma.accessory.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError(404, 'Accessory not found');
      }

      // Check for duplicate name if being updated
      if (data.name && data.name !== existing.name) {
        const duplicate = await prisma.accessory.findUnique({
          where: { name: data.name },
        });

        if (duplicate) {
          throw new AppError(400, 'Accessory name already exists');
        }
      }

      // Check for duplicate code if being updated
      if (data.code && data.code !== existing.code) {
        const duplicate = await prisma.accessory.findUnique({
          where: { code: data.code.toUpperCase() },
        });

        if (duplicate) {
          throw new AppError(400, 'Accessory code already exists');
        }
      }

      const accessory = await prisma.accessory.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code !== undefined && { code: data.code ? data.code.toUpperCase() : null }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      Logger.info('Accessory updated', { accessoryId: id });
      return accessory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating accessory', { error, id, data });
      throw new AppError(500, 'Failed to update accessory');
    }
  }

  /**
   * Deactivate an accessory (soft delete)
   */
  static async deactivateAccessory(id: string) {
    try {
      // Check if accessory exists
      const existing = await prisma.accessory.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError(404, 'Accessory not found');
      }

      const accessory = await prisma.accessory.update({
        where: { id },
        data: { isActive: false },
      });

      Logger.info('Accessory deactivated', { accessoryId: id });
      return accessory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deactivating accessory', { error, id });
      throw new AppError(500, 'Failed to deactivate accessory');
    }
  }
}
