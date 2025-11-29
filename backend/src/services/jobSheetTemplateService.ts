import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateJobSheetTemplateData {
  name: string;
  description?: string;
  categoryId?: string;
  termsAndConditions?: string;
  showCustomerSignature?: boolean;
  showAuthorizedSignature?: boolean;
  showCompanyLogo?: boolean;
  showContactDetails?: boolean;
  footerText?: string;
  isDefault?: boolean;
  isActive?: boolean;
  companyId: string;
  branchId?: string;
  createdBy: string;
}

export interface UpdateJobSheetTemplateData {
  name?: string;
  description?: string;
  categoryId?: string;
  termsAndConditions?: string;
  showCustomerSignature?: boolean;
  showAuthorizedSignature?: boolean;
  showCompanyLogo?: boolean;
  showContactDetails?: boolean;
  footerText?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export const jobSheetTemplateService = {
  /**
   * Get all job sheet templates with filters and pagination
   */
  async getAll({
    companyId,
    branchId,
    categoryId,
    isActive,
    isDefault,
    search,
    page = 1,
    limit = 20,
  }: {
    companyId: string;
    branchId?: string;
    categoryId?: string;
    isActive?: boolean;
    isDefault?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
    };

    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null }, // Include company-wide templates
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isDefault !== undefined) {
      where.isDefault = isDefault;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.jobSheetTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          category: {
            select: {
              id: true,
              name: true,
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
              email: true,
            },
          },
          _count: {
            select: {
              jobSheets: true,
            },
          },
        },
      }),
      prisma.jobSheetTemplate.count({ where }),
    ]);

    return {
      data: templates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get template by ID
   */
  async getById(id: string) {
    const template = await prisma.jobSheetTemplate.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
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
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            jobSheets: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error('Job sheet template not found');
    }

    return template;
  },

  /**
   * Get default template for company/branch
   */
  async getDefaultTemplate(companyId: string, branchId?: string) {
    // Try to find branch-specific default template first
    if (branchId) {
      const branchTemplate = await prisma.jobSheetTemplate.findFirst({
        where: {
          companyId,
          branchId,
          isDefault: true,
          isActive: true,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (branchTemplate) return branchTemplate;
    }

    // Fall back to company-wide default template
    const companyTemplate = await prisma.jobSheetTemplate.findFirst({
      where: {
        companyId,
        branchId: null,
        isDefault: true,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return companyTemplate;
  },

  /**
   * Create new template
   */
  async create(data: CreateJobSheetTemplateData) {
    // If setting as default, unset other defaults in same scope
    if (data.isDefault) {
      await prisma.jobSheetTemplate.updateMany({
        where: {
          companyId: data.companyId,
          branchId: data.branchId || null,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Verify category exists if provided
    if (data.categoryId) {
      const category = await prisma.jobSheetTemplateCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error('Job sheet template category not found');
      }

      if (category.companyId !== data.companyId) {
        throw new Error('Category does not belong to this company');
      }
    }

    const template = await prisma.jobSheetTemplate.create({
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
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
            email: true,
          },
        },
      },
    });

    return template;
  },

  /**
   * Update template
   */
  async update(id: string, data: UpdateJobSheetTemplateData) {
    // Check if template exists
    const existingTemplate = await prisma.jobSheetTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      throw new Error('Job sheet template not found');
    }

    // If setting as default, unset other defaults in same scope
    if (data.isDefault) {
      await prisma.jobSheetTemplate.updateMany({
        where: {
          companyId: existingTemplate.companyId,
          branchId: existingTemplate.branchId,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Verify category exists if provided
    if (data.categoryId) {
      const category = await prisma.jobSheetTemplateCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error('Job sheet template category not found');
      }

      if (category.companyId !== existingTemplate.companyId) {
        throw new Error('Category does not belong to this company');
      }
    }

    const template = await prisma.jobSheetTemplate.update({
      where: { id },
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
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
            email: true,
          },
        },
      },
    });

    return template;
  },

  /**
   * Delete template
   */
  async delete(id: string) {
    // Check if template exists
    const existingTemplate = await prisma.jobSheetTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jobSheets: true,
          },
        },
      },
    });

    if (!existingTemplate) {
      throw new Error('Job sheet template not found');
    }

    // Check if template is being used
    if (existingTemplate._count.jobSheets > 0) {
      throw new Error('Cannot delete template that is being used by job sheets');
    }

    await prisma.jobSheetTemplate.delete({
      where: { id },
    });

    return { message: 'Template deleted successfully' };
  },

  /**
   * Toggle template status
   */
  async toggleStatus(id: string) {
    const template = await prisma.jobSheetTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error('Job sheet template not found');
    }

    const updated = await prisma.jobSheetTemplate.update({
      where: { id },
      data: {
        isActive: !template.isActive,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
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

    return updated;
  },

  /**
   * Set template as default
   */
  async setAsDefault(id: string) {
    const template = await prisma.jobSheetTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error('Job sheet template not found');
    }

    // Unset other defaults in same scope
    await prisma.jobSheetTemplate.updateMany({
      where: {
        companyId: template.companyId,
        branchId: template.branchId,
        isDefault: true,
        id: { not: id },
      },
      data: {
        isDefault: false,
      },
    });

    // Set this template as default
    const updated = await prisma.jobSheetTemplate.update({
      where: { id },
      data: {
        isDefault: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
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

    return updated;
  },
};
