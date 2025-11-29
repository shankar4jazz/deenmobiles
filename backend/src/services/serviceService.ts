import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { ServiceStatus } from '@prisma/client';
import { StockMovementService } from './stockMovementService';
import JobSheetService from './jobSheetService';
import { S3Service } from './s3Service';
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
  serviceCategoryId: string;
  issue: string;
  diagnosis?: string;
  estimatedCost?: number;
  actualCost?: number;
  paymentEntries?: PaymentEntryData[];
  branchId: string;
  companyId: string;
  createdBy: string;
}

interface UpdateServiceData {
  customerDeviceId?: string;
  serviceCategoryId?: string;
  issue?: string;
  diagnosis?: string;
  estimatedCost?: number;
  actualCost?: number;
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
  includeStats?: boolean;
}

interface AddServicePartData {
  serviceId: string;
  partId: string;
  quantity: number;
  unitPrice: number;
  userId: string;
  companyId: string;
}

export class ServiceService {
  /**
   * Generate unique ticket number
   * Format: SRV-BRANCH-YYYYMMDD-XXX
   */
  private static async generateTicketNumber(branchId: string): Promise<string> {
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

      // Get count of services created today for this branch
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));

      const todayCount = await prisma.service.count({
        where: {
          branchId,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      // Generate ticket number
      const sequence = (todayCount + 1).toString().padStart(3, '0');
      const ticketNumber = `SRV-${branch.code}-${dateStr}-${sequence}`;

      // Check if ticket number already exists (rare edge case)
      const existing = await prisma.service.findUnique({
        where: { ticketNumber },
      });

      if (existing) {
        // If exists, add random suffix
        const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        return `${ticketNumber}-${randomSuffix}`;
      }

      return ticketNumber;
    } catch (error) {
      Logger.error('Error generating ticket number', { error, branchId });
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

        // Verify service category exists
        const serviceCategory = await tx.serviceCategory.findFirst({
          where: {
            id: data.serviceCategoryId,
            companyId: data.companyId,
            isActive: true,
          },
        });

        if (!serviceCategory) {
          throw new AppError(404, 'Service category not found or inactive');
        }

        // Verify branch exists
        const branch = await tx.branch.findUnique({
          where: { id: data.branchId },
        });

        if (!branch) {
          throw new AppError(404, 'Branch not found');
        }

        // Verify payment methods if payment entries provided
        if (data.paymentEntries && data.paymentEntries.length > 0) {
          for (const entry of data.paymentEntries) {
            const paymentMethod = await tx.paymentMethod.findFirst({
              where: {
                id: entry.paymentMethodId,
                companyId: data.companyId,
                isActive: true,
              },
            });

            if (!paymentMethod) {
              throw new AppError(404, `Payment method not found or inactive`);
            }
          }
        }

        // Generate ticket number
        const ticketNumber = await this.generateTicketNumber(data.branchId);

        // Calculate total advance payment
        const totalAdvancePayment = data.paymentEntries?.reduce((sum, entry) => sum + entry.amount, 0) || 0;

        // Create service
        const service = await tx.service.create({
          data: {
            ticketNumber,
            customerId: data.customerId,
            customerDeviceId: data.customerDeviceId,
            serviceCategoryId: data.serviceCategoryId,
            deviceModel: `${customerDevice.brand.name} ${customerDevice.model.name}`,
            deviceIMEI: customerDevice.imei,
            issue: data.issue,
            diagnosis: data.diagnosis,
            estimatedCost: data.estimatedCost || 0,
            actualCost: data.actualCost,
            advancePayment: totalAdvancePayment,
            status: ServiceStatus.PENDING,
            branchId: data.branchId,
            companyId: data.companyId,
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
            serviceCategory: {
              select: {
                id: true,
                name: true,
                code: true,
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

        // Create payment entries if provided
        if (data.paymentEntries && data.paymentEntries.length > 0) {
          for (const entry of data.paymentEntries) {
            await tx.paymentEntry.create({
              data: {
                amount: entry.amount,
                paymentMethodId: entry.paymentMethodId,
                notes: entry.notes,
                transactionId: entry.transactionId,
                paymentDate: entry.paymentDate || new Date(),
                serviceId: service.id,
                companyId: data.companyId,
              },
            });
          }
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
              serviceCategory: serviceCategory.name,
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

      // Auto-generate job sheet after service creation (outside transaction)
      try {
        await JobSheetService.generateJobSheet({
          serviceId: createdService.id,
          userId: data.createdBy,
        });
        Logger.info('Job sheet auto-generated for service', { serviceId: createdService.id });
      } catch (jobSheetError) {
        // Log error but don't fail service creation
        Logger.error('Failed to auto-generate job sheet', { error: jobSheetError, serviceId: createdService.id });
      }

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
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        companyId,
      };

      if (branchId) where.branchId = branchId;
      if (customerId) where.customerId = customerId;
      if (assignedToId) where.assignedToId = assignedToId;
      if (status) where.status = status;
      if (ticketNumber) where.ticketNumber = { contains: ticketNumber };

      // Search term across multiple fields
      if (searchTerm) {
        where.OR = [
          { ticketNumber: { contains: searchTerm } },
          { deviceModel: { contains: searchTerm } },
          { deviceIMEI: { contains: searchTerm } },
          { customer: { name: { contains: searchTerm } } },
          { customer: { phoneNumber: { contains: searchTerm } } },
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
            },
          },
          statusHistory: {
            orderBy: {
              createdAt: 'desc',
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
      });

      if (!existing) {
        throw new AppError(404, 'Service not found');
      }

      // Update service
      const service = await prisma.service.update({
        where: { id: serviceId },
        data,
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
          details: JSON.stringify({ updates: data }),
        },
      });

      Logger.info('Service updated successfully', { serviceId, updates: data });

      return service;
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
   * Add service part (with inventory integration)
   */
  static async addServicePart(data: AddServicePartData) {
    try {
      const { serviceId, partId, quantity, unitPrice, userId, companyId } = data;

      // Use transaction for atomic operation
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

        // Verify part exists and has sufficient stock
        const part = await tx.part.findFirst({
          where: {
            id: partId,
            companyId,
          },
        });

        if (!part) {
          throw new AppError(404, 'Part not found');
        }

        if (part.quantity < quantity) {
          throw new AppError(400, `Insufficient stock. Available: ${part.quantity}, Required: ${quantity}`);
        }

        // Calculate total price
        const totalPrice = unitPrice * quantity;

        // Create service part record
        const servicePart = await tx.servicePart.create({
          data: {
            serviceId,
            partId,
            quantity,
            unitPrice,
            totalPrice,
          },
          include: {
            part: true,
          },
        });

        // Update part stock
        const previousQty = part.quantity;
        const newQty = previousQty - quantity;

        await tx.part.update({
          where: { id: partId },
          data: { quantity: newQty },
        });

        // Log stock movement (using the stock movement service pattern)
        // Note: This would ideally use BranchInventory instead of Part
        // For now, we'll create an activity log
        await tx.activityLog.create({
          data: {
            userId,
            action: 'SERVICE_PART_ADDED',
            entity: 'service',
            entityId: serviceId,
            details: JSON.stringify({
              partId,
              partName: part.name,
              quantity,
              unitPrice,
              totalPrice,
              previousQty,
              newQty,
            }),
          },
        });

        // Update service actual cost
        const currentActualCost = service.actualCost || 0;
        await tx.service.update({
          where: { id: serviceId },
          data: {
            actualCost: currentActualCost + totalPrice,
          },
        });

        return servicePart;
      });

      Logger.info('Service part added successfully', {
        serviceId,
        partId,
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
   * Remove service part (restore stock)
   */
  static async removeServicePart(servicePartId: string, serviceId: string, userId: string, companyId: string) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Get service part details
        const servicePart = await tx.servicePart.findFirst({
          where: {
            id: servicePartId,
            serviceId,
            service: {
              companyId,
            },
          },
          include: {
            part: true,
          },
        });

        if (!servicePart) {
          throw new AppError(404, 'Service part not found');
        }

        // Restore part stock
        const previousQty = servicePart.part.quantity;
        const newQty = previousQty + servicePart.quantity;

        await tx.part.update({
          where: { id: servicePart.partId },
          data: { quantity: newQty },
        });

        // Delete service part
        await tx.servicePart.delete({
          where: { id: servicePartId },
        });

        // Update service actual cost
        const service = await tx.service.findUnique({
          where: { id: serviceId },
        });

        if (service) {
          const currentActualCost = service.actualCost || 0;
          await tx.service.update({
            where: { id: serviceId },
            data: {
              actualCost: Math.max(0, currentActualCost - servicePart.totalPrice),
            },
          });
        }

        // Create activity log
        await tx.activityLog.create({
          data: {
            userId,
            action: 'SERVICE_PART_REMOVED',
            entity: 'service',
            entityId: serviceId,
            details: JSON.stringify({
              partId: servicePart.partId,
              partName: servicePart.part.name,
              quantity: servicePart.quantity,
              totalPrice: servicePart.totalPrice,
              previousQty,
              newQty,
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
        // Restore stock for all used parts
        for (const servicePart of service.partsUsed) {
          await tx.part.update({
            where: { id: servicePart.partId },
            data: {
              quantity: servicePart.part.quantity + servicePart.quantity,
            },
          });
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
}
