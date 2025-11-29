import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

export interface CustomerDeviceFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  brandId?: string;
  modelId?: string;
  conditionId?: string;
}

export interface CreateCustomerDeviceData {
  customerId: string;
  brandId: string;
  modelId: string;
  imei?: string;
  color?: string;
  password?: string;
  pattern?: string;
  conditionId?: string;
  accessories?: string[];
  purchaseYear?: number;
  notes?: string;
  companyId: string;
  branchId?: string;
}

export interface UpdateCustomerDeviceData {
  brandId?: string;
  modelId?: string;
  imei?: string;
  color?: string;
  password?: string;
  pattern?: string;
  conditionId?: string;
  accessories?: string[];
  purchaseYear?: number;
  notes?: string;
  isActive?: boolean;
}

export default class CustomerDeviceService {
  /**
   * Get all devices for a customer with pagination and filters
   */
  static async getAllCustomerDevices(
    customerId: string,
    companyId: string,
    filters: CustomerDeviceFilters = {}
  ) {
    const {
      page = 1,
      limit = 50,
      search,
      isActive,
      brandId,
      modelId,
      conditionId,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {
      customerId,
      companyId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    if (modelId) {
      where.modelId = modelId;
    }

    if (conditionId) {
      where.conditionId = conditionId;
    }

    if (search) {
      where.OR = [
        { imei: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
        { model: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [devices, total] = await Promise.all([
      prisma.customerDevice.findMany({
        where,
        skip,
        take: limit,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          model: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          condition: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          _count: {
            select: {
              services: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.customerDevice.count({ where }),
    ]);

    return {
      devices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single customer device by ID
   */
  static async getCustomerDeviceById(
    id: string,
    customerId: string,
    companyId: string
  ) {
    const device = await prisma.customerDevice.findFirst({
      where: {
        id,
        customerId,
        companyId,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        model: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        condition: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    if (!device) {
      throw new AppError(404, 'Customer device not found');
    }

    return device;
  }

  /**
   * Create a new customer device
   */
  static async createCustomerDevice(data: CreateCustomerDeviceData) {
    const { customerId, brandId, modelId, companyId, ...deviceData } = data;

    // Verify customer exists and belongs to company
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!customer) {
      throw new AppError(404, 'Customer not found or inactive');
    }

    // Verify brand exists and belongs to company
    const brand = await prisma.itemBrand.findFirst({
      where: {
        id: brandId,
        companyId,
        isActive: true,
      },
    });

    if (!brand) {
      throw new AppError(404, 'Brand not found or inactive');
    }

    // Verify model exists and belongs to the selected brand
    const model = await prisma.itemModel.findFirst({
      where: {
        id: modelId,
        brandId,
        companyId,
        isActive: true,
      },
    });

    if (!model) {
      throw new AppError(404, 'Model not found, inactive, or does not belong to selected brand');
    }

    // Sanitize conditionId and branchId - remove if empty string
    if (deviceData.conditionId === '' || deviceData.conditionId === null) {
      delete deviceData.conditionId;
    }
    if (deviceData.branchId === '' || deviceData.branchId === null) {
      delete deviceData.branchId;
    }

    // Verify condition exists if provided
    if (deviceData.conditionId) {
      const condition = await prisma.deviceCondition.findFirst({
        where: {
          id: deviceData.conditionId,
          companyId,
          isActive: true,
        },
      });

      if (!condition) {
        throw new AppError(404, 'Device condition not found or inactive');
      }
    }

    // Check if IMEI already exists for this customer (if provided)
    if (deviceData.imei) {
      const existingDevice = await prisma.customerDevice.findFirst({
        where: {
          customerId,
          imei: deviceData.imei,
          isActive: true,
        },
      });

      if (existingDevice) {
        throw new AppError(400, 'A device with this IMEI already exists for this customer');
      }
    }

    const device = await prisma.customerDevice.create({
      data: {
        customerId,
        brandId,
        modelId,
        companyId,
        ...deviceData,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        model: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        condition: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return device;
  }

  /**
   * Update a customer device
   */
  static async updateCustomerDevice(
    id: string,
    customerId: string,
    companyId: string,
    data: UpdateCustomerDeviceData
  ) {
    // Verify device exists and belongs to customer
    const existingDevice = await prisma.customerDevice.findFirst({
      where: {
        id,
        customerId,
        companyId,
      },
    });

    if (!existingDevice) {
      throw new AppError(404, 'Customer device not found');
    }

    // If brandId is being updated, verify it exists
    if (data.brandId) {
      const brand = await prisma.itemBrand.findFirst({
        where: {
          id: data.brandId,
          companyId,
          isActive: true,
        },
      });

      if (!brand) {
        throw new AppError(404, 'Brand not found or inactive');
      }
    }

    // If modelId is being updated, verify it exists and belongs to the brand
    if (data.modelId) {
      const brandId = data.brandId || existingDevice.brandId;
      const model = await prisma.itemModel.findFirst({
        where: {
          id: data.modelId,
          brandId,
          companyId,
          isActive: true,
        },
      });

      if (!model) {
        throw new AppError(404, 'Model not found, inactive, or does not belong to selected brand');
      }
    }

    // Sanitize conditionId - remove if empty string
    if (data.conditionId === '' || data.conditionId === null) {
      delete data.conditionId;
    }

    // If conditionId is being updated, verify it exists
    if (data.conditionId) {
      const condition = await prisma.deviceCondition.findFirst({
        where: {
          id: data.conditionId,
          companyId,
          isActive: true,
        },
      });

      if (!condition) {
        throw new AppError(404, 'Device condition not found or inactive');
      }
    }

    // Check IMEI uniqueness if being updated
    if (data.imei && data.imei !== existingDevice.imei) {
      const duplicateDevice = await prisma.customerDevice.findFirst({
        where: {
          customerId,
          imei: data.imei,
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicateDevice) {
        throw new AppError(400, 'A device with this IMEI already exists for this customer');
      }
    }

    const device = await prisma.customerDevice.update({
      where: { id },
      data,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        model: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        condition: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return device;
  }

  /**
   * Deactivate (soft delete) a customer device
   */
  static async deactivateCustomerDevice(
    id: string,
    customerId: string,
    companyId: string
  ) {
    // Verify device exists and belongs to customer
    const device = await prisma.customerDevice.findFirst({
      where: {
        id,
        customerId,
        companyId,
      },
      include: {
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    if (!device) {
      throw new AppError(404, 'Customer device not found');
    }

    // Check if device is used in any active services
    const activeServicesCount = await prisma.service.count({
      where: {
        customerDeviceId: id,
        status: {
          in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'],
        },
      },
    });

    if (activeServicesCount > 0) {
      throw new AppError(
        400,
        `Cannot deactivate device. It is currently used in ${activeServicesCount} active service(s)`
      );
    }

    await prisma.customerDevice.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Customer device deactivated successfully' };
  }

  /**
   * Get service history for a device
   */
  static async getDeviceServiceHistory(
    deviceId: string,
    customerId: string,
    companyId: string
  ) {
    // Verify device exists and belongs to customer
    const device = await prisma.customerDevice.findFirst({
      where: {
        id: deviceId,
        customerId,
        companyId,
      },
    });

    if (!device) {
      throw new AppError(404, 'Customer device not found');
    }

    const services = await prisma.service.findMany({
      where: {
        customerDeviceId: deviceId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      device: {
        id: device.id,
        brand: device.brandId,
        model: device.modelId,
        imei: device.imei,
        color: device.color,
      },
      services,
      totalServices: services.length,
    };
  }

  /**
   * Get devices summary for a customer
   */
  static async getCustomerDevicesSummary(customerId: string, companyId: string) {
    const [totalDevices, activeDevices, devicesWithServices] = await Promise.all([
      prisma.customerDevice.count({
        where: {
          customerId,
          companyId,
        },
      }),
      prisma.customerDevice.count({
        where: {
          customerId,
          companyId,
          isActive: true,
        },
      }),
      prisma.customerDevice.count({
        where: {
          customerId,
          companyId,
          services: {
            some: {},
          },
        },
      }),
    ]);

    return {
      totalDevices,
      activeDevices,
      inactiveDevices: totalDevices - activeDevices,
      devicesWithServices,
      devicesWithoutServices: totalDevices - devicesWithServices,
    };
  }
}
