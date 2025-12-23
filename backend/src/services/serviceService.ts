import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { ServiceStatus, StockMovementType, DocumentType } from '@prisma/client';
import { StockMovementService } from './stockMovementService';
import JobSheetService from './jobSheetService';
import { S3Service } from './s3Service';
import { PointsService } from './pointsService';
import { TechnicianNotificationService } from './technicianNotificationService';
import { DocumentNumberService } from './documentNumberService';
import path from 'path';
import fs from 'fs';

interface PaymentEntryData {
  amount: number;
  paymentMethodId: string;
  notes?: string;
  transactionId?: string;
  paymentDate?: Date;
}

interface CreateServiceData {
  customerId: string;
  customerDeviceId: string;
  faultIds: string[];
  damageCondition: string;
  damageConditionIds?: string[];
  diagnosis?: string;
  estimatedCost?: number;
  actualCost?: number;
  paymentEntries?: PaymentEntryData[];
  branchId: string;
  companyId: string;
  createdBy: string;
  // Intake fields (moved from device level)
  devicePassword?: string;
  devicePattern?: string;
  deviceCondition?: string;
  intakeNotes?: string;
  accessoryIds?: string[];
  // New fields
  dataWarrantyAccepted?: boolean;
  sendSmsNotification?: boolean;
  sendWhatsappNotification?: boolean;
}

interface UpdateServiceData {
  customerDeviceId?: string;
  faultIds?: string[];
  damageCondition?: string;
  diagnosis?: string;
  estimatedCost?: number;
  actualCost?: number;
  advancePayment?: number;
  // Intake fields
  devicePassword?: string;
  devicePattern?: string;
  deviceCondition?: string;
  intakeNotes?: string;
  accessoryIds?: string[];
}

interface ServiceFilters {
  branchId?: string;
  companyId: string;
  customerId?: string;
  assignedToId?: string;
  status?: ServiceStatus;
  ticketNumber?: string;
  searchTerm?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  unassigned?: boolean;
  includeStats?: boolean;
}

interface AddServicePartData {
  serviceId: string;
  branchInventoryId: string;  // Changed from partId - now uses branch inventory
  quantity: number;
  unitPrice: number;
  userId: string;
  companyId: string;
}

export class ServiceService {
  /**
   * Generate unique ticket number using configurable format from settings
   * Format is configurable via Settings → Document Numbers → Service Ticket
   * Example: DS-1-2025-001 (prefix-branch-year-sequence)
   */
  private static async generateTicketNumber(branchId: string, companyId: string): Promise<string> {
    try {
      // Use DocumentNumberService to generate ticket number based on company settings
      const ticketNumber = await DocumentNumberService.generateNumber(
        companyId,
        DocumentType.SERVICE_TICKET,
        branchId
      );

      // Check if ticket number already exists (rare edge case due to race conditions)
      const existing = await prisma.service.findUnique({
        where: { ticketNumber },
      });

      if (existing) {
        // If exists, add random suffix
        const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        Logger.warn('Duplicate ticket number detected, adding suffix', { ticketNumber, randomSuffix });
        return `${ticketNumber}-${randomSuffix}`;
      }

      return ticketNumber;
    } catch (error) {
      Logger.error('Error generating ticket number', { error, branchId, companyId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to generate ticket number');
    }
  }

  /**
   * Create a new service entry
   */
  static async createService(data: CreateServiceData) {
    try {
      const createdService = await prisma.$transaction(async (tx) => {
        // Verify customer exists
        const customer = await tx.customer.findUnique({
          where: { id: data.customerId },
          select: { id: true, name: true, phone: true },
        });

        if (!customer) {
          throw new AppError(404, 'Customer not found');
        }

        // Verify customer device exists and belongs to customer
        const customerDevice = await tx.customerDevice.findFirst({
          where: {
            id: data.customerDeviceId,
            customerId: data.customerId,
            companyId: data.companyId,
          },
          include: {
            brand: { select: { name: true } },
            model: { select: { name: true } },
          },
        });

        if (!customerDevice) {
          throw new AppError(404, 'Customer device not found or does not belong to this customer');
        }

        // Verify faults exist
        if (!data.faultIds || data.faultIds.length === 0) {
          throw new AppError(400, 'At least one fault is required');
        }

        const faults = await tx.fault.findMany({
          where: {
            id: { in: data.faultIds },
            companyId: data.companyId,
            isActive: true,
          },
        });

        if (faults.length !== data.faultIds.length) {
          throw new AppError(404, 'One or more faults not found or inactive');
        }

        // Verify damage conditions exist if provided
        if (data.damageConditionIds && data.damageConditionIds.length > 0) {
          const damageConditions = await tx.damageCondition.findMany({
            where: {
              id: { in: data.damageConditionIds },
              companyId: data.companyId,
              isActive: true,
            },
          });

          if (damageConditions.length !== data.damageConditionIds.length) {
            throw new AppError(404, 'One or more damage conditions not found or inactive');
          }
        }

        // Verify accessories exist if provided
        if (data.accessoryIds && data.accessoryIds.length > 0) {
          const accessories = await tx.accessory.findMany({
            where: {
              id: { in: data.accessoryIds },
              isActive: true,
            },
          });

          if (accessories.length !== data.accessoryIds.length) {
            throw new AppError(404, 'One or more accessories not found or inactive');
          }
        }

        // Verify branch exists
        const branch = await tx.branch.findUnique({
          where: { id: data.branchId },
        });

        if (!branch) {
          throw new AppError(404, 'Branch not found');
        }

        // Verify payment methods if payment entries provided (batch verification)
        if (data.paymentEntries && data.paymentEntries.length > 0) {
          const paymentMethodIds = [...new Set(data.paymentEntries.map((e) => e.paymentMethodId))];
          const paymentMethods = await tx.paymentMethod.findMany({
            where: {
              id: { in: paymentMethodIds },
              companyId: data.companyId,
              isActive: true,
            },
            select: { id: true },
          });

          if (paymentMethods.length !== paymentMethodIds.length) {
            throw new AppError(404, 'One or more payment methods not found or inactive');
          }
        }

        // Generate ticket number using configurable format from settings
        const ticketNumber = await this.generateTicketNumber(data.branchId, data.companyId);

        // Calculate total advance payment
        const totalAdvancePayment = data.paymentEntries?.reduce((sum, entry) => sum + entry.amount, 0) || 0;

        // Create service
        const service = await tx.service.create({
          data: {
            ticketNumber,
            customerId: data.customerId,
            customerDeviceId: data.customerDeviceId,
            deviceModel: `${customerDevice.brand.name} ${customerDevice.model.name}`,
            deviceIMEI: customerDevice.imei,
            devicePassword: data.devicePassword,
            devicePattern: data.devicePattern,
            deviceCondition: data.deviceCondition,
            intakeNotes: data.intakeNotes,
            damageCondition: data.damageCondition,
            diagnosis: data.diagnosis,
            estimatedCost: data.estimatedCost || 0,
            actualCost: data.actualCost,
            advancePayment: totalAdvancePayment,
            status: ServiceStatus.PENDING,
            branchId: data.branchId,
            companyId: data.companyId,
            createdById: data.createdBy,
            dataWarrantyAccepted: data.dataWarrantyAccepted ?? false,
            sendSmsNotification: data.sendSmsNotification ?? true,
            sendWhatsappNotification: data.sendWhatsappNotification ?? false,
            // Create fault connections
            faults: {
              create: data.faultIds.map((faultId) => ({
                faultId,
              })),
            },
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
            customerDevice: {
              include: {
                brand: { select: { id: true, name: true, code: true } },
                model: { select: { id: true, name: true, code: true } },
              },
            },
            faults: {
              include: {
                fault: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    defaultPrice: true,
                  },
                },
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

        // Create payment entries if provided (batch insert)
        if (data.paymentEntries && data.paymentEntries.length > 0) {
          await tx.paymentEntry.createMany({
            data: data.paymentEntries.map((entry) => ({
              amount: entry.amount,
              paymentMethodId: entry.paymentMethodId,
              notes: entry.notes,
              transactionId: entry.transactionId,
              paymentDate: entry.paymentDate || new Date(),
              serviceId: service.id,
              companyId: data.companyId,
            })),
          });
        }

        // Create damage condition links if damageConditionIds provided (batch insert)
        if (data.damageConditionIds && data.damageConditionIds.length > 0) {
          await tx.damageConditionOnService.createMany({
            data: data.damageConditionIds.map((damageConditionId) => ({
              serviceId: service.id,
              damageConditionId,
            })),
          });
        }

        // Create service accessory links if accessoryIds provided (batch insert)
        if (data.accessoryIds && data.accessoryIds.length > 0) {
          await tx.serviceAccessory.createMany({
            data: data.accessoryIds.map((accessoryId) => ({
              serviceId: service.id,
              accessoryId,
            })),
          });
        }

        // Create initial status history
        await tx.serviceStatusHistory.create({
          data: {
            serviceId: service.id,
            status: ServiceStatus.PENDING,
            notes: 'Service created',
            changedBy: data.createdBy,
          },
        });

        // Create activity log
        await tx.activityLog.create({
          data: {
            userId: data.createdBy,
            action: 'CREATE',
            entity: 'service',
            entityId: service.id,
            details: JSON.stringify({
              ticketNumber,
              customerName: customer.name,
              deviceBrand: customerDevice.brand.name,
              deviceModel: customerDevice.model.name,
              faults: faults.map(f => f.name).join(', '),
              estimatedCost: data.estimatedCost,
              advancePayment: totalAdvancePayment,
              paymentEntriesCount: data.paymentEntries?.length || 0,
            }),
          },
        });

        Logger.info('Service created successfully', {
          serviceId: service.id,
          ticketNumber,
          customerId: data.customerId,
          branchId: data.branchId,
          advancePayment: totalAdvancePayment,
        });

        return service;
      });

      // Auto-generate job sheet after service creation (async, non-blocking)
      JobSheetService.generateJobSheet({
        serviceId: createdService.id,
        userId: data.createdBy,
      })
        .then(() => {
          Logger.info('Job sheet auto-generated for service', { serviceId: createdService.id });
        })
        .catch((jobSheetError) => {
          Logger.error('Failed to auto-generate job sheet', { error: jobSheetError, serviceId: createdService.id });
        });

      return createdService;
    } catch (error) {
      Logger.error('Error creating service', { error, data });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to create service');
    }
  }

  /**
   * Get services with filters and pagination
   */
  static async getServices(filters: ServiceFilters) {
    try {
      const {
        companyId,
        branchId,
        customerId,
        assignedToId,
        status,
        ticketNumber,
        searchTerm,
        startDate,
        endDate,
        page = 1,
        limit = 20,
        unassigned,
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        companyId,
      };

      if (branchId) where.branchId = branchId;
      if (customerId) where.customerId = customerId;
      if (assignedToId) where.assignedToId = assignedToId;
      if (unassigned) where.assignedToId = null;
      if (status) where.status = status;
      if (ticketNumber) where.ticketNumber = { contains: ticketNumber };

      // Search term across multiple fields
      if (searchTerm) {
        where.OR = [
          { ticketNumber: { contains: searchTerm, mode: 'insensitive' } },
          { deviceModel: { contains: searchTerm, mode: 'insensitive' } },
          { deviceIMEI: { contains: searchTerm, mode: 'insensitive' } },
          { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
          { customer: { phone: { contains: searchTerm, mode: 'insensitive' } } },
        ];
      }

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Get total count
      const total = await prisma.service.count({ where });

      // Get services
      const services = await prisma.service.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          createdBy: {
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
          _count: {
            select: {
              images: true,
              partsUsed: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Get stats if requested
      let stats = null;
      if (filters.includeStats) {
        stats = await this.getServiceStats(where);
      }

      return {
        services,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        ...(stats && { stats }),
      };
    } catch (error) {
      Logger.error('Error fetching services', { error, filters });
      throw new AppError(500, 'Failed to fetch services');
    }
  }

  /**
   * Get service statistics based on filters
   */
  static async getServiceStats(where: any) {
    try {
      // Get counts by status
      const statusCounts = await prisma.service.groupBy({
        by: ['status'],
        where,
        _count: true,
      });

      // Get count of unassigned services
      const unassignedCount = await prisma.service.count({
        where: {
          ...where,
          assignedToId: null,
        },
      });

      // Transform to stat object
      const stats: any = {
        total: 0,
        pending: 0,
        inProgress: 0,
        waitingParts: 0,
        completed: 0,
        delivered: 0,
        cancelled: 0,
        unassigned: unassignedCount,
      };

      // Map status counts
      statusCounts.forEach((item) => {
        const count = item._count;
        stats.total += count;

        switch (item.status) {
          case 'PENDING':
            stats.pending = count;
            break;
          case 'IN_PROGRESS':
            stats.inProgress = count;
            break;
          case 'WAITING_PARTS':
            stats.waitingParts = count;
            break;
          case 'COMPLETED':
            stats.completed = count;
            break;
          case 'DELIVERED':
            stats.delivered = count;
            break;
          case 'CANCELLED':
            stats.cancelled = count;
            break;
        }
      });

      return stats;
    } catch (error) {
      Logger.error('Error calculating service stats', { error });
      throw new AppError(500, 'Failed to calculate service statistics');
    }
  }

  /**
   * Get service by ID with full details
   */
  static async getServiceById(serviceId: string, companyId: string) {
    try {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
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
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              phone: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true,
              phone: true,
            },
          },
          images: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          deviceImages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          partsUsed: {
            include: {
              part: {
                select: {
                  id: true,
                  name: true,
                  partNumber: true,
                },
              },
              branchInventory: {
                select: {
                  id: true,
                  stockQuantity: true,
                },
              },
              item: {
                select: {
                  id: true,
                  itemName: true,
                  itemCode: true,
                },
              },
            },
          },
          statusHistory: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          accessories: {
            include: {
              accessory: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          faults: {
            include: {
              fault: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
          paymentEntries: {
            include: {
              paymentMethod: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              paymentDate: 'desc',
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      return service;
    } catch (error) {
      Logger.error('Error fetching service details', { error, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to fetch service details');
    }
  }

  /**
   * Update service details
   */
  static async updateService(serviceId: string, data: UpdateServiceData, userId: string, companyId: string) {
    try {
      // Verify service exists
      const existing = await prisma.service.findFirst({
        where: {
          id: serviceId,
          companyId,
        },
        include: {
          customerDevice: {
            include: {
              brand: { select: { name: true } },
              model: { select: { name: true } },
            },
          },
        },
      });

      if (!existing) {
        throw new AppError(404, 'Service not found');
      }

      // Extract accessoryIds for separate handling
      const { accessoryIds, ...updateData } = data;

      // If customerDeviceId is changing, update deviceModel
      if (updateData.customerDeviceId && updateData.customerDeviceId !== existing.customerDeviceId) {
        const newDevice = await prisma.customerDevice.findFirst({
          where: {
            id: updateData.customerDeviceId,
            companyId,
          },
          include: {
            brand: { select: { name: true } },
            model: { select: { name: true } },
          },
        });

        if (!newDevice) {
          throw new AppError(404, 'Customer device not found');
        }

        (updateData as any).deviceModel = `${newDevice.brand.name} ${newDevice.model.name}`;
        (updateData as any).deviceIMEI = newDevice.imei;
      }

      // Use transaction for atomic updates
      const service = await prisma.$transaction(async (tx) => {
        // Update service
        const updatedService = await tx.service.update({
          where: { id: serviceId },
          data: updateData,
          include: {
            customer: true,
            assignedTo: true,
            branch: true,
            accessories: {
              include: {
                accessory: true,
              },
            },
          },
        });

        // Handle accessory updates if provided
        if (accessoryIds !== undefined) {
          // Delete existing accessories
          await tx.serviceAccessory.deleteMany({
            where: { serviceId },
          });

          // Create new accessory links
          if (accessoryIds.length > 0) {
            for (const accessoryId of accessoryIds) {
              await tx.serviceAccessory.create({
                data: {
                  serviceId,
                  accessoryId,
                },
              });
            }
          }
        }

        return updatedService;
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entity: 'service',
          entityId: serviceId,
          details: JSON.stringify({ updates: data }),
        },
      });

      Logger.info('Service updated successfully', { serviceId, updates: data });

      // Refetch to include updated accessories
      return await this.getServiceById(serviceId, companyId);
    } catch (error) {
      Logger.error('Error updating service', { error, serviceId, data });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to update service');
    }
  }

  /**
   * Upload service images (accepts S3 URLs)
   */
  static async uploadServiceImages(serviceId: string, imageUrls: string[], userId: string, companyId: string) {
    try {
      // Verify service exists
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          companyId,
        },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      // Create image records with S3 URLs
      const imagePromises = imageUrls.map((url) =>
        prisma.serviceImage.create({
          data: {
            serviceId,
            imageUrl: url,
            caption: null,
          },
        })
      );

      const images = await Promise.all(imagePromises);

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPLOAD',
          entity: 'service',
          entityId: serviceId,
          details: JSON.stringify({
            action: 'uploaded_images',
            count: imageUrls.length,
          }),
        },
      });

      Logger.info('Service images uploaded successfully', { serviceId, count: imageUrls.length });

      return images;
    } catch (error) {
      Logger.error('Error uploading service images', { error, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to upload service images');
    }
  }

  /**
   * Delete service image
   */
  static async deleteServiceImage(imageId: string, serviceId: string, userId: string, companyId: string) {
    try {
      // Verify image exists and belongs to service
      const image = await prisma.serviceImage.findFirst({
        where: {
          id: imageId,
          serviceId,
          service: {
            companyId,
          },
        },
      });

      if (!image) {
        throw new AppError(404, 'Image not found');
      }

      // Delete file from S3 or local disk
      if (S3Service.isS3Url(image.imageUrl)) {
        await S3Service.deleteFileByUrl(image.imageUrl);
      } else {
        // Legacy local file deletion
        const filePath = path.join(__dirname, '../../public', image.imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete image record
      await prisma.serviceImage.delete({
        where: { id: imageId },
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'DELETE',
          entity: 'service',
          entityId: serviceId,
          details: JSON.stringify({
            action: 'deleted_image',
            imageUrl: image.imageUrl,
          }),
        },
      });

      Logger.info('Service image deleted successfully', { imageId, serviceId });

      return { success: true };
    } catch (error) {
      Logger.error('Error deleting service image', { error, imageId, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to delete service image');
    }
  }

  /**
   * Upload device images (accepts S3 URLs)
   */
  static async uploadDeviceImages(serviceId: string, imageUrls: string[], userId: string, companyId: string) {
    try {
      // Verify service exists
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          companyId,
        },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      // Create device image records with S3 URLs
      const imagePromises = imageUrls.map((url) =>
        prisma.deviceImage.create({
          data: {
            serviceId,
            imageUrl: url,
            caption: null,
          },
        })
      );

      const images = await Promise.all(imagePromises);

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPLOAD',
          entity: 'service',
          entityId: serviceId,
          details: JSON.stringify({
            action: 'uploaded_device_images',
            count: imageUrls.length,
          }),
        },
      });

      Logger.info('Device images uploaded successfully', { serviceId, count: imageUrls.length });

      return images;
    } catch (error) {
      Logger.error('Error uploading device images', { error, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to upload device images');
    }
  }

  /**
   * Delete device image
   */
  static async deleteDeviceImage(imageId: string, serviceId: string, userId: string, companyId: string) {
    try {
      // Verify image exists and belongs to service
      const image = await prisma.deviceImage.findFirst({
        where: {
          id: imageId,
          serviceId,
          service: {
            companyId,
          },
        },
      });

      if (!image) {
        throw new AppError(404, 'Device image not found');
      }

      // Delete file from S3
      if (S3Service.isS3Url(image.imageUrl)) {
        await S3Service.deleteFileByUrl(image.imageUrl);
      }

      // Delete image record
      await prisma.deviceImage.delete({
        where: { id: imageId },
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'DELETE',
          entity: 'service',
          entityId: serviceId,
          details: JSON.stringify({
            action: 'deleted_device_image',
            imageUrl: image.imageUrl,
          }),
        },
      });

      Logger.info('Device image deleted successfully', { imageId, serviceId });

      return { success: true };
    } catch (error) {
      Logger.error('Error deleting device image', { error, imageId, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to delete device image');
    }
  }

  /**
   * Get available parts from branch inventory for a service
   * If no search term, returns the 10 most frequently used items
   */
  static async getAvailablePartsForService(
    serviceId: string,
    companyId: string,
    search?: string
  ) {
    try {
      // Get service to find its branch
      const service = await prisma.service.findFirst({
        where: { id: serviceId, companyId },
        select: { branchId: true },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      // If no search term, return most frequently used items
      if (!search || !search.trim()) {
        // Get most used items from ServicePart records for this branch
        const mostUsedItems = await prisma.servicePart.groupBy({
          by: ['itemId'],
          where: {
            itemId: { not: null },
            service: {
              branchId: service.branchId,
              companyId,
            },
          },
          _count: { itemId: true },
          orderBy: { _count: { itemId: 'desc' } },
          take: 10,
        });

        const mostUsedItemIds = mostUsedItems
          .map(item => item.itemId)
          .filter((id): id is string => id !== null);

        // Get branch inventories for these items
        if (mostUsedItemIds.length > 0) {
          const inventories = await prisma.branchInventory.findMany({
            where: {
              branchId: service.branchId,
              companyId,
              isActive: true,
              stockQuantity: { gt: 0 },
              itemId: { in: mostUsedItemIds },
            },
            select: {
              id: true,
              stockQuantity: true,
              item: {
                select: {
                  id: true,
                  itemCode: true,
                  itemName: true,
                  salesPrice: true,
                  purchasePrice: true,
                  barcode: true,
                  itemUnit: {
                    select: { name: true, symbol: true },
                  },
                  itemCategory: {
                    select: { name: true },
                  },
                },
              },
            },
          });

          // Sort by usage frequency
          return inventories.sort((a, b) => {
            const aIndex = mostUsedItemIds.indexOf(a.item.id);
            const bIndex = mostUsedItemIds.indexOf(b.item.id);
            return aIndex - bIndex;
          });
        }

        // If no usage history, return first 10 items alphabetically
        return prisma.branchInventory.findMany({
          where: {
            branchId: service.branchId,
            companyId,
            isActive: true,
            stockQuantity: { gt: 0 },
          },
          take: 10,
          select: {
            id: true,
            stockQuantity: true,
            item: {
              select: {
                id: true,
                itemCode: true,
                itemName: true,
                salesPrice: true,
                purchasePrice: true,
                barcode: true,
                itemUnit: {
                  select: { name: true, symbol: true },
                },
                itemCategory: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { item: { itemName: 'asc' } },
        });
      }

      // Build where clause for search
      const where: any = {
        branchId: service.branchId,
        companyId,
        isActive: true,
        stockQuantity: { gt: 0 },
        item: {
          OR: [
            { itemName: { contains: search, mode: 'insensitive' } },
            { itemCode: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
          ],
        },
      };

      // Get branch inventory items
      const inventories = await prisma.branchInventory.findMany({
        where,
        take: 20,
        select: {
          id: true,
          stockQuantity: true,
          item: {
            select: {
              id: true,
              itemCode: true,
              itemName: true,
              salesPrice: true,
              purchasePrice: true,
              barcode: true,
              itemUnit: {
                select: { name: true, symbol: true },
              },
              itemCategory: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { item: { itemName: 'asc' } },
      });

      return inventories;
    } catch (error) {
      Logger.error('Error getting available parts for service', { error, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to get available parts');
    }
  }

  /**
   * Add service part (with BranchInventory integration)
   * If part already exists in service, increases quantity instead of creating new
   */
  static async addServicePart(data: AddServicePartData) {
    try {
      const { serviceId, branchInventoryId, quantity, unitPrice, userId, companyId } = data;

      const result = await prisma.$transaction(async (tx) => {
        // Verify service exists and get its branch
        const service = await tx.service.findFirst({
          where: { id: serviceId, companyId },
          select: { id: true, branchId: true, actualCost: true, labourCharge: true },
        });

        if (!service) {
          throw new AppError(404, 'Service not found');
        }

        // Verify branch inventory exists and belongs to the same branch
        const branchInventory = await tx.branchInventory.findFirst({
          where: {
            id: branchInventoryId,
            branchId: service.branchId,
            companyId,
            isActive: true,
          },
          include: {
            item: {
              select: { id: true, itemName: true, itemCode: true },
            },
          },
        });

        if (!branchInventory) {
          throw new AppError(404, 'Part not found in branch inventory');
        }

        // Check stock availability
        const currentStock = Number(branchInventory.stockQuantity);
        if (currentStock < quantity) {
          throw new AppError(400, `Insufficient stock. Available: ${currentStock}, Required: ${quantity}`);
        }

        // Check if this part already exists in this service
        const existingPart = await tx.servicePart.findFirst({
          where: {
            serviceId,
            branchInventoryId,
          },
        });

        // Calculate new stock
        const newStock = currentStock - quantity;

        // Update branch inventory stock
        await tx.branchInventory.update({
          where: { id: branchInventoryId },
          data: { stockQuantity: newStock },
        });

        // Create stock movement record
        const stockMovement = await tx.stockMovement.create({
          data: {
            branchInventoryId,
            movementType: StockMovementType.SERVICE_USE,
            quantity: quantity,
            previousQty: currentStock,
            newQty: newStock,
            referenceType: 'SERVICE',
            referenceId: serviceId,
            notes: `Used in service ${serviceId}`,
            userId,
            branchId: service.branchId,
            companyId,
          },
        });

        let servicePart;
        let totalPrice: number;
        let action: string;

        if (existingPart) {
          // Update existing part - increase quantity
          const newQuantity = existingPart.quantity + quantity;
          totalPrice = unitPrice * newQuantity;

          servicePart = await tx.servicePart.update({
            where: { id: existingPart.id },
            data: {
              quantity: newQuantity,
              unitPrice, // Update to new price if different
              totalPrice,
            },
            include: {
              branchInventory: {
                include: {
                  item: {
                    select: {
                      id: true,
                      itemName: true,
                      itemCode: true,
                    },
                  },
                },
              },
              item: {
                select: {
                  id: true,
                  itemName: true,
                  itemCode: true,
                },
              },
            },
          });

          // Update service actual cost (add only the new quantity's price)
          const currentActualCost = service.actualCost || 0;
          const labourCost = service.labourCharge || 0;
          // Recalculate: remove old total, add new total (include labour charge)
          const oldTotalPrice = existingPart.totalPrice;
          const newPartsTotal = (currentActualCost - labourCost) - oldTotalPrice + totalPrice;
          await tx.service.update({
            where: { id: serviceId },
            data: { actualCost: newPartsTotal + labourCost },
          });

          action = 'SERVICE_PART_QUANTITY_INCREASED';
        } else {
          // Create new service part record
          totalPrice = unitPrice * quantity;

          servicePart = await tx.servicePart.create({
            data: {
              serviceId,
              branchInventoryId,
              itemId: branchInventory.item.id,
              quantity,
              unitPrice,
              totalPrice,
            },
            include: {
              branchInventory: {
                include: {
                  item: {
                    select: {
                      id: true,
                      itemName: true,
                      itemCode: true,
                    },
                  },
                },
              },
              item: {
                select: {
                  id: true,
                  itemName: true,
                  itemCode: true,
                },
              },
            },
          });

          // Update service actual cost (parts total + labour charge)
          const currentActualCost = service.actualCost || 0;
          const labourCost = service.labourCharge || 0;
          const currentPartsTotal = currentActualCost - labourCost;
          await tx.service.update({
            where: { id: serviceId },
            data: { actualCost: currentPartsTotal + totalPrice + labourCost },
          });

          action = 'SERVICE_PART_ADDED';
        }

        // Create activity log
        await tx.activityLog.create({
          data: {
            userId,
            action,
            entity: 'service',
            entityId: serviceId,
            details: JSON.stringify({
              branchInventoryId,
              itemId: branchInventory.item.id,
              itemName: branchInventory.item.itemName,
              quantity,
              unitPrice,
              totalPrice,
              previousStock: currentStock,
              newStock,
              stockMovementId: stockMovement.id,
              merged: !!existingPart,
            }),
          },
        });

        return servicePart;
      });

      Logger.info('Service part added successfully', {
        serviceId,
        branchInventoryId,
        quantity,
        totalPrice: unitPrice * quantity,
      });

      return result;
    } catch (error) {
      Logger.error('Error adding service part', { error, data });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to add service part');
    }
  }

  /**
   * Update service part (quantity and/or unit price)
   */
  static async updateServicePart(
    servicePartId: string,
    serviceId: string,
    userId: string,
    companyId: string,
    updates: { quantity?: number; unitPrice?: number }
  ) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Get existing service part
        const servicePart = await tx.servicePart.findFirst({
          where: {
            id: servicePartId,
            serviceId,
            service: { companyId },
          },
          include: {
            service: { select: { branchId: true, actualCost: true, labourCharge: true } },
            branchInventory: true,
          },
        });

        if (!servicePart) {
          throw new AppError(404, 'Service part not found');
        }

        const oldQuantity = servicePart.quantity;
        const oldUnitPrice = servicePart.unitPrice;
        const oldTotalPrice = servicePart.totalPrice;

        const newQuantity = updates.quantity ?? oldQuantity;
        const newUnitPrice = updates.unitPrice ?? oldUnitPrice;
        const newTotalPrice = newQuantity * newUnitPrice;

        // Handle stock adjustment if quantity changed
        if (updates.quantity !== undefined && updates.quantity !== oldQuantity && servicePart.branchInventoryId) {
          const branchInventoryId = servicePart.branchInventoryId;
          const branchInventory = await tx.branchInventory.findUnique({
            where: { id: branchInventoryId },
          });

          if (branchInventory) {
            const currentStock = Number(branchInventory.stockQuantity);
            const quantityDiff = newQuantity - oldQuantity;

            // If increasing quantity, check stock availability
            if (quantityDiff > 0 && currentStock < quantityDiff) {
              throw new AppError(400, `Insufficient stock. Available: ${currentStock}, Required: ${quantityDiff}`);
            }

            // Update stock (decrease if adding more, increase if reducing)
            const adjustedStock = currentStock - quantityDiff;
            await tx.branchInventory.update({
              where: { id: branchInventoryId },
              data: { stockQuantity: adjustedStock },
            });

            // Create stock movement
            await tx.stockMovement.create({
              data: {
                branchInventoryId,
                movementType: quantityDiff > 0 ? StockMovementType.SERVICE_USE : StockMovementType.RETURN,
                quantity: Math.abs(quantityDiff),
                previousQty: currentStock,
                newQty: adjustedStock,
                referenceType: 'SERVICE_PART_UPDATE',
                referenceId: servicePartId,
                notes: `Quantity adjusted from ${oldQuantity} to ${newQuantity}`,
                userId,
                branchId: servicePart.service.branchId,
                companyId,
              },
            });
          }
        }

        // Update service part
        const updatedPart = await tx.servicePart.update({
          where: { id: servicePartId },
          data: {
            quantity: newQuantity,
            unitPrice: newUnitPrice,
            totalPrice: newTotalPrice,
          },
          include: {
            branchInventory: {
              include: {
                item: {
                  select: { id: true, itemName: true, itemCode: true },
                },
              },
            },
            item: {
              select: { id: true, itemName: true, itemCode: true },
            },
          },
        });

        // Update service actual cost (parts total + labour charge)
        const currentActualCost = servicePart.service.actualCost || 0;
        const labourCost = servicePart.service.labourCharge || 0;
        const currentPartsTotal = currentActualCost - labourCost;
        const costDiff = newTotalPrice - oldTotalPrice;
        const newPartsTotal = Math.max(0, currentPartsTotal + costDiff);
        await tx.service.update({
          where: { id: serviceId },
          data: { actualCost: newPartsTotal + labourCost },
        });

        // Create activity log
        await tx.activityLog.create({
          data: {
            userId,
            action: 'SERVICE_PART_UPDATED',
            entity: 'service',
            entityId: serviceId,
            details: JSON.stringify({
              servicePartId,
              oldQuantity,
              newQuantity,
              oldUnitPrice,
              newUnitPrice,
              oldTotalPrice,
              newTotalPrice,
            }),
          },
        });

        return updatedPart;
      });

      Logger.info('Service part updated successfully', { servicePartId, updates });
      return result;
    } catch (error) {
      Logger.error('Error updating service part', { error, servicePartId, updates });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to update service part');
    }
  }

  /**
   * Remove service part (restore stock with movement record)
   */
  static async removeServicePart(servicePartId: string, serviceId: string, userId: string, companyId: string) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Get service part details with both new and legacy relations
        const servicePart = await tx.servicePart.findFirst({
          where: {
            id: servicePartId,
            serviceId,
            service: { companyId },
          },
          include: {
            branchInventory: {
              include: {
                item: { select: { itemName: true } },
              },
            },
            item: { select: { itemName: true } },
            part: true, // For backward compatibility
          },
        });

        if (!servicePart) {
          throw new AppError(404, 'Service part not found');
        }

        // Get service for branch info
        const service = await tx.service.findUnique({
          where: { id: serviceId },
          select: { branchId: true, actualCost: true, labourCharge: true },
        });

        if (!service) {
          throw new AppError(404, 'Service not found');
        }

        let itemName = 'Unknown Part';

        // Handle new BranchInventory-based parts
        if (servicePart.branchInventoryId) {
          const branchInventoryId = servicePart.branchInventoryId;
          const branchInventory = await tx.branchInventory.findUnique({
            where: { id: branchInventoryId },
          });

          if (branchInventory) {
            const currentStock = Number(branchInventory.stockQuantity);
            const newStock = currentStock + servicePart.quantity;

            // Restore stock
            await tx.branchInventory.update({
              where: { id: branchInventoryId },
              data: { stockQuantity: newStock },
            });

            // Create reverse stock movement
            await tx.stockMovement.create({
              data: {
                branchInventoryId: branchInventoryId,
                movementType: StockMovementType.RETURN,
                quantity: servicePart.quantity,
                previousQty: currentStock,
                newQty: newStock,
                referenceType: 'SERVICE_PART_REMOVED',
                referenceId: servicePartId,
                notes: `Part removed from service ${serviceId}`,
                userId,
                branchId: service.branchId,
                companyId,
              },
            });

            itemName = servicePart.branchInventory?.item?.itemName || servicePart.item?.itemName || 'Unknown Part';
          }
        }
        // Handle legacy Part-based records (backward compatibility)
        else if (servicePart.partId && servicePart.part) {
          const partId = servicePart.partId;
          const part = servicePart.part;
          const previousQty = part.quantity;
          const newQty = previousQty + servicePart.quantity;

          await tx.part.update({
            where: { id: partId },
            data: { quantity: newQty },
          });

          itemName = part.name;
        }

        // Delete service part
        await tx.servicePart.delete({
          where: { id: servicePartId },
        });

        // Update service actual cost (parts total + labour charge)
        const currentActualCost = service.actualCost || 0;
        const labourCost = service.labourCharge || 0;
        const currentPartsTotal = currentActualCost - labourCost;
        const newPartsTotal = Math.max(0, currentPartsTotal - servicePart.totalPrice);
        await tx.service.update({
          where: { id: serviceId },
          data: {
            actualCost: newPartsTotal + labourCost,
          },
        });

        // Create activity log
        await tx.activityLog.create({
          data: {
            userId,
            action: 'SERVICE_PART_REMOVED',
            entity: 'service',
            entityId: serviceId,
            details: JSON.stringify({
              servicePartId,
              branchInventoryId: servicePart.branchInventoryId,
              partId: servicePart.partId,
              itemName,
              quantity: servicePart.quantity,
              totalPrice: servicePart.totalPrice,
            }),
          },
        });

        return { success: true };
      });

      Logger.info('Service part removed successfully', { servicePartId, serviceId });

      return result;
    } catch (error) {
      Logger.error('Error removing service part', { error, servicePartId, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to remove service part');
    }
  }

  /**
   * Update service status (with history tracking)
   */
  static async updateServiceStatus(
    serviceId: string,
    status: ServiceStatus,
    notes: string | undefined,
    userId: string,
    companyId: string
  ) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Verify service exists
        const service = await tx.service.findFirst({
          where: {
            id: serviceId,
            companyId,
          },
        });

        if (!service) {
          throw new AppError(404, 'Service not found');
        }

        // Prepare update data
        const updateData: any = { status };

        // Set completion/delivery timestamps
        if (status === ServiceStatus.COMPLETED && !service.completedAt) {
          updateData.completedAt = new Date();
        }
        if (status === ServiceStatus.DELIVERED && !service.deliveredAt) {
          updateData.deliveredAt = new Date();
        }

        // Update service status
        const updatedService = await tx.service.update({
          where: { id: serviceId },
          data: updateData,
          include: {
            customer: true,
            assignedTo: true,
            branch: true,
          },
        });

        // Create status history record
        await tx.serviceStatusHistory.create({
          data: {
            serviceId,
            status,
            notes,
            changedBy: userId,
          },
        });

        // Create activity log
        await tx.activityLog.create({
          data: {
            userId,
            action: 'STATUS_UPDATE',
            entity: 'service',
            entityId: serviceId,
            details: JSON.stringify({
              oldStatus: service.status,
              newStatus: status,
              notes,
            }),
          },
        });

        return updatedService;
      });

      Logger.info('Service status updated successfully', {
        serviceId,
        oldStatus: result.status,
        newStatus: status,
      });

      // Award points to technician on completion/delivery (async, don't block response)
      if (status === ServiceStatus.COMPLETED && result.assignedToId) {
        PointsService.onServiceCompleted(serviceId).catch((err) => {
          Logger.error('Failed to award completion points', { error: err, serviceId });
        });
      } else if (status === ServiceStatus.DELIVERED && result.assignedToId) {
        PointsService.onServiceDelivered(serviceId).catch((err) => {
          Logger.error('Failed to award delivery points', { error: err, serviceId });
        });
      }

      return result;
    } catch (error) {
      Logger.error('Error updating service status', { error, serviceId, status });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to update service status');
    }
  }

  /**
   * Assign service to technician
   */
  static async assignTechnician(serviceId: string, technicianId: string, notes: string | undefined, userId: string, companyId: string) {
    try {
      // Verify technician exists and belongs to same branch
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          companyId,
        },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      const technician = await prisma.user.findFirst({
        where: {
          id: technicianId,
          companyId,
          branchId: service.branchId,
          role: 'TECHNICIAN',
        },
      });

      if (!technician) {
        throw new AppError(404, 'Technician not found or not in the same branch');
      }

      // Update service assignment
      const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: {
          assignedToId: technicianId,
        },
        include: {
          customer: true,
          assignedTo: true,
          branch: true,
        },
      });

      // Create status history if not already IN_PROGRESS
      if (service.status === ServiceStatus.PENDING) {
        await prisma.serviceStatusHistory.create({
          data: {
            serviceId,
            status: ServiceStatus.IN_PROGRESS,
            notes: notes || `Assigned to ${technician.name}`,
            changedBy: userId,
          },
        });

        // Update service status to IN_PROGRESS
        await prisma.service.update({
          where: { id: serviceId },
          data: { status: ServiceStatus.IN_PROGRESS },
        });
      }

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'ASSIGN',
          entity: 'service',
          entityId: serviceId,
          details: JSON.stringify({
            technicianId,
            technicianName: technician.name,
            notes,
          }),
        },
      });

      Logger.info('Service assigned to technician', { serviceId, technicianId });

      // Send notification to customer (async, don't block response) if enabled
      if (service.sendSmsNotification || service.sendWhatsappNotification) {
        TechnicianNotificationService.notifyServiceAssigned(
          technicianId,
          serviceId,
          updatedService.ticketNumber,
          service.deviceModel,
          service.damageCondition
        ).catch((err) => {
          Logger.error('Failed to send assignment notification', { error: err, serviceId });
        });
      }

      return updatedService;
    } catch (error) {
      Logger.error('Error assigning service to technician', { error, serviceId, technicianId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to assign service to technician');
    }
  }

  /**
   * Update service diagnosis
   */
  static async updateDiagnosis(
    serviceId: string,
    diagnosis: string,
    estimatedCost: number | undefined,
    userId: string,
    companyId: string
  ) {
    try {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          companyId,
        },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      const updateData: any = { diagnosis };
      if (estimatedCost !== undefined) {
        updateData.estimatedCost = estimatedCost;
      }

      const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: updateData,
        include: {
          customer: true,
          assignedTo: true,
          branch: true,
        },
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entity: 'service',
          entityId: serviceId,
          details: JSON.stringify({
            action: 'diagnosis_updated',
            diagnosis,
            estimatedCost,
          }),
        },
      });

      Logger.info('Service diagnosis updated', { serviceId });

      return updatedService;
    } catch (error) {
      Logger.error('Error updating service diagnosis', { error, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to update service diagnosis');
    }
  }

  /**
   * Get service status history
   */
  static async getStatusHistory(serviceId: string, companyId: string) {
    try {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          companyId,
        },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      const history = await prisma.serviceStatusHistory.findMany({
        where: { serviceId },
        include: {
          changedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return history;
    } catch (error) {
      Logger.error('Error fetching service status history', { error, serviceId });
      throw new AppError(500, 'Failed to fetch service status history');
    }
  }

  /**
   * Delete service
   */
  static async deleteService(serviceId: string, userId: string, companyId: string) {
    try {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          companyId,
        },
        include: {
          images: true,
          partsUsed: {
            include: {
              part: true,
              branchInventory: true,
            },
          },
        },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      // Don't allow deletion of completed/delivered services
      if (service.status === ServiceStatus.COMPLETED || service.status === ServiceStatus.DELIVERED) {
        throw new AppError(400, 'Cannot delete completed or delivered services');
      }

      await prisma.$transaction(async (tx) => {
        // Restore stock for all used parts (handle both legacy and new parts)
        for (const servicePart of service.partsUsed) {
          // Handle new BranchInventory-based parts
          if (servicePart.branchInventoryId) {
            const branchInventoryId = servicePart.branchInventoryId;
            const branchInventory = await tx.branchInventory.findUnique({
              where: { id: branchInventoryId },
            });
            if (branchInventory) {
              await tx.branchInventory.update({
                where: { id: branchInventoryId },
                data: {
                  stockQuantity: Number(branchInventory.stockQuantity) + servicePart.quantity,
                },
              });
            }
          }
          // Handle legacy Part-based records
          else if (servicePart.partId && servicePart.part) {
            const partId = servicePart.partId;
            const partQuantity = servicePart.part.quantity;
            await tx.part.update({
              where: { id: partId },
              data: {
                quantity: partQuantity + servicePart.quantity,
              },
            });
          }
        }

        // Delete service images from disk
        for (const image of service.images) {
          const filePath = path.join(__dirname, '../../public', image.imageUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        // Delete service (cascade will handle related records)
        await tx.service.delete({
          where: { id: serviceId },
        });

        // Create activity log
        await tx.activityLog.create({
          data: {
            userId,
            action: 'DELETE',
            entity: 'service',
            entityId: serviceId,
            details: JSON.stringify({
              ticketNumber: service.ticketNumber,
              deviceModel: service.deviceModel,
            }),
          },
        });
      });

      Logger.info('Service deleted successfully', { serviceId });

      return { success: true };
    } catch (error) {
      Logger.error('Error deleting service', { error, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to delete service');
    }
  }

  /**
   * Add a payment entry to an existing service
   * This creates a new PaymentEntry record and updates the service's advancePayment total
   */
  static async addPaymentEntry(data: {
    serviceId: string;
    amount: number;
    paymentMethodId: string;
    notes?: string;
    transactionId?: string;
    userId: string;
    companyId: string;
  }) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Verify service exists and belongs to company
        const service = await tx.service.findFirst({
          where: { id: data.serviceId, companyId: data.companyId },
        });

        if (!service) {
          throw new AppError(404, 'Service not found');
        }

        // Create payment entry
        const paymentEntry = await tx.paymentEntry.create({
          data: {
            amount: data.amount,
            paymentMethodId: data.paymentMethodId,
            notes: data.notes,
            transactionId: data.transactionId,
            paymentDate: new Date(),
            serviceId: data.serviceId,
            companyId: data.companyId,
          },
          include: {
            paymentMethod: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Update service advancePayment total
        const updatedService = await tx.service.update({
          where: { id: data.serviceId },
          data: {
            advancePayment: { increment: data.amount },
          },
        });

        // Log the activity
        await tx.activityLog.create({
          data: {
            userId: data.userId,
            action: 'CREATE',
            entity: 'payment_entry',
            entityId: paymentEntry.id,
            details: JSON.stringify({
              serviceId: data.serviceId,
              ticketNumber: service.ticketNumber,
              amount: data.amount,
              paymentMethod: paymentEntry.paymentMethod.name,
            }),
          },
        });

        Logger.info('Payment entry added successfully', {
          serviceId: data.serviceId,
          paymentEntryId: paymentEntry.id,
          amount: data.amount,
        });

        return { paymentEntry, service: updatedService };
      });
    } catch (error) {
      Logger.error('Error adding payment entry', { error, serviceId: data.serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to add payment entry');
    }
  }

  /**
   * Add a note to a service
   */
  static async addNote(data: {
    serviceId: string;
    note: string;
    userId: string;
    companyId: string;
  }) {
    try {
      // Verify service exists and belongs to company
      const service = await prisma.service.findFirst({
        where: { id: data.serviceId, companyId: data.companyId },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      // Create note
      const serviceNote = await prisma.serviceNote.create({
        data: {
          serviceId: data.serviceId,
          note: data.note,
          createdBy: data.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      Logger.info('Service note added successfully', {
        serviceId: data.serviceId,
        noteId: serviceNote.id,
      });

      return serviceNote;
    } catch (error) {
      Logger.error('Error adding service note', { error, serviceId: data.serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to add note');
    }
  }

  /**
   * Get all notes for a service
   */
  static async getNotes(serviceId: string, companyId: string) {
    try {
      // Verify service exists and belongs to company
      const service = await prisma.service.findFirst({
        where: { id: serviceId, companyId },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      const notes = await prisma.serviceNote.findMany({
        where: { serviceId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return notes;
    } catch (error) {
      Logger.error('Error fetching service notes', { error, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to fetch notes');
    }
  }

  /**
   * Delete a note from a service
   */
  static async deleteNote(noteId: string, userId: string, companyId: string) {
    try {
      // Find the note and verify ownership
      const note = await prisma.serviceNote.findFirst({
        where: { id: noteId },
        include: {
          service: {
            select: { companyId: true },
          },
        },
      });

      if (!note) {
        throw new AppError(404, 'Note not found');
      }

      if (note.service.companyId !== companyId) {
        throw new AppError(403, 'Access denied');
      }

      // Only allow creator or admin/manager to delete
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (note.createdBy !== userId && user?.role !== 'ADMIN' && user?.role !== 'MANAGER' && user?.role !== 'SUPER_ADMIN') {
        throw new AppError(403, 'You can only delete your own notes');
      }

      await prisma.serviceNote.delete({
        where: { id: noteId },
      });

      Logger.info('Service note deleted successfully', { noteId });

      return { success: true };
    } catch (error) {
      Logger.error('Error deleting service note', { error, noteId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to delete note');
    }
  }

  /**
   * Update labour charge for a service
   * Recalculates actualCost = partsTotal + labourCharge
   */
  static async updateLabourCharge(
    serviceId: string,
    labourCharge: number,
    userId: string,
    companyId: string
  ) {
    try {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          companyId,
        },
        include: {
          partsUsed: true,
        },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      // Calculate parts total
      const partsTotal = service.partsUsed.reduce((sum, part) => sum + part.totalPrice, 0);

      // Calculate new actual cost
      const actualCost = partsTotal + labourCharge;

      const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: {
          labourCharge,
          actualCost,
        },
        include: {
          customer: true,
          assignedTo: true,
          branch: true,
          partsUsed: {
            include: {
              item: true,
            },
          },
        },
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entity: 'service',
          entityId: serviceId,
          details: JSON.stringify({
            action: 'labour_charge_updated',
            labourCharge,
            partsTotal,
            actualCost,
          }),
        },
      });

      Logger.info('Service labour charge updated', { serviceId, labourCharge, actualCost });

      return updatedService;
    } catch (error) {
      Logger.error('Error updating service labour charge', { error, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Failed to update labour charge');
    }
  }
}
