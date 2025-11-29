import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';

interface CreateTemplateData {
  name: string;
  description?: string;
  notes?: string;
  taxRate?: number;
  items: TemplateItemData[];
  companyId: string;
  branchId?: string;
  userId: string;
}

interface TemplateItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder?: number;
}

interface UpdateTemplateData {
  name?: string;
  description?: string;
  notes?: string;
  taxRate?: number;
  isActive?: boolean;
  items?: TemplateItemData[];
}

interface TemplateFilters {
  companyId: string;
  branchId?: string;
  isActive?: boolean;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

export class InvoiceTemplateService {
  /**
   * Create new invoice template
   */
  static async createTemplate(data: CreateTemplateData) {
    try {
      const { name, description, notes, taxRate, items, companyId, branchId, userId } = data;

      // Validate items
      if (!items || items.length === 0) {
        throw new AppError(400, 'At least one item is required');
      }

      // Create template with items in a transaction
      const template = await prisma.invoiceTemplate.create({
        data: {
          name,
          description,
          notes,
          taxRate: taxRate || 18,
          companyId,
          branchId,
          createdBy: userId,
          items: {
            create: items.map((item, index) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              sortOrder: item.sortOrder !== undefined ? item.sortOrder : index,
            })),
          },
        },
        include: {
          items: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
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

      Logger.info(`Invoice template created: ${template.id}`, { userId });
      return template;
    } catch (error) {
      Logger.error('Error creating invoice template:', error);
      throw error;
    }
  }

  /**
   * Get all templates with filters and pagination
   */
  static async getAllTemplates(filters: TemplateFilters) {
    try {
      const {
        companyId,
        branchId,
        isActive,
        searchTerm,
        page = 1,
        limit = 20,
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        companyId,
      };

      if (branchId) {
        where.branchId = branchId;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (searchTerm) {
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      // Get templates and total count
      const [templates, total] = await Promise.all([
        prisma.invoiceTemplate.findMany({
          where,
          skip,
          take: limit,
          include: {
            items: {
              orderBy: {
                sortOrder: 'asc',
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            createdByUser: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                items: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.invoiceTemplate.count({ where }),
      ]);

      return {
        templates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching invoice templates:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(id: string, companyId: string) {
    try {
      const template = await prisma.invoiceTemplate.findFirst({
        where: {
          id,
          companyId,
        },
        include: {
          items: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
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

      if (!template) {
        throw new AppError(404, 'Invoice template not found');
      }

      return template;
    } catch (error) {
      Logger.error('Error fetching invoice template:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  static async updateTemplate(
    id: string,
    companyId: string,
    data: UpdateTemplateData
  ) {
    try {
      // Check if template exists and belongs to company
      const existingTemplate = await prisma.invoiceTemplate.findFirst({
        where: {
          id,
          companyId,
        },
        include: {
          items: true,
        },
      });

      if (!existingTemplate) {
        throw new AppError(404, 'Invoice template not found');
      }

      const { items, ...templateData } = data;

      // Update template and items in a transaction
      const template = await prisma.$transaction(async (tx) => {
        // Update template
        const updatedTemplate = await tx.invoiceTemplate.update({
          where: { id },
          data: templateData,
        });

        // Update items if provided
        if (items) {
          // Delete all existing items
          await tx.invoiceTemplateItem.deleteMany({
            where: { templateId: id },
          });

          // Create new items
          await tx.invoiceTemplateItem.createMany({
            data: items.map((item, index) => ({
              templateId: id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              sortOrder: item.sortOrder !== undefined ? item.sortOrder : index,
            })),
          });
        }

        // Fetch updated template with all relations
        return await tx.invoiceTemplate.findUnique({
          where: { id },
          include: {
            items: {
              orderBy: {
                sortOrder: 'asc',
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
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
      });

      Logger.info(`Invoice template updated: ${id}`);
      return template;
    } catch (error) {
      Logger.error('Error updating invoice template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  static async deleteTemplate(id: string, companyId: string) {
    try {
      // Check if template exists and belongs to company
      const template = await prisma.invoiceTemplate.findFirst({
        where: {
          id,
          companyId,
        },
      });

      if (!template) {
        throw new AppError(404, 'Invoice template not found');
      }

      // Delete template (items will be cascade deleted)
      await prisma.invoiceTemplate.delete({
        where: { id },
      });

      Logger.info(`Invoice template deleted: ${id}`);
      return { message: 'Invoice template deleted successfully' };
    } catch (error) {
      Logger.error('Error deleting invoice template:', error);
      throw error;
    }
  }

  /**
   * Toggle template active status
   */
  static async toggleTemplateStatus(id: string, companyId: string) {
    try {
      const template = await prisma.invoiceTemplate.findFirst({
        where: {
          id,
          companyId,
        },
      });

      if (!template) {
        throw new AppError(404, 'Invoice template not found');
      }

      const updatedTemplate = await prisma.invoiceTemplate.update({
        where: { id },
        data: {
          isActive: !template.isActive,
        },
        include: {
          items: {
            orderBy: {
              sortOrder: 'asc',
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

      Logger.info(`Invoice template status toggled: ${id}`);
      return updatedTemplate;
    } catch (error) {
      Logger.error('Error toggling template status:', error);
      throw error;
    }
  }
}

export default InvoiceTemplateService;
