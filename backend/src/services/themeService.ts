import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateThemeData {
  name: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  fontFamily?: string;
  fontSize?: number;
  logoUrl?: string;
  showBranchInfo?: boolean;
  showTermsAndConditions?: boolean;
  termsAndConditions?: string;
  footerText?: string;
  isDefault?: boolean;
  isActive?: boolean;
  companyId: string;
  branchId?: string;
  createdBy: string;
}

export interface UpdateThemeData {
  name?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  fontFamily?: string;
  fontSize?: number;
  logoUrl?: string;
  showBranchInfo?: boolean;
  showTermsAndConditions?: boolean;
  termsAndConditions?: string;
  footerText?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export const themeService = {
  /**
   * Get all themes with filters and pagination
   */
  async getAll({
    companyId,
    branchId,
    isActive,
    isDefault,
    search,
    page = 1,
    limit = 20,
  }: {
    companyId: string;
    branchId?: string;
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
        { branchId: null }, // Include company-wide themes
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isDefault !== undefined) {
      where.isDefault = isDefault;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [themes, total] = await Promise.all([
      prisma.theme.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
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
      }),
      prisma.theme.count({ where }),
    ]);

    return {
      data: themes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get theme by ID
   */
  async getById(id: string) {
    const theme = await prisma.theme.findUnique({
      where: { id },
      include: {
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
      },
    });

    if (!theme) {
      throw new Error('Theme not found');
    }

    return theme;
  },

  /**
   * Get default theme for company/branch
   */
  async getDefaultTheme(companyId: string, branchId?: string) {
    // Try to find branch-specific default theme first
    if (branchId) {
      const branchTheme = await prisma.theme.findFirst({
        where: {
          companyId,
          branchId,
          isDefault: true,
          isActive: true,
        },
      });

      if (branchTheme) return branchTheme;
    }

    // Fall back to company-wide default theme
    const companyTheme = await prisma.theme.findFirst({
      where: {
        companyId,
        branchId: null,
        isDefault: true,
        isActive: true,
      },
    });

    return companyTheme;
  },

  /**
   * Create new theme
   */
  async create(data: CreateThemeData) {
    // If setting as default, unset other defaults in same scope
    if (data.isDefault) {
      await prisma.theme.updateMany({
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

    const theme = await prisma.theme.create({
      data,
      include: {
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

    return theme;
  },

  /**
   * Update theme
   */
  async update(id: string, data: UpdateThemeData) {
    // Check if theme exists
    const existingTheme = await prisma.theme.findUnique({
      where: { id },
    });

    if (!existingTheme) {
      throw new Error('Theme not found');
    }

    // If setting as default, unset other defaults in same scope
    if (data.isDefault) {
      await prisma.theme.updateMany({
        where: {
          companyId: existingTheme.companyId,
          branchId: existingTheme.branchId,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const theme = await prisma.theme.update({
      where: { id },
      data,
      include: {
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

    return theme;
  },

  /**
   * Delete theme
   */
  async delete(id: string) {
    // Check if theme exists
    const theme = await prisma.theme.findUnique({
      where: { id },
    });

    if (!theme) {
      throw new Error('Theme not found');
    }

    // Prevent deletion of default theme
    if (theme.isDefault) {
      throw new Error('Cannot delete default theme. Please set another theme as default first.');
    }

    await prisma.theme.delete({
      where: { id },
    });

    return { message: 'Theme deleted successfully' };
  },

  /**
   * Toggle theme active status
   */
  async toggleStatus(id: string) {
    const theme = await prisma.theme.findUnique({
      where: { id },
    });

    if (!theme) {
      throw new Error('Theme not found');
    }

    // Prevent deactivating default theme
    if (theme.isDefault && theme.isActive) {
      throw new Error('Cannot deactivate default theme. Please set another theme as default first.');
    }

    const updatedTheme = await prisma.theme.update({
      where: { id },
      data: {
        isActive: !theme.isActive,
      },
    });

    return updatedTheme;
  },

  /**
   * Set theme as default
   */
  async setAsDefault(id: string) {
    const theme = await prisma.theme.findUnique({
      where: { id },
    });

    if (!theme) {
      throw new Error('Theme not found');
    }

    // Unset other defaults in same scope
    await prisma.theme.updateMany({
      where: {
        companyId: theme.companyId,
        branchId: theme.branchId,
        isDefault: true,
        id: { not: id },
      },
      data: {
        isDefault: false,
      },
    });

    // Set this theme as default and active
    const updatedTheme = await prisma.theme.update({
      where: { id },
      data: {
        isDefault: true,
        isActive: true,
      },
    });

    return updatedTheme;
  },
};
