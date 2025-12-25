import { PrismaClient } from '@prisma/client';
import { S3Service } from './s3Service';

const prisma = new PrismaClient();

export interface CreateCustomerDTO {
  name: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
  idProofType?: string;
  idProofDocumentUrl?: string;
  remarks?: string;
  companyId: string;
  branchId?: string;
}

export interface UpdateCustomerDTO {
  name?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
  idProofType?: string;
  idProofDocumentUrl?: string | null;
  remarks?: string;
  branchId?: string;
}

export interface CustomerFilters {
  companyId: string;
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class CustomerService {
  /**
   * Validate phone number format (10 digits)
   */
  private static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Check if phone number already exists for a company
   */
  static async checkPhoneAvailability(
    phone: string,
    companyId: string,
    excludeCustomerId?: string
  ): Promise<boolean> {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone,
        companyId,
        ...(excludeCustomerId && { id: { not: excludeCustomerId } }),
      },
    });

    return !existingCustomer;
  }

  /**
   * Create a new customer
   */
  static async createCustomer(data: CreateCustomerDTO) {
    // Validate phone number format
    if (!this.validatePhoneNumber(data.phone)) {
      throw new Error('Phone number must be exactly 10 digits');
    }

    // Check if phone already exists for this company
    const isPhoneAvailable = await this.checkPhoneAvailability(
      data.phone,
      data.companyId
    );

    if (!isPhoneAvailable) {
      throw new Error('Phone number already exists for this company');
    }

    // Create customer with S3 URL if provided
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        whatsappNumber: data.whatsappNumber,
        email: data.email,
        address: data.address,
        idProofType: data.idProofType,
        idProofDocument: data.idProofDocumentUrl || null,
        remarks: data.remarks,
        companyId: data.companyId,
        branchId: data.branchId,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    return customer;
  }

  /**
   * Get all customers with filters and pagination
   */
  static async getAllCustomers(filters: CustomerFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      companyId: filters.companyId,
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.customer.count({ where });

    // Get customers
    const customers = await prisma.customer.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        _count: {
          select: { services: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(id: string, companyId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, companyId },
      include: {
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        services: {
          include: {
            assignedTo: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  /**
   * Update customer
   */
  static async updateCustomer(
    id: string,
    companyId: string,
    data: UpdateCustomerDTO
  ) {
    // Check if customer exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { id, companyId },
    });

    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // Validate phone number if being updated
    if (data.phone) {
      if (!this.validatePhoneNumber(data.phone)) {
        throw new Error('Phone number must be exactly 10 digits');
      }

      // Check if new phone already exists
      const isPhoneAvailable = await this.checkPhoneAvailability(
        data.phone,
        companyId,
        id
      );

      if (!isPhoneAvailable) {
        throw new Error('Phone number already exists for this company');
      }
    }

    // Handle ID proof document upload/deletion with S3
    let idProofDocumentPath = existingCustomer.idProofDocument;

    if (data.idProofDocumentUrl === null) {
      // Delete existing document from S3
      if (existingCustomer.idProofDocument && S3Service.isS3Url(existingCustomer.idProofDocument)) {
        await S3Service.deleteFileByUrl(existingCustomer.idProofDocument);
      }
      idProofDocumentPath = null;
    } else if (data.idProofDocumentUrl) {
      // Delete old file from S3 if it exists
      if (existingCustomer.idProofDocument && S3Service.isS3Url(existingCustomer.idProofDocument)) {
        await S3Service.deleteFileByUrl(existingCustomer.idProofDocument);
      }
      idProofDocumentPath = data.idProofDocumentUrl;
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
        ...(data.whatsappNumber !== undefined && { whatsappNumber: data.whatsappNumber }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.idProofType !== undefined && { idProofType: data.idProofType }),
        ...(idProofDocumentPath !== existingCustomer.idProofDocument && {
          idProofDocument: idProofDocumentPath,
        }),
        ...(data.remarks !== undefined && { remarks: data.remarks }),
        ...(data.branchId !== undefined && { branchId: data.branchId }),
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    return customer;
  }

  /**
   * Delete customer
   */
  static async deleteCustomer(id: string, companyId: string) {
    // Check if customer exists
    const customer = await prisma.customer.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check if customer has services
    if (customer._count.services > 0) {
      throw new Error(
        'Cannot delete customer with existing service records. Please delete or reassign services first.'
      );
    }

    // Delete ID proof document from S3 if exists
    if (customer.idProofDocument && S3Service.isS3Url(customer.idProofDocument)) {
      await S3Service.deleteFileByUrl(customer.idProofDocument);
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id },
    });

    return { message: 'Customer deleted successfully' };
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(companyId: string, branchId?: string) {
    const where: any = { companyId };
    if (branchId) {
      where.branchId = branchId;
    }

    const totalCustomers = await prisma.customer.count({ where });

    const customersWithServices = await prisma.customer.count({
      where: {
        ...where,
        services: {
          some: {},
        },
      },
    });

    const recentCustomers = await prisma.customer.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    return {
      totalCustomers,
      customersWithServices,
      recentCustomers,
    };
  }
}
