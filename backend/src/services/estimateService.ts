import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { EstimateStatus } from '@prisma/client';
import pdfGenerationService from './pdfGenerationService';
import InvoiceService from './invoiceService';

interface EstimateItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface CreateEstimateData {
  customerId: string;
  serviceId?: string;
  items: EstimateItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  validUntil?: Date;
  notes?: string;
  createdBy: string;
  companyId: string;
  branchId: string;
}

interface UpdateEstimateData {
  items?: EstimateItem[];
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  validUntil?: Date;
  notes?: string;
}

interface EstimateFilters {
  companyId: string;
  branchId?: string;
  status?: EstimateStatus;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

export class EstimateService {
  /**
   * Generate unique estimate number
   * Format: EST-BRANCH-YYYYMMDD-XXX
   */
  private static async generateEstimateNumber(branchId: string): Promise<string> {
    try {
      // Get branch code
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { code: true },
      });

      if (!branch) {
        throw new AppError(404, 'Branch not found');
      }

      // Get today's date in YYYYMMDD format
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

      // Get count of estimates created today for this branch
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));

      const todayCount = await prisma.estimate.count({
        where: {
          branchId,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      // Generate estimate number
      const sequence = (todayCount + 1).toString().padStart(3, '0');
      const estimateNumber = `EST-${branch.code}-${dateStr}-${sequence}`;

      return estimateNumber;
    } catch (error) {
      Logger.error('Error generating estimate number:', error);
      throw error;
    }
  }

  /**
   * Create new estimate
   */
  static async createEstimate(data: CreateEstimateData): Promise<any> {
    try {
      const {
        customerId,
        serviceId,
        items,
        subtotal,
        taxAmount,
        totalAmount,
        validUntil,
        notes,
        createdBy,
        companyId,
        branchId,
      } = data;

      // Verify customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new AppError(404, 'Customer not found');
      }

      // If serviceId provided, verify service exists and doesn't already have an estimate
      if (serviceId) {
        const service = await prisma.service.findUnique({
          where: { id: serviceId },
        });

        if (!service) {
          throw new AppError(404, 'Service not found');
        }

        // Check if service already has an estimate
        const existingEstimate = await prisma.estimate.findUnique({
          where: { serviceId },
        });

        if (existingEstimate) {
          throw new AppError(400, 'Service already has an estimate');
        }
      }

      // Generate estimate number
      const estimateNumber = await this.generateEstimateNumber(branchId);

      // Create estimate with items in transaction
      const estimate = await prisma.$transaction(async (tx) => {
        // Create estimate
        const newEstimate = await tx.estimate.create({
          data: {
            estimateNumber,
            customerId,
            serviceId,
            status: EstimateStatus.DRAFT,
            subtotal,
            taxAmount,
            totalAmount,
            validUntil,
            notes,
            companyId,
            branchId,
            createdBy,
          },
          include: {
            customer: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
            service: {
              select: {
                ticketNumber: true,
                deviceModel: true,
                damageCondition: true,
              },
            },
          },
        });

        // Create estimate items
        if (items && items.length > 0) {
          await tx.estimateItem.createMany({
            data: items.map((item) => ({
              estimateId: newEstimate.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })),
          });
        }

        return newEstimate;
      });

      Logger.info(`Estimate ${estimateNumber} created`, { estimateId: estimate.id });

      // Fetch complete estimate with items
      return await this.getEstimateById(estimate.id, companyId);
    } catch (error) {
      Logger.error('Error creating estimate:', error);
      throw error;
    }
  }

  /**
   * Get estimate by ID
   */
  static async getEstimateById(estimateId: string, companyId: string): Promise<any> {
    try {
      const estimate = await prisma.estimate.findFirst({
        where: {
          id: estimateId,
          companyId,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              address: true,
            },
          },
          service: {
            select: {
              id: true,
              ticketNumber: true,
              deviceModel: true,
              damageCondition: true,
            },
          },
          items: {
            orderBy: { createdAt: 'asc' },
          },
          convertedInvoice: {
            select: {
              id: true,
              invoiceNumber: true,
              createdAt: true,
            },
          },
        },
      });

      if (!estimate) {
        throw new AppError(404, 'Estimate not found');
      }

      return estimate;
    } catch (error) {
      Logger.error('Error fetching estimate:', error);
      throw error;
    }
  }

  /**
   * Get estimates with filters and pagination
   */
  static async getEstimates(filters: EstimateFilters): Promise<any> {
    try {
      const {
        companyId,
        branchId,
        status,
        customerId,
        startDate,
        endDate,
        searchTerm,
        page = 1,
        limit = 20,
      } = filters;

      const where: any = {
        companyId,
      };

      // Branch filter
      if (branchId) {
        where.branchId = branchId;
      }

      // Status filter
      if (status) {
        where.status = status;
      }

      // Customer filter
      if (customerId) {
        where.customerId = customerId;
      }

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Search filter (estimate number, customer name)
      if (searchTerm) {
        where.OR = [
          { estimateNumber: { contains: searchTerm, mode: 'insensitive' } },
          {
            customer: {
              name: { contains: searchTerm, mode: 'insensitive' },
            },
          },
          {
            service: {
              ticketNumber: { contains: searchTerm, mode: 'insensitive' },
            },
          },
        ];
      }

      const [estimates, total] = await Promise.all([
        prisma.estimate.findMany({
          where,
          include: {
            customer: {
              select: {
                name: true,
                phone: true,
              },
            },
            service: {
              select: {
                ticketNumber: true,
              },
            },
            _count: {
              select: {
                items: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.estimate.count({ where }),
      ]);

      return {
        data: estimates,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching estimates:', error);
      throw error;
    }
  }

  /**
   * Update estimate
   */
  static async updateEstimate(
    estimateId: string,
    data: UpdateEstimateData,
    companyId: string
  ): Promise<any> {
    try {
      // Get existing estimate
      const existingEstimate = await prisma.estimate.findFirst({
        where: {
          id: estimateId,
          companyId,
        },
      });

      if (!existingEstimate) {
        throw new AppError(404, 'Estimate not found');
      }

      // Check if estimate can be updated (only DRAFT estimates)
      if (existingEstimate.status !== EstimateStatus.DRAFT) {
        throw new AppError(400, 'Only draft estimates can be updated');
      }

      const { items, subtotal, taxAmount, totalAmount, validUntil, notes } = data;

      // Update estimate with items in transaction
      const estimate = await prisma.$transaction(async (tx) => {
        // If items provided, delete old items and create new ones
        if (items && items.length > 0) {
          await tx.estimateItem.deleteMany({
            where: { estimateId },
          });

          await tx.estimateItem.createMany({
            data: items.map((item) => ({
              estimateId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })),
          });
        }

        // Update estimate
        const updated = await tx.estimate.update({
          where: { id: estimateId },
          data: {
            subtotal,
            taxAmount,
            totalAmount,
            validUntil,
            notes,
          },
        });

        return updated;
      });

      Logger.info(`Estimate ${estimate.estimateNumber} updated`);

      // Fetch complete estimate with items
      return await this.getEstimateById(estimateId, companyId);
    } catch (error) {
      Logger.error('Error updating estimate:', error);
      throw error;
    }
  }

  /**
   * Delete estimate
   */
  static async deleteEstimate(estimateId: string, companyId: string): Promise<void> {
    try {
      const estimate = await prisma.estimate.findFirst({
        where: {
          id: estimateId,
          companyId,
        },
      });

      if (!estimate) {
        throw new AppError(404, 'Estimate not found');
      }

      // Check if estimate can be deleted (only DRAFT or REJECTED)
      if (
        estimate.status !== EstimateStatus.DRAFT &&
        estimate.status !== EstimateStatus.REJECTED
      ) {
        throw new AppError(400, 'Only draft or rejected estimates can be deleted');
      }

      await prisma.estimate.delete({
        where: { id: estimateId },
      });

      Logger.info(`Estimate ${estimate.estimateNumber} deleted`);
    } catch (error) {
      Logger.error('Error deleting estimate:', error);
      throw error;
    }
  }

  /**
   * Update estimate status
   */
  static async updateEstimateStatus(
    estimateId: string,
    status: EstimateStatus,
    companyId: string
  ): Promise<any> {
    try {
      const estimate = await prisma.estimate.findFirst({
        where: {
          id: estimateId,
          companyId,
        },
      });

      if (!estimate) {
        throw new AppError(404, 'Estimate not found');
      }

      // Validate status transition
      const validTransitions: Record<EstimateStatus, EstimateStatus[]> = {
        [EstimateStatus.DRAFT]: [EstimateStatus.SENT],
        [EstimateStatus.SENT]: [EstimateStatus.APPROVED, EstimateStatus.REJECTED, EstimateStatus.EXPIRED],
        [EstimateStatus.APPROVED]: [EstimateStatus.CONVERTED],
        [EstimateStatus.REJECTED]: [],
        [EstimateStatus.CONVERTED]: [],
        [EstimateStatus.EXPIRED]: [],
      };

      if (!validTransitions[estimate.status].includes(status)) {
        throw new AppError(
          400,
          `Cannot change estimate status from ${estimate.status} to ${status}`
        );
      }

      const updateData: any = { status };

      // Set timestamps based on status
      if (status === EstimateStatus.SENT) {
        updateData.sentAt = new Date();
      } else if (status === EstimateStatus.APPROVED) {
        updateData.approvedAt = new Date();
      } else if (status === EstimateStatus.CONVERTED) {
        updateData.convertedAt = new Date();
      }

      const updatedEstimate = await prisma.estimate.update({
        where: { id: estimateId },
        data: updateData,
      });

      Logger.info(`Estimate ${estimate.estimateNumber} status changed to ${status}`);

      return await this.getEstimateById(estimateId, companyId);
    } catch (error) {
      Logger.error('Error updating estimate status:', error);
      throw error;
    }
  }

  /**
   * Send estimate to customer
   */
  static async sendEstimate(
    estimateId: string,
    email: string,
    companyId: string
  ): Promise<any> {
    try {
      const estimate = await this.getEstimateById(estimateId, companyId);

      if (estimate.status !== EstimateStatus.DRAFT) {
        throw new AppError(400, 'Only draft estimates can be sent');
      }

      // Generate PDF if not exists
      if (!estimate.pdfUrl) {
        await this.regenerateEstimatePDF(estimateId, companyId);
      }

      // TODO: Implement email sending logic here
      // For now, just update status to SENT

      const updatedEstimate = await this.updateEstimateStatus(
        estimateId,
        EstimateStatus.SENT,
        companyId
      );

      Logger.info(`Estimate ${estimate.estimateNumber} sent to ${email}`);

      return updatedEstimate;
    } catch (error) {
      Logger.error('Error sending estimate:', error);
      throw error;
    }
  }

  /**
   * Approve estimate
   */
  static async approveEstimate(estimateId: string, companyId: string): Promise<any> {
    try {
      const estimate = await this.getEstimateById(estimateId, companyId);

      if (estimate.status !== EstimateStatus.SENT) {
        throw new AppError(400, 'Only sent estimates can be approved');
      }

      const updatedEstimate = await this.updateEstimateStatus(
        estimateId,
        EstimateStatus.APPROVED,
        companyId
      );

      Logger.info(`Estimate ${estimate.estimateNumber} approved`);

      return updatedEstimate;
    } catch (error) {
      Logger.error('Error approving estimate:', error);
      throw error;
    }
  }

  /**
   * Reject estimate
   */
  static async rejectEstimate(estimateId: string, companyId: string): Promise<any> {
    try {
      const estimate = await this.getEstimateById(estimateId, companyId);

      if (estimate.status !== EstimateStatus.SENT) {
        throw new AppError(400, 'Only sent estimates can be rejected');
      }

      const updatedEstimate = await this.updateEstimateStatus(
        estimateId,
        EstimateStatus.REJECTED,
        companyId
      );

      Logger.info(`Estimate ${estimate.estimateNumber} rejected`);

      return updatedEstimate;
    } catch (error) {
      Logger.error('Error rejecting estimate:', error);
      throw error;
    }
  }

  /**
   * Convert estimate to invoice
   */
  static async convertToInvoice(
    estimateId: string,
    userId: string,
    companyId: string
  ): Promise<any> {
    try {
      const estimate = await this.getEstimateById(estimateId, companyId);

      if (estimate.status !== EstimateStatus.APPROVED) {
        throw new AppError(400, 'Only approved estimates can be converted to invoice');
      }

      // Check if already converted
      if (estimate.convertedInvoice) {
        throw new AppError(400, 'Estimate already converted to invoice');
      }

      // Get branch info for invoice number generation
      const branch = await prisma.branch.findUnique({
        where: { id: estimate.branchId },
      });

      if (!branch) {
        throw new AppError(404, 'Branch not found');
      }

      // Create invoice with items in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Generate invoice number (using same logic as InvoiceService)
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));

        const todayCount = await tx.invoice.count({
          where: {
            branchId: estimate.branchId,
            createdAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        });

        const sequence = (todayCount + 1).toString().padStart(3, '0');
        const invoiceNumber = `INV-${branch.code}-${dateStr}-${sequence}`;

        // Create invoice
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            customerId: estimate.customerId,
            serviceId: estimate.serviceId,
            estimateId: estimate.id,
            totalAmount: estimate.totalAmount,
            paidAmount: 0,
            balanceAmount: estimate.totalAmount,
            paymentStatus: 'PENDING',
            companyId: estimate.companyId,
            branchId: estimate.branchId,
            notes: estimate.notes,
          },
        });

        // Create invoice items from estimate items
        if (estimate.items && estimate.items.length > 0) {
          await tx.invoiceItem.createMany({
            data: estimate.items.map((item: any) => ({
              invoiceId: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })),
          });
        }

        // Update estimate status to CONVERTED
        await tx.estimate.update({
          where: { id: estimateId },
          data: {
            status: EstimateStatus.CONVERTED,
            convertedAt: new Date(),
          },
        });

        return invoice;
      });

      Logger.info(`Estimate ${estimate.estimateNumber} converted to invoice ${result.invoiceNumber}`);

      return result;
    } catch (error) {
      Logger.error('Error converting estimate to invoice:', error);
      throw error;
    }
  }

  /**
   * Regenerate estimate PDF
   */
  static async regenerateEstimatePDF(estimateId: string, companyId: string, format: string = 'A4'): Promise<any> {
    try {
      const estimate = await this.getEstimateById(estimateId, companyId);

      // Get company and branch details
      const [company, branch] = await Promise.all([
        prisma.company.findUnique({
          where: { id: companyId },
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
            logo: true,
          },
        }),
        prisma.branch.findUnique({
          where: { id: estimate.branchId },
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        }),
      ]);

      if (!company || !branch) {
        throw new AppError(404, 'Company or branch not found');
      }

      // Prepare data for PDF generation
      const pdfData = {
        estimateNumber: estimate.estimateNumber,
        estimateDate: estimate.createdAt,
        validUntil: estimate.validUntil,
        customer: estimate.customer,
        service: estimate.service,
        items: estimate.items,
        subtotal: estimate.subtotal,
        taxAmount: estimate.taxAmount,
        totalAmount: estimate.totalAmount,
        notes: estimate.notes,
        company,
        branch,
      };

      // Generate PDF with specified format
      const pdfUrl = await pdfGenerationService.generateEstimatePDF(pdfData, format);

      // Update estimate with PDF URL only for A4 (default format)
      if (format.toLowerCase() === 'a4') {
        await prisma.estimate.update({
          where: { id: estimateId },
          data: { pdfUrl },
        });
      }

      Logger.info(`Estimate PDF regenerated for ${estimate.estimateNumber} in ${format} format`);

      return { pdfUrl };
    } catch (error) {
      Logger.error('Error regenerating estimate PDF:', error);
      throw error;
    }
  }
}

export default EstimateService;
