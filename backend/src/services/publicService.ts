import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';

// Customer-safe response interface (no internal data)
interface PublicServiceResponse {
  ticketNumber: string;
  deviceModel: string;
  status: string;
  statusLabel: string;
  estimatedCost: number;
  advancePayment: number;
  balanceAmount: number;
  createdAt: string;
  completedAt: string | null;
  deliveredAt: string | null;
  branch: {
    name: string;
    phone: string;
    address: string;
  };
  statusHistory: {
    status: string;
    statusLabel: string;
    timestamp: string;
    notes: string | null;
  }[];
  estimatedCompletionMessage: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Received - Pending Inspection',
  IN_PROGRESS: 'Repair in Progress',
  WAITING_PARTS: 'Waiting for Parts',
  COMPLETED: 'Repair Completed',
  DELIVERED: 'Delivered to Customer',
  CANCELLED: 'Service Cancelled',
};

export class PublicService {
  /**
   * Track service(s) by ticket number OR phone number
   * Returns customer-safe data only
   */
  static async trackService(
    ticketNumber?: string,
    phone?: string
  ): Promise<PublicServiceResponse | PublicServiceResponse[]> {
    try {
      if (ticketNumber) {
        // Single service lookup by ticket
        const service = await prisma.service.findUnique({
          where: { ticketNumber },
          include: {
            branch: {
              select: { name: true, phone: true, address: true },
            },
            customerDevice: {
              include: {
                brand: { select: { name: true } },
                model: { select: { name: true } },
              },
            },
            statusHistory: {
              orderBy: { createdAt: 'asc' },
              select: {
                status: true,
                notes: true,
                createdAt: true,
              },
            },
          },
        });

        if (!service) {
          throw new AppError(404, 'Service not found. Please check your ticket number.');
        }

        return this.formatServiceResponse(service);
      }

      if (phone) {
        // Clean phone number - remove spaces, dashes, and country code
        const cleanPhone = phone.replace(/[\s-]/g, '').replace(/^\+91/, '');

        // Multiple services lookup by phone
        const services = await prisma.service.findMany({
          where: {
            customer: {
              OR: [
                { phone: { contains: cleanPhone } },
                { whatsappNumber: { contains: cleanPhone } },
              ],
            },
          },
          include: {
            branch: {
              select: { name: true, phone: true, address: true },
            },
            customerDevice: {
              include: {
                brand: { select: { name: true } },
                model: { select: { name: true } },
              },
            },
            statusHistory: {
              orderBy: { createdAt: 'asc' },
              select: {
                status: true,
                notes: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit to recent 10 services
        });

        if (services.length === 0) {
          throw new AppError(404, 'No services found for this phone number.');
        }

        return services.map(s => this.formatServiceResponse(s));
      }

      throw new AppError(400, 'Please provide ticket number or phone number');
    } catch (error) {
      Logger.error('Error tracking service', { error, ticketNumber, phone });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to track service');
    }
  }

  /**
   * Format service data for public response
   * Removes sensitive information
   */
  private static formatServiceResponse(service: any): PublicServiceResponse {
    const balance = (service.actualCost || service.estimatedCost) - service.advancePayment;

    // Build device model string from brand and model
    let deviceModel = service.deviceModel || '';
    if (service.customerDevice) {
      const brandName = service.customerDevice.brand?.name || '';
      const modelName = service.customerDevice.model?.name || '';
      if (brandName || modelName) {
        deviceModel = `${brandName} ${modelName}`.trim();
      }
    }

    return {
      ticketNumber: service.ticketNumber,
      deviceModel: deviceModel || 'Device',
      status: service.status,
      statusLabel: STATUS_LABELS[service.status] || service.status,
      estimatedCost: service.estimatedCost || 0,
      advancePayment: service.advancePayment || 0,
      balanceAmount: Math.max(0, balance),
      createdAt: service.createdAt.toISOString(),
      completedAt: service.completedAt?.toISOString() || null,
      deliveredAt: service.deliveredAt?.toISOString() || null,
      branch: {
        name: service.branch?.name || 'Deen Mobiles',
        phone: service.branch?.phone || '',
        address: service.branch?.address || '',
      },
      statusHistory: (service.statusHistory || []).map((h: any) => ({
        status: h.status,
        statusLabel: STATUS_LABELS[h.status] || h.status,
        timestamp: h.createdAt.toISOString(),
        notes: h.notes ? this.sanitizeNotes(h.notes) : null,
      })),
      estimatedCompletionMessage: this.getEstimatedCompletionMessage(service.status),
    };
  }

  /**
   * Filter out internal notes - only show customer-friendly messages
   */
  private static sanitizeNotes(notes: string): string | null {
    // Skip internal notes that might contain sensitive info
    const internalPatterns = [
      /assigned to/i,
      /technician/i,
      /internal/i,
      /staff/i,
      /employee/i,
      /admin/i,
    ];

    for (const pattern of internalPatterns) {
      if (pattern.test(notes)) {
        return null;
      }
    }

    return notes;
  }

  /**
   * Get estimated completion message based on status
   */
  private static getEstimatedCompletionMessage(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Your device is being inspected. We will update the status soon.';
      case 'IN_PROGRESS':
        return 'Repair is in progress. Estimated completion within 1-2 business days.';
      case 'WAITING_PARTS':
        return 'Waiting for parts to arrive. This may take 3-5 business days.';
      case 'COMPLETED':
        return 'Repair is complete! Please visit the branch to collect your device.';
      case 'DELIVERED':
        return 'Your device has been delivered. Thank you for choosing us!';
      case 'CANCELLED':
        return 'This service was cancelled. Contact us for more information.';
      default:
        return '';
    }
  }

  /**
   * Get basic company info for portal branding
   */
  static async getCompanyInfo() {
    try {
      // Get first active company (assuming single-tenant for customer portal)
      const company = await prisma.company.findFirst({
        where: { isActive: true },
        select: {
          name: true,
          logo: true,
          phone: true,
        },
      });

      return {
        name: company?.name || 'Deen Mobiles',
        logo: company?.logo || null,
        supportPhone: company?.phone || '',
      };
    } catch (error) {
      Logger.error('Error getting company info', { error });
      return {
        name: 'Deen Mobiles',
        logo: null,
        supportPhone: '',
      };
    }
  }
}
