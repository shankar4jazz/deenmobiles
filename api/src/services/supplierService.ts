import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
// Trigger reload

interface CreateSupplierData {
  supplierCode?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  active?: boolean;
  companyId: string;
  branchId?: string;
}

interface UpdateSupplierData {
  supplierCode?: string;
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  active?: boolean;
}

interface SupplierFilters {
  companyId: string;
  branchId?: string;
  search?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

export class SupplierService {
  /**
   * Generate a unique supplier code
   */
  private static async generateSupplierCode(companyId: string): Promise<string> {
    try {
      // Get the count of suppliers for this company
      const count = await prisma.supplier.count({
        where: { companyId },
      });

      // Generate code like SUP-0001, SUP-0002, etc.
      const code = `SUP-${(count + 1).toString().padStart(4, '0')}`;

      // Check if code already exists (in case of concurrent creation)
      const existing = await prisma.supplier.findUnique({
        where: { supplierCode: code },
      });

      if (existing) {
        // If exists, add timestamp to make it unique
        return `SUP-${Date.now()}`;
      }

      return code;
    } catch (error) {
      Logger.error('Error generating supplier code', { error, companyId });
      // Fallback to timestamp-based code
      return `SUP-${Date.now()}`;
    }
  }

  /**
   * Create a new supplier
   */
  static async createSupplier(data: CreateSupplierData) {
    try {
      // Check if company exists
      const company = await prisma.company.findUnique({
        where: { id: data.companyId },
      });

      if (!company) {
        throw new AppError(404, 'Company not found');
      }

      // Generate supplier code if not provided
      const supplierCode = data.supplierCode || await this.generateSupplierCode(data.companyId);

      // Check if supplier code already exists
      const existingSupplier = await prisma.supplier.findUnique({
        where: { supplierCode },
      });

      if (existingSupplier) {
        throw new AppError(400, 'Supplier code already exists');
      }

      // Check if GST number already exists (if provided)
      if (data.gstNumber) {
        const existingGST = await prisma.supplier.findFirst({
          where: {
            gstNumber: data.gstNumber,
            companyId: data.companyId,
          },
        });

        if (existingGST) {
          throw new AppError(400, 'Supplier with this GST number already exists');
        }
      }

      // Create supplier
      const supplier = await prisma.supplier.create({
        data: {
          ...data,
          supplierCode,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      Logger.info('Supplier created successfully', {
        supplierId: supplier.id,
        supplierCode: supplier.supplierCode,
        companyId: data.companyId,
      });

      return supplier;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error creating supplier', { error, data });
      throw new AppError(500, 'Failed to create supplier');
    }
  }

  /**
   * Get all suppliers with filters and pagination
   */
  static async getSuppliers(filters: SupplierFilters) {
    try {
      const { companyId, branchId, search, active, page = 1, limit = 10 } = filters;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        companyId,
      };

      if (branchId) {
        // Include suppliers for this branch OR company-wide suppliers (branchId = null)
        where.OR = [
          { branchId: branchId },
          { branchId: null }
        ];
      }

      if (typeof active === 'boolean') {
        where.active = active;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { supplierCode: { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { gstNumber: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get suppliers and total count
      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { inventories: true },
            },
          },
        }),
        prisma.supplier.count({ where }),
      ]);

      return {
        suppliers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching suppliers', { error, filters });
      throw new AppError(500, 'Failed to fetch suppliers');
    }
  }

  /**
   * Get a single supplier by ID
   */
  static async getSupplierById(id: string, companyId: string) {
    try {
      const supplier = await prisma.supplier.findFirst({
        where: {
          id,
          companyId,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { inventories: true },
          },
        },
      });

      if (!supplier) {
        throw new AppError(404, 'Supplier not found');
      }

      return supplier;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error fetching supplier by ID', { error, id, companyId });
      throw new AppError(500, 'Failed to fetch supplier');
    }
  }

  /**
   * Update a supplier
   */
  static async updateSupplier(id: string, companyId: string, data: UpdateSupplierData) {
    try {
      // Check if supplier exists
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          id,
          companyId,
        },
      });

      if (!existingSupplier) {
        throw new AppError(404, 'Supplier not found');
      }

      // Check if supplier code is being changed and if it already exists
      if (data.supplierCode && data.supplierCode !== existingSupplier.supplierCode) {
        const duplicateCode = await prisma.supplier.findUnique({
          where: { supplierCode: data.supplierCode },
        });

        if (duplicateCode) {
          throw new AppError(400, 'Supplier code already exists');
        }
      }

      // Check if GST number is being changed and if it already exists
      if (data.gstNumber && data.gstNumber !== existingSupplier.gstNumber) {
        const duplicateGST = await prisma.supplier.findFirst({
          where: {
            gstNumber: data.gstNumber,
            companyId,
            id: { not: id },
          },
        });

        if (duplicateGST) {
          throw new AppError(400, 'Supplier with this GST number already exists');
        }
      }

      // Update supplier
      const supplier = await prisma.supplier.update({
        where: { id },
        data,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { inventories: true },
          },
        },
      });

      Logger.info('Supplier updated successfully', {
        supplierId: id,
        companyId,
      });

      return supplier;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error updating supplier', { error, id, data });
      throw new AppError(500, 'Failed to update supplier');
    }
  }

  /**
   * Delete a supplier (soft delete by setting active = false)
   */
  static async deleteSupplier(id: string, companyId: string) {
    try {
      // Check if supplier exists
      const supplier = await prisma.supplier.findFirst({
        where: {
          id,
          companyId,
        },
        include: {
          _count: {
            select: { inventories: true },
          },
        },
      });

      if (!supplier) {
        throw new AppError(404, 'Supplier not found');
      }

      // Check if supplier has associated inventories
      if (supplier._count.inventories > 0) {
        // Soft delete instead of hard delete
        const updatedSupplier = await prisma.supplier.update({
          where: { id },
          data: { active: false },
        });

        Logger.info('Supplier soft deleted (has associated inventories)', {
          supplierId: id,
          companyId,
          inventoriesCount: supplier._count.inventories,
        });

        return {
          supplier: updatedSupplier,
          message: 'Supplier deactivated successfully (has associated inventory items)',
        };
      }

      // Hard delete if no associated inventories
      await prisma.supplier.delete({
        where: { id },
      });

      Logger.info('Supplier deleted successfully', {
        supplierId: id,
        companyId,
      });

      return {
        supplier: null,
        message: 'Supplier deleted successfully',
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      Logger.error('Error deleting supplier', { error, id, companyId });
      throw new AppError(500, 'Failed to delete supplier');
    }
  }

  /**
   * Get all active suppliers for dropdown (minimal data)
   */
  static async getActiveSuppliersDropdown(companyId: string, branchId?: string) {
    try {
      const where: any = {
        companyId,
        active: true,
      };

      if (branchId) {
        // Include suppliers for this branch OR company-wide suppliers (branchId = null)
        where.OR = [
          { branchId: branchId },
          { branchId: null }
        ];
      }

      const suppliers = await prisma.supplier.findMany({
        where,
        select: {
          id: true,
          supplierCode: true,
          name: true,
          phone: true,
        },
        orderBy: { name: 'asc' },
      });

      return suppliers;
    } catch (error) {
      Logger.error('Error fetching active suppliers dropdown', { error, companyId, branchId });
      throw new AppError(500, 'Failed to fetch suppliers');
    }
  }
}
