import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import pdfGenerationService from './pdfGenerationService';
import { DocumentNumberService } from './documentNumberService';
import { DocumentType } from '@prisma/client';

interface GenerateJobSheetData {
  serviceId: string;
  userId: string;
  templateId?: string;
  format?: 'A4' | 'A5' | 'thermal' | 'thermal-2' | 'thermal-3';
  copyType?: 'customer' | 'office' | 'both';
}

export class JobSheetService {
  /**
   * Generate unique job sheet number
   * Uses configurable format from DocumentNumberService
   */
  private static async generateJobSheetNumber(branchId: string, companyId: string): Promise<string> {
    try {
      // Use the configurable document number service
      const jobSheetNumber = await DocumentNumberService.generateNumber(
        companyId,
        DocumentType.JOB_SHEET,
        branchId
      );

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
      const { serviceId, userId, templateId, format = 'A4', copyType = 'customer' } = data;

      // Check if service exists with all related data
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          customer: true,
          customerDevice: {
            include: {
              brand: { select: { name: true } },
              model: { select: { name: true } },
            },
          },
          faults: {
            include: {
              fault: true,
            },
          },
          // Accessories received with the device
          accessories: {
            include: {
              accessory: { select: { id: true, name: true } },
            },
          },
          // Pre-existing damage conditions
          damageConditions: {
            include: {
              damageCondition: { select: { id: true, name: true } },
            },
          },
          // Parts used in service (both tagged and extra spare)
          partsUsed: {
            include: {
              part: { select: { id: true, name: true, partNumber: true } },
              item: { select: { id: true, itemName: true, itemCode: true } },
            },
          },
          assignedTo: {
            select: { id: true, name: true },
          },
          createdBy: {
            select: { id: true, name: true },
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
              gstin: true,
            },
          },
          previousService: {
            select: {
              ticketNumber: true,
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
      const jobSheetNumber = await this.generateJobSheetNumber(service.branchId, service.companyId);

      // Separate parts into tagged and extra spare
      const taggedParts = service.partsUsed
        ?.filter((p: any) => !p.isExtraSpare)
        .map((p: any) => ({
          id: p.id,
          partName: p.part?.name || p.item?.itemName || 'Unknown Part',
          partNumber: p.part?.partNumber || p.item?.itemCode || undefined,
          quantity: p.quantity,
          unitPrice: Number(p.unitPrice) || 0,
          totalPrice: Number(p.totalPrice) || 0,
          faultTag: p.faultTag || undefined,
        })) || [];

      const extraSpareParts = service.partsUsed
        ?.filter((p: any) => p.isExtraSpare)
        .map((p: any) => ({
          id: p.id,
          partName: p.part?.name || p.item?.itemName || 'Unknown Part',
          partNumber: p.part?.partNumber || p.item?.itemCode || undefined,
          quantity: p.quantity,
          unitPrice: Number(p.unitPrice) || 0,
          totalPrice: Number(p.totalPrice) || 0,
          isApproved: p.isApproved || false,
          approvalMethod: p.approvalMethod || undefined,
          approvalNote: p.approvalNote || undefined,
          approvedAt: p.approvedAt || undefined,
        })) || [];

      // Prepare accessories
      const accessories = service.accessories?.map((a: any) => ({
        id: a.accessory?.id,
        name: a.accessory?.name || 'Unknown',
        received: true,
      })) || [];

      // Prepare damage conditions
      const damageConditions = service.damageConditions?.map((d: any) => ({
        id: d.damageCondition?.id,
        name: d.damageCondition?.name || 'Unknown',
      })) || [];

      // Prepare data for PDF generation
      const pdfData = {
        jobSheetNumber,
        copyType,
        service: {
          ticketNumber: service.ticketNumber,
          createdAt: service.createdAt,
          deviceModel: service.deviceModel,
          deviceIMEI: service.deviceIMEI || undefined,
          devicePassword: service.devicePassword || undefined,
          devicePattern: service.devicePattern || undefined,
          deviceCondition: service.deviceCondition || undefined,
          intakeNotes: service.intakeNotes || undefined,
          issue: service.damageCondition,
          diagnosis: service.diagnosis || undefined,
          estimatedCost: Number(service.estimatedCost) || 0,
          labourCharge: Number(service.labourCharge) || 0,
          extraSpareAmount: Number(service.extraSpareAmount) || 0,
          discount: Number(service.discount) || 0,
          advancePayment: Number(service.advancePayment) || 0,
          actualCost: service.actualCost ? Number(service.actualCost) : undefined,
          isWarrantyRepair: service.isWarrantyRepair || false,
          warrantyReason: service.warrantyReason || undefined,
          isRepeatedService: !!service.previousServiceId,
          dataWarrantyAccepted: service.dataWarrantyAccepted || false,
        },
        customer: {
          name: service.customer.name,
          phone: service.customer.phone,
          address: service.customer.address || undefined,
          email: service.customer.email || undefined,
          whatsappNumber: service.customer.whatsappNumber || undefined,
          gstin: service.customer.gstin || undefined,
          idProofType: service.customer.idProofType || undefined,
        },
        customerDevice: service.customerDevice
          ? {
              brandName: service.customerDevice.brand?.name || undefined,
              modelName: service.customerDevice.model?.name || undefined,
              color: service.customerDevice.color || undefined,
              imei: service.customerDevice.imei || undefined,
            }
          : undefined,
        accessories,
        damageConditions,
        faults: service.faults?.map((f: any) => ({ id: f.fault?.id, name: f.fault?.name })) || [],
        taggedParts,
        extraSpareParts,
        branch: service.branch,
        company: {
          ...service.company,
          gst: service.company.gstin || undefined,
        },
        technician: service.assignedTo ? { id: service.assignedTo.id, name: service.assignedTo.name } : undefined,
        createdBy: service.createdBy ? { id: service.createdBy.id, name: service.createdBy.name } : undefined,
        template: template ? {
          termsAndConditions: template.termsAndConditions || undefined,
          showCustomerSignature: template.showCustomerSignature,
          showAuthorizedSignature: template.showAuthorizedSignature,
          showCompanyLogo: template.showCompanyLogo,
          showContactDetails: template.showContactDetails,
          footerText: template.footerText || undefined,
        } : undefined,
        // Warranty info (for backwards compatibility)
        isWarrantyRepair: service.isWarrantyRepair || false,
        warrantyReason: service.warrantyReason || undefined,
        previousServiceTicket: service.previousService?.ticketNumber || undefined,
      };

      // Generate PDF with specified format and copy type
      const pdfUrl = await pdfGenerationService.generateJobSheetPDF(pdfData, format, copyType);

      // Create job sheet record (with race condition handling)
      try {
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
      } catch (createError: any) {
        // Handle race condition - job sheet was created by another request
        if (createError.code === 'P2002') {
          Logger.info(`Job sheet already exists for service ${serviceId}, returning existing`);
          const existing = await prisma.jobSheet.findUnique({
            where: { serviceId },
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
          if (existing) {
            return existing;
          }
        }
        throw createError;
      }
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
    userId: string,
    format: string = 'A4',
    copyType: 'customer' | 'office' | 'both' = 'customer'
  ): Promise<any> {
    try {
      // Get existing job sheet with all related data
      const existingJobSheet = await prisma.jobSheet.findUnique({
        where: { id: jobSheetId },
        include: {
          service: {
            include: {
              customer: true,
              customerDevice: {
                include: {
                  brand: { select: { name: true } },
                  model: { select: { name: true } },
                },
              },
              faults: {
                include: {
                  fault: true,
                },
              },
              accessories: {
                include: {
                  accessory: { select: { id: true, name: true } },
                },
              },
              damageConditions: {
                include: {
                  damageCondition: { select: { id: true, name: true } },
                },
              },
              partsUsed: {
                include: {
                  part: { select: { id: true, name: true, partNumber: true } },
                  item: { select: { id: true, itemName: true, itemCode: true } },
                },
              },
              assignedTo: {
                select: { id: true, name: true },
              },
              createdBy: {
                select: { id: true, name: true },
              },
              branch: true,
              company: true,
              previousService: {
                select: {
                  ticketNumber: true,
                },
              },
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

      // Separate parts into tagged and extra spare
      const taggedParts = service.partsUsed
        ?.filter((p: any) => !p.isExtraSpare)
        .map((p: any) => ({
          id: p.id,
          partName: p.part?.name || p.item?.itemName || 'Unknown Part',
          partNumber: p.part?.partNumber || p.item?.itemCode || undefined,
          quantity: p.quantity,
          unitPrice: Number(p.unitPrice) || 0,
          totalPrice: Number(p.totalPrice) || 0,
          faultTag: p.faultTag || undefined,
        })) || [];

      const extraSpareParts = service.partsUsed
        ?.filter((p: any) => p.isExtraSpare)
        .map((p: any) => ({
          id: p.id,
          partName: p.part?.name || p.item?.itemName || 'Unknown Part',
          partNumber: p.part?.partNumber || p.item?.itemCode || undefined,
          quantity: p.quantity,
          unitPrice: Number(p.unitPrice) || 0,
          totalPrice: Number(p.totalPrice) || 0,
          isApproved: p.isApproved || false,
          approvalMethod: p.approvalMethod || undefined,
          approvalNote: p.approvalNote || undefined,
          approvedAt: p.approvedAt || undefined,
        })) || [];

      // Prepare accessories
      const accessories = service.accessories?.map((a: any) => ({
        id: a.accessory?.id,
        name: a.accessory?.name || 'Unknown',
        received: true,
      })) || [];

      // Prepare damage conditions
      const damageConditions = service.damageConditions?.map((d: any) => ({
        id: d.damageCondition?.id,
        name: d.damageCondition?.name || 'Unknown',
      })) || [];

      // Prepare data for PDF generation
      const pdfData = {
        jobSheetNumber: existingJobSheet.jobSheetNumber,
        copyType,
        service: {
          ticketNumber: service.ticketNumber,
          createdAt: service.createdAt,
          deviceModel: service.deviceModel,
          deviceIMEI: service.deviceIMEI || undefined,
          devicePassword: service.devicePassword || undefined,
          devicePattern: service.devicePattern || undefined,
          deviceCondition: service.deviceCondition || undefined,
          intakeNotes: service.intakeNotes || undefined,
          issue: service.damageCondition,
          diagnosis: service.diagnosis || undefined,
          estimatedCost: Number(service.estimatedCost) || 0,
          labourCharge: Number(service.labourCharge) || 0,
          extraSpareAmount: Number(service.extraSpareAmount) || 0,
          discount: Number(service.discount) || 0,
          advancePayment: Number(service.advancePayment) || 0,
          actualCost: service.actualCost ? Number(service.actualCost) : undefined,
          isWarrantyRepair: service.isWarrantyRepair || false,
          warrantyReason: service.warrantyReason || undefined,
          isRepeatedService: !!service.previousServiceId,
          dataWarrantyAccepted: service.dataWarrantyAccepted || false,
        },
        customer: {
          name: service.customer.name,
          phone: service.customer.phone,
          address: service.customer.address || undefined,
          email: service.customer.email || undefined,
          whatsappNumber: service.customer.whatsappNumber || undefined,
          gstin: service.customer.gstin || undefined,
          idProofType: service.customer.idProofType || undefined,
        },
        customerDevice: service.customerDevice
          ? {
              brandName: service.customerDevice.brand?.name || undefined,
              modelName: service.customerDevice.model?.name || undefined,
              color: service.customerDevice.color || undefined,
              imei: service.customerDevice.imei || undefined,
            }
          : undefined,
        accessories,
        damageConditions,
        faults: service.faults?.map((f: any) => ({ id: f.fault?.id, name: f.fault?.name })) || [],
        taggedParts,
        extraSpareParts,
        branch: service.branch,
        company: {
          ...service.company,
          gst: service.company.gstin || undefined,
        },
        technician: service.assignedTo ? { id: service.assignedTo.id, name: service.assignedTo.name } : undefined,
        createdBy: service.createdBy ? { id: service.createdBy.id, name: service.createdBy.name } : undefined,
        template: template ? {
          termsAndConditions: template.termsAndConditions || undefined,
          showCustomerSignature: template.showCustomerSignature,
          showAuthorizedSignature: template.showAuthorizedSignature,
          showCompanyLogo: template.showCompanyLogo,
          showContactDetails: template.showContactDetails,
          footerText: template.footerText || undefined,
        } : undefined,
        // Warranty info (for backwards compatibility)
        isWarrantyRepair: service.isWarrantyRepair || false,
        warrantyReason: service.warrantyReason || undefined,
        previousServiceTicket: service.previousService?.ticketNumber || undefined,
      };

      // Generate new PDF with specified format and copy type
      const pdfUrl = await pdfGenerationService.generateJobSheetPDF(pdfData, format, copyType);

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
