import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import pdfGenerationService from './pdfGenerationService';

interface GenerateJobSheetData {
  serviceId: string;
  userId: string;
  templateId?: string;
}

export class JobSheetService {
  /**
   * Generate unique job sheet number
   * Format: JS-BRANCH-YYYYMMDD-XXX
   */
  private static async generateJobSheetNumber(branchId: string): Promise<string> {
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

      // Get count of job sheets created today for this branch
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));

      const todayCount = await prisma.jobSheet.count({
        where: {
          branchId,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      // Generate job sheet number
      const sequence = (todayCount + 1).toString().padStart(3, '0');
      const jobSheetNumber = `JS-${branch.code}-${dateStr}-${sequence}`;

      return jobSheetNumber;
    } catch (error) {
      Logger.error('Error generating job sheet number:', error);
      throw error;
    }
  }

  /**
   * Generate job sheet for a service
   */
  static async generateJobSheet(data: GenerateJobSheetData): Promise<any> {
    try {
      const { serviceId, userId, templateId } = data;

      // Check if service exists
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          customer: true,
          customerDevice: true,
          faults: {
            include: {
              fault: true,
            },
          },
          assignedTo: {
            select: { name: true },
          },
          branch: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              email: true,
            },
          },
          company: {
            select: {
              name: true,
              address: true,
              phone: true,
              email: true,
              logo: true,
            },
          },
        },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      // Check if job sheet already exists
      const existingJobSheet = await prisma.jobSheet.findUnique({
        where: { serviceId },
      });

      if (existingJobSheet) {
        // Return existing job sheet
        return existingJobSheet;
      }

      // Fetch template if provided, otherwise get default
      let template = null;
      if (templateId) {
        template = await prisma.jobSheetTemplate.findUnique({
          where: { id: templateId, isActive: true },
        });
      } else {
        // Get default template for the branch or company
        template = await prisma.jobSheetTemplate.findFirst({
          where: {
            companyId: service.companyId,
            isDefault: true,
            isActive: true,
            OR: [
              { branchId: service.branchId },
              { branchId: null },
            ],
          },
          orderBy: [
            { branchId: 'desc' }, // Prioritize branch-specific templates
            { createdAt: 'desc' },
          ],
        });
      }

      // Generate job sheet number
      const jobSheetNumber = await this.generateJobSheetNumber(service.branchId);

      // Prepare data for PDF generation
      const pdfData = {
        jobSheetNumber,
        service: {
          ticketNumber: service.ticketNumber,
          createdAt: service.createdAt,
          deviceModel: service.deviceModel,
          deviceIMEI: service.deviceIMEI || undefined,
          devicePassword: service.devicePassword || undefined,
          issue: service.issue,
          diagnosis: service.diagnosis || undefined,
          estimatedCost: service.estimatedCost,
          advancePayment: service.advancePayment,
        },
        customer: {
          name: service.customer.name,
          phone: service.customer.phone,
          address: service.customer.address || undefined,
          email: service.customer.email || undefined,
        },
        customerDevice: service.customerDevice
          ? {
              color: service.customerDevice.color || undefined,
            }
          : undefined,
        branch: service.branch,
        company: service.company,
        technician: service.assignedTo || undefined,
        faults: service.faults?.map(f => f.fault) || [],
        template: template ? {
          termsAndConditions: template.termsAndConditions || undefined,
          showCustomerSignature: template.showCustomerSignature,
          showAuthorizedSignature: template.showAuthorizedSignature,
          showCompanyLogo: template.showCompanyLogo,
          showContactDetails: template.showContactDetails,
          footerText: template.footerText || undefined,
        } : undefined,
      };

      // Generate PDF
      const pdfUrl = await pdfGenerationService.generateJobSheetPDF(pdfData);

      // Create job sheet record
      const jobSheet = await prisma.jobSheet.create({
        data: {
          jobSheetNumber,
          serviceId,
          generatedBy: userId,
          pdfUrl,
          templateId: template?.id,
          companyId: service.companyId,
          branchId: service.branchId,
        },
        include: {
          service: {
            select: {
              ticketNumber: true,
              deviceModel: true,
            },
          },
          generatedByUser: {
            select: {
              name: true,
            },
          },
        },
      });

      Logger.info(`Job sheet ${jobSheetNumber} generated for service ${service.ticketNumber}`);

      return jobSheet;
    } catch (error) {
      Logger.error('Error generating job sheet:', error);
      throw error;
    }
  }

  /**
   * Get job sheet by service ID
   */
  static async getJobSheetByServiceId(serviceId: string): Promise<any> {
    try {
      const jobSheet = await prisma.jobSheet.findUnique({
        where: { serviceId },
        include: {
          service: {
            select: {
              ticketNumber: true,
              deviceModel: true,
              customer: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
          generatedByUser: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!jobSheet) {
        throw new AppError(404, 'Job sheet not found');
      }

      return jobSheet;
    } catch (error) {
      Logger.error('Error fetching job sheet:', error);
      throw error;
    }
  }

  /**
   * Get job sheet by ID
   */
  static async getJobSheetById(jobSheetId: string): Promise<any> {
    try {
      const jobSheet = await prisma.jobSheet.findUnique({
        where: { id: jobSheetId },
        include: {
          service: {
            include: {
              customer: true,
              customerDevice: true,
              faults: {
                include: {
                  fault: true,
                },
              },
              assignedTo: {
                select: { name: true },
              },
              branch: true,
              company: true,
            },
          },
          generatedByUser: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!jobSheet) {
        throw new AppError(404, 'Job sheet not found');
      }

      return jobSheet;
    } catch (error) {
      Logger.error('Error fetching job sheet:', error);
      throw error;
    }
  }

  /**
   * Regenerate job sheet (useful when service data changes)
   */
  static async regenerateJobSheet(
    jobSheetId: string,
    userId: string
  ): Promise<any> {
    try {
      // Get existing job sheet
      const existingJobSheet = await prisma.jobSheet.findUnique({
        where: { id: jobSheetId },
        include: {
          service: {
            include: {
              customer: true,
              customerDevice: true,
              faults: {
                include: {
                  fault: true,
                },
              },
              assignedTo: {
                select: { name: true },
              },
              branch: true,
              company: true,
            },
          },
        },
      });

      if (!existingJobSheet) {
        throw new AppError(404, 'Job sheet not found');
      }

      const service = existingJobSheet.service;

      // Fetch template used in the existing job sheet
      let template = null;
      if (existingJobSheet.templateId) {
        template = await prisma.jobSheetTemplate.findUnique({
          where: { id: existingJobSheet.templateId },
        });
      }

      // Prepare data for PDF generation
      const pdfData = {
        jobSheetNumber: existingJobSheet.jobSheetNumber,
        service: {
          ticketNumber: service.ticketNumber,
          createdAt: service.createdAt,
          deviceModel: service.deviceModel,
          deviceIMEI: service.deviceIMEI || undefined,
          devicePassword: service.devicePassword || undefined,
          issue: service.issue,
          diagnosis: service.diagnosis || undefined,
          estimatedCost: service.estimatedCost,
          advancePayment: service.advancePayment,
        },
        customer: {
          name: service.customer.name,
          phone: service.customer.phone,
          address: service.customer.address || undefined,
          email: service.customer.email || undefined,
        },
        customerDevice: service.customerDevice
          ? {
              color: service.customerDevice.color || undefined,
            }
          : undefined,
        branch: service.branch,
        company: service.company,
        technician: service.assignedTo || undefined,
        faults: service.faults?.map(f => f.fault) || [],
        template: template ? {
          termsAndConditions: template.termsAndConditions || undefined,
          showCustomerSignature: template.showCustomerSignature,
          showAuthorizedSignature: template.showAuthorizedSignature,
          showCompanyLogo: template.showCompanyLogo,
          showContactDetails: template.showContactDetails,
          footerText: template.footerText || undefined,
        } : undefined,
      };

      // Generate new PDF
      const pdfUrl = await pdfGenerationService.generateJobSheetPDF(pdfData);

      // Update job sheet with new PDF URL
      const updatedJobSheet = await prisma.jobSheet.update({
        where: { id: jobSheetId },
        data: {
          pdfUrl,
          updatedAt: new Date(),
        },
        include: {
          service: {
            select: {
              ticketNumber: true,
              deviceModel: true,
            },
          },
          generatedByUser: {
            select: {
              name: true,
            },
          },
        },
      });

      Logger.info(`Job sheet ${existingJobSheet.jobSheetNumber} regenerated`);

      return updatedJobSheet;
    } catch (error) {
      Logger.error('Error regenerating job sheet:', error);
      throw error;
    }
  }

  /**
   * Get all job sheets with filters
   */
  static async getJobSheets(filters: {
    companyId: string;
    branchId?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      const { companyId, branchId, page = 1, limit = 20 } = filters;

      const where: any = {
        companyId,
      };

      if (branchId) {
        where.branchId = branchId;
      }

      const [jobSheets, total] = await Promise.all([
        prisma.jobSheet.findMany({
          where,
          include: {
            service: {
              select: {
                ticketNumber: true,
                deviceModel: true,
                customer: {
                  select: {
                    name: true,
                    phone: true,
                  },
                },
              },
            },
            generatedByUser: {
              select: {
                name: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.jobSheet.count({ where }),
      ]);

      return {
        data: jobSheets,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching job sheets:', error);
      throw error;
    }
  }
}

export default JobSheetService;
