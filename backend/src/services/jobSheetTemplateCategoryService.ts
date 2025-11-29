import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateJobSheetTemplateCategoryData {
  name: string;
  description?: string;
  isActive?: boolean;
  companyId: string;
}

export interface UpdateJobSheetTemplateCategoryData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export const jobSheetTemplateCategoryService = {
  /**
   * Get all job sheet template categories with filters and pagination
   */
  async getAll({
    companyId,
    isActive,
    search,
    page = 1,
    limit = 20,
  }: {
    companyId: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.jobSheetTemplateCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' },
        ],
        include: {
          _count: {
            select: {
              templates: true,
            },
          },
        },
      }),
      prisma.jobSheetTemplateCategory.count({ where }),
    ]);

    return {
      data: categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get category by ID
   */
  async getById(id: string) {
    const category = await prisma.jobSheetTemplateCategory.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        templates: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!category) {
      throw new Error('Job sheet template category not found');
    }

    return category;
  },

  /**
   * Create new category
   */
  async create(data: CreateJobSheetTemplateCategoryData) {
    // Check if category name already exists for this company
    const existing = await prisma.jobSheetTemplateCategory.findFirst({
      where: {
        name: data.name,
        companyId: data.companyId,
      },
    });

    if (existing) {
      throw new Error('A category with this name already exists');
    }

    const category = await prisma.jobSheetTemplateCategory.create({
      data,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return category;
  },

  /**
   * Update category
   */
  async update(id: string, data: UpdateJobSheetTemplateCategoryData) {
    // Check if category exists
    const existingCategory = await prisma.jobSheetTemplateCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new Error('Job sheet template category not found');
    }

    // If updating name, check for duplicates
    if (data.name && data.name !== existingCategory.name) {
      const duplicate = await prisma.jobSheetTemplateCategory.findFirst({
        where: {
          name: data.name,
          companyId: existingCategory.companyId,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new Error('A category with this name already exists');
      }
    }

    const category = await prisma.jobSheetTemplateCategory.update({
      where: { id },
      data,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return category;
  },

  /**
   * Delete category
   */
  async delete(id: string) {
    // Check if category exists
    const existingCategory = await prisma.jobSheetTemplateCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            templates: true,
          },
        },
      },
    });

    if (!existingCategory) {
      throw new Error('Job sheet template category not found');
    }

    // Check if category has templates
    if (existingCategory._count.templates > 0) {
      throw new Error('Cannot delete category that has templates assigned to it');
    }

    await prisma.jobSheetTemplateCategory.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  },

  /**
   * Toggle category status
   */
  async toggleStatus(id: string) {
    const category = await prisma.jobSheetTemplateCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new Error('Job sheet template category not found');
    }

    const updated = await prisma.jobSheetTemplateCategory.update({
      where: { id },
      data: {
        isActive: !category.isActive,
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

    return updated;
  },
};
