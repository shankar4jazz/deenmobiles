import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';

interface WarrantyCheckResult {
  hasWarranty: boolean;
  warrantyRecord?: {
    id: string;
    warrantyNumber: string;
    itemId: string;
    itemName: string;
    warrantyDays: number;
    startDate: Date;
    endDate: Date;
    daysRemaining: number;
    isExpired: boolean;
    isClaimed: boolean;
    sourceType: string;
    serviceId?: string;
    invoiceId?: string;
  };
}

interface WarrantyFilters {
  customerId?: string;
  itemId?: string;
  branchId?: string;
  companyId: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'CLAIMED' | 'ALL';
  dateRange?: { start: Date; end: Date };
  page?: number;
  limit?: number;
}

interface WarrantyStats {
  totalActive: number;
  expiringThisMonth: number;
  claimedThisMonth: number;
  totalExpired: number;
}

export class WarrantyService {
  /**
   * Generate unique warranty number: WRT-{branchCode}-{YYYYMMDD}-{sequence}
   */
  static async generateWarrantyNumber(branchId: string): Promise<string> {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });

    if (!branch) {
      throw new AppError(404, 'Branch not found');
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get count of warranties created today for this branch
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await prisma.warrantyRecord.count({
      where: {
        branchId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(3, '0');
    return `WRT-${branch.code}-${dateStr}-${sequence}`;
  }

  /**
   * Calculate warranty end date
   */
  static calculateEndDate(startDate: Date, warrantyDays: number): Date {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + warrantyDays);
    return endDate;
  }

  /**
   * Calculate days remaining for warranty
   */
  static calculateDaysRemaining(endDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  /**
   * Create warranty records when service is delivered
   */
  static async createServiceWarrantyRecords(serviceId: string): Promise<void> {
    try {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          customer: true,
          branch: true,
          parts: {
            where: {
              status: 'APPROVED',
            },
            include: {
              item: true,
            },
          },
        },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      if (!service.deliveredAt) {
        throw new AppError(400, 'Service is not delivered yet');
      }

      // Create warranty record for each approved part with warranty
      const warrantyRecords = [];
      for (const part of service.parts) {
        const item = part.item;

        // Skip if item has no warranty
        if (!item || !item.warrantyDays || item.warrantyDays <= 0) {
          continue;
        }

        // Check if warranty already exists for this part
        const existingWarranty = await prisma.warrantyRecord.findUnique({
          where: { servicePartId: part.id },
        });

        if (existingWarranty) {
          continue; // Skip if already has warranty
        }

        const warrantyNumber = await this.generateWarrantyNumber(service.branchId);
        const startDate = service.deliveredAt;
        const endDate = this.calculateEndDate(startDate, item.warrantyDays);

        const warrantyRecord = await prisma.warrantyRecord.create({
          data: {
            warrantyNumber,
            sourceType: 'SERVICE',
            serviceId: service.id,
            servicePartId: part.id,
            itemId: item.id,
            customerId: service.customerId,
            warrantyDays: item.warrantyDays,
            startDate,
            endDate,
            companyId: service.companyId,
            branchId: service.branchId,
          },
        });

        warrantyRecords.push(warrantyRecord);
      }

      Logger.info(`Created ${warrantyRecords.length} warranty records for service ${serviceId}`);
    } catch (error) {
      Logger.error('Error creating service warranty records', error);
      throw error;
    }
  }

  /**
   * Create warranty records for direct sales (invoice without service)
   */
  static async createSaleWarrantyRecords(invoiceId: string): Promise<void> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          customer: true,
          branch: true,
          items: {
            include: {
              item: true,
            },
          },
        },
      });

      if (!invoice) {
        throw new AppError(404, 'Invoice not found');
      }

      // Only create warranty for standalone invoices (not linked to service)
      if (invoice.serviceId) {
        Logger.info(`Invoice ${invoiceId} is linked to service, skipping warranty creation`);
        return;
      }

      // Create warranty record for each item with warranty
      const warrantyRecords = [];
      for (const invoiceItem of invoice.items) {
        const item = invoiceItem.item;

        // Skip if no item or no warranty
        if (!item || !item.warrantyDays || item.warrantyDays <= 0) {
          continue;
        }

        // Check if warranty already exists for this invoice item
        const existingWarranty = await prisma.warrantyRecord.findFirst({
          where: {
            invoiceId: invoice.id,
            invoiceItemId: invoiceItem.id,
          },
        });

        if (existingWarranty) {
          continue; // Skip if already has warranty
        }

        const warrantyNumber = await this.generateWarrantyNumber(invoice.branchId);
        const startDate = invoice.createdAt;
        const endDate = this.calculateEndDate(startDate, item.warrantyDays);

        const warrantyRecord = await prisma.warrantyRecord.create({
          data: {
            warrantyNumber,
            sourceType: 'SALE',
            invoiceId: invoice.id,
            invoiceItemId: invoiceItem.id,
            itemId: item.id,
            customerId: invoice.customerId,
            warrantyDays: item.warrantyDays,
            startDate,
            endDate,
            companyId: invoice.companyId,
            branchId: invoice.branchId,
          },
        });

        warrantyRecords.push(warrantyRecord);
      }

      Logger.info(`Created ${warrantyRecords.length} warranty records for invoice ${invoiceId}`);
    } catch (error) {
      Logger.error('Error creating sale warranty records', error);
      throw error;
    }
  }

  /**
   * Check if customer has active warranty for an item
   */
  static async checkWarrantyStatus(
    customerId: string,
    itemId: string,
    companyId: string
  ): Promise<WarrantyCheckResult> {
    try {
      const today = new Date();

      const warrantyRecord = await prisma.warrantyRecord.findFirst({
        where: {
          customerId,
          itemId,
          companyId,
          isClaimed: false,
          endDate: { gte: today },
        },
        include: {
          item: {
            select: { id: true, itemName: true },
          },
          service: {
            select: { id: true, serviceNumber: true },
          },
          invoice: {
            select: { id: true, invoiceNumber: true },
          },
        },
        orderBy: { endDate: 'desc' }, // Get the one with latest expiry
      });

      if (!warrantyRecord) {
        return { hasWarranty: false };
      }

      const daysRemaining = this.calculateDaysRemaining(warrantyRecord.endDate);

      return {
        hasWarranty: true,
        warrantyRecord: {
          id: warrantyRecord.id,
          warrantyNumber: warrantyRecord.warrantyNumber,
          itemId: warrantyRecord.itemId,
          itemName: warrantyRecord.item?.itemName || 'Unknown',
          warrantyDays: warrantyRecord.warrantyDays,
          startDate: warrantyRecord.startDate,
          endDate: warrantyRecord.endDate,
          daysRemaining,
          isExpired: daysRemaining <= 0,
          isClaimed: warrantyRecord.isClaimed,
          sourceType: warrantyRecord.sourceType,
          serviceId: warrantyRecord.serviceId || undefined,
          invoiceId: warrantyRecord.invoiceId || undefined,
        },
      };
    } catch (error) {
      Logger.error('Error checking warranty status', error);
      throw error;
    }
  }

  /**
   * Check active warranties for a customer (all items)
   */
  static async getActiveWarrantiesForCustomer(
    customerId: string,
    companyId: string
  ): Promise<WarrantyCheckResult['warrantyRecord'][]> {
    try {
      const today = new Date();

      const warranties = await prisma.warrantyRecord.findMany({
        where: {
          customerId,
          companyId,
          isClaimed: false,
          endDate: { gte: today },
        },
        include: {
          item: {
            select: { id: true, itemName: true, itemCode: true },
          },
          service: {
            select: { id: true, serviceNumber: true },
          },
          invoice: {
            select: { id: true, invoiceNumber: true },
          },
        },
        orderBy: { endDate: 'asc' },
      });

      return warranties.map((w) => ({
        id: w.id,
        warrantyNumber: w.warrantyNumber,
        itemId: w.itemId,
        itemName: w.item?.itemName || 'Unknown',
        warrantyDays: w.warrantyDays,
        startDate: w.startDate,
        endDate: w.endDate,
        daysRemaining: this.calculateDaysRemaining(w.endDate),
        isExpired: false,
        isClaimed: w.isClaimed,
        sourceType: w.sourceType,
        serviceId: w.serviceId || undefined,
        invoiceId: w.invoiceId || undefined,
      }));
    } catch (error) {
      Logger.error('Error getting customer warranties', error);
      throw error;
    }
  }

  /**
   * Get warranty by ID
   */
  static async getWarrantyById(id: string, companyId: string) {
    try {
      const warranty = await prisma.warrantyRecord.findFirst({
        where: { id, companyId },
        include: {
          item: {
            select: { id: true, itemName: true, itemCode: true },
          },
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          service: {
            select: { id: true, serviceNumber: true, deviceName: true },
          },
          invoice: {
            select: { id: true, invoiceNumber: true },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
          claimService: {
            select: { id: true, serviceNumber: true },
          },
        },
      });

      if (!warranty) {
        throw new AppError(404, 'Warranty not found');
      }

      return {
        ...warranty,
        daysRemaining: this.calculateDaysRemaining(warranty.endDate),
        isExpired: new Date() > warranty.endDate,
      };
    } catch (error) {
      Logger.error('Error getting warranty by ID', error);
      throw error;
    }
  }

  /**
   * Search warranties with filters
   */
  static async searchWarranties(filters: WarrantyFilters) {
    try {
      const {
        customerId,
        itemId,
        branchId,
        companyId,
        status = 'ALL',
        dateRange,
        page = 1,
        limit = 20,
      } = filters;

      const skip = (page - 1) * limit;
      const today = new Date();

      // Build where clause
      const where: any = { companyId };

      if (customerId) {
        where.customerId = customerId;
      }

      if (itemId) {
        where.itemId = itemId;
      }

      if (branchId) {
        where.branchId = branchId;
      }

      if (status === 'ACTIVE') {
        where.isClaimed = false;
        where.endDate = { gte: today };
      } else if (status === 'EXPIRED') {
        where.isClaimed = false;
        where.endDate = { lt: today };
      } else if (status === 'CLAIMED') {
        where.isClaimed = true;
      }

      if (dateRange) {
        where.startDate = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      const warranties = await prisma.warrantyRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          item: {
            select: { id: true, itemName: true, itemCode: true },
          },
          customer: {
            select: { id: true, name: true, phone: true },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
          service: {
            select: { id: true, serviceNumber: true },
          },
          invoice: {
            select: { id: true, invoiceNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const total = await prisma.warrantyRecord.count({ where });

      return {
        warranties: warranties.map((w) => ({
          ...w,
          daysRemaining: this.calculateDaysRemaining(w.endDate),
          isExpired: new Date() > w.endDate,
          statusLabel: w.isClaimed
            ? 'CLAIMED'
            : new Date() > w.endDate
            ? 'EXPIRED'
            : 'ACTIVE',
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error searching warranties', error);
      throw error;
    }
  }

  /**
   * Get warranty statistics
   */
  static async getWarrantyStats(companyId: string, branchId?: string): Promise<WarrantyStats> {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const where: any = { companyId };
      if (branchId) {
        where.branchId = branchId;
      }

      // Active warranties (not expired, not claimed)
      const totalActive = await prisma.warrantyRecord.count({
        where: {
          ...where,
          isClaimed: false,
          endDate: { gte: today },
        },
      });

      // Expiring this month
      const expiringThisMonth = await prisma.warrantyRecord.count({
        where: {
          ...where,
          isClaimed: false,
          endDate: {
            gte: today,
            lte: endOfMonth,
          },
        },
      });

      // Claimed this month
      const claimedThisMonth = await prisma.warrantyRecord.count({
        where: {
          ...where,
          isClaimed: true,
          claimedAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      // Total expired (not claimed)
      const totalExpired = await prisma.warrantyRecord.count({
        where: {
          ...where,
          isClaimed: false,
          endDate: { lt: today },
        },
      });

      return {
        totalActive,
        expiringThisMonth,
        claimedThisMonth,
        totalExpired,
      };
    } catch (error) {
      Logger.error('Error getting warranty stats', error);
      throw error;
    }
  }

  /**
   * Mark warranty as claimed
   */
  static async markWarrantyClaimed(
    warrantyId: string,
    claimServiceId: string,
    claimReason: string,
    companyId: string
  ) {
    try {
      const warranty = await prisma.warrantyRecord.findFirst({
        where: { id: warrantyId, companyId },
      });

      if (!warranty) {
        throw new AppError(404, 'Warranty not found');
      }

      if (warranty.isClaimed) {
        throw new AppError(400, 'Warranty has already been claimed');
      }

      if (new Date() > warranty.endDate) {
        throw new AppError(400, 'Warranty has expired');
      }

      const updatedWarranty = await prisma.warrantyRecord.update({
        where: { id: warrantyId },
        data: {
          isClaimed: true,
          claimedAt: new Date(),
          claimServiceId,
          claimReason,
        },
        include: {
          item: {
            select: { id: true, itemName: true },
          },
          customer: {
            select: { id: true, name: true, phone: true },
          },
        },
      });

      Logger.info(`Warranty ${warrantyId} claimed for service ${claimServiceId}`);
      return updatedWarranty;
    } catch (error) {
      Logger.error('Error marking warranty as claimed', error);
      throw error;
    }
  }

  /**
   * Get warranties for a service (parts under warranty)
   */
  static async getServiceWarranties(serviceId: string) {
    try {
      const warranties = await prisma.warrantyRecord.findMany({
        where: { serviceId },
        include: {
          item: {
            select: { id: true, itemName: true, itemCode: true },
          },
          servicePart: true,
        },
        orderBy: { endDate: 'asc' },
      });

      return warranties.map((w) => ({
        ...w,
        daysRemaining: this.calculateDaysRemaining(w.endDate),
        isExpired: new Date() > w.endDate,
        statusLabel: w.isClaimed
          ? 'CLAIMED'
          : new Date() > w.endDate
          ? 'EXPIRED'
          : 'ACTIVE',
      }));
    } catch (error) {
      Logger.error('Error getting service warranties', error);
      throw error;
    }
  }

  /**
   * Get warranties for an invoice (items under warranty)
   */
  static async getInvoiceWarranties(invoiceId: string) {
    try {
      const warranties = await prisma.warrantyRecord.findMany({
        where: { invoiceId },
        include: {
          item: {
            select: { id: true, itemName: true, itemCode: true },
          },
        },
        orderBy: { endDate: 'asc' },
      });

      return warranties.map((w) => ({
        ...w,
        daysRemaining: this.calculateDaysRemaining(w.endDate),
        isExpired: new Date() > w.endDate,
        statusLabel: w.isClaimed
          ? 'CLAIMED'
          : new Date() > w.endDate
          ? 'EXPIRED'
          : 'ACTIVE',
      }));
    } catch (error) {
      Logger.error('Error getting invoice warranties', error);
      throw error;
    }
  }

  /**
   * Format warranty type to display label
   */
  static getWarrantyLabel(warrantyDays: number, warrantyType?: string): string {
    if (!warrantyDays || warrantyDays <= 0) {
      return 'No Warranty';
    }

    switch (warrantyType) {
      case '1_MONTH':
        return '1 Month Warranty';
      case '3_MONTHS':
        return '3 Months Warranty';
      case '6_MONTHS':
        return '6 Months Warranty';
      case '1_YEAR':
        return '1 Year Warranty';
      case 'CUSTOM':
        return `${warrantyDays} Days Warranty`;
      default:
        if (warrantyDays === 30) return '1 Month Warranty';
        if (warrantyDays === 90) return '3 Months Warranty';
        if (warrantyDays === 180) return '6 Months Warranty';
        if (warrantyDays === 365) return '1 Year Warranty';
        return `${warrantyDays} Days Warranty`;
    }
  }
}
