import { Response } from 'express';
import { ServiceService } from '../services/serviceService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { ServiceStatus } from '@prisma/client';
import { uploadFilesToS3 } from '../middleware/s3Upload';

export class ServiceController {
  /**
   * POST /api/v1/services
   * Create a new service
   */
  static createService = asyncHandler(async (req: AuthRequest, res: Response) => {
    const serviceData = req.body;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const branchId = req.user!.branchId || serviceData.branchId;

    const service = await ServiceService.createService({
      ...serviceData,
      branchId,
      companyId,
      createdBy: userId,
    });

    return ApiResponse.created(res, service, 'Service created successfully');
  });

  /**
   * GET /api/v1/services
   * Get all services with filters and pagination
   */
  static getAllServices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;
    const userId = req.user!.userId;

    // Build filters based on role
    const filters: any = {
      companyId,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    // Role-based filtering
    if (userRole === 'TECHNICIAN') {
      // Technicians only see their assigned services
      filters.assignedToId = userId;
    } else if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      // Branch users see only their branch services (except SUPER_ADMIN and ADMIN)
      filters.branchId = req.user!.branchId;
    }

    // Optional filters
    if (req.query.branchId) filters.branchId = req.query.branchId as string;
    if (req.query.customerId) filters.customerId = req.query.customerId as string;
    if (req.query.assignedToId) filters.assignedToId = req.query.assignedToId as string;
    if (req.query.status) filters.status = req.query.status as ServiceStatus;
    if (req.query.ticketNumber) filters.ticketNumber = req.query.ticketNumber as string;
    if (req.query.search) filters.searchTerm = req.query.search as string;

    // Date range filters
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

    // Include stats if requested
    if (req.query.includeStats === 'true') filters.includeStats = true;

    const result = await ServiceService.getServices(filters);

    return ApiResponse.success(res, result, 'Services retrieved successfully');
  });

  /**
   * GET /api/v1/services/:id
   * Get service by ID
   */
  static getServiceById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const service = await ServiceService.getServiceById(id, companyId);

    return ApiResponse.success(res, service, 'Service retrieved successfully');
  });

  /**
   * PUT /api/v1/services/:id
   * Update service
   */
  static updateService = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const updateData = req.body;

    const service = await ServiceService.updateService(id, updateData, userId, companyId);

    return ApiResponse.success(res, service, 'Service updated successfully');
  });

  /**
   * DELETE /api/v1/services/:id
   * Delete service
   */
  static deleteService = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;

    await ServiceService.deleteService(id, userId, companyId);

    return ApiResponse.success(res, null, 'Service deleted successfully');
  });

  /**
   * POST /api/v1/services/:id/images
   * Upload service images to S3
   */
  static uploadImages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return ApiResponse.error(res, 'No images provided', 400);
    }

    // Upload files to S3 first
    const imageUrls = await uploadFilesToS3(files, 'services', id);

    // Save image records with S3 URLs
    const images = await ServiceService.uploadServiceImages(id, imageUrls, userId, companyId);

    return ApiResponse.created(res, images, 'Service images uploaded successfully');
  });

  /**
   * DELETE /api/v1/services/:id/images/:imageId
   * Delete service image
   */
  static deleteImage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, imageId } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;

    await ServiceService.deleteServiceImage(imageId, id, userId, companyId);

    return ApiResponse.success(res, null, 'Service image deleted successfully');
  });

  /**
   * POST /api/v1/services/:id/device-images
   * Upload device images to S3
   */
  static uploadDeviceImages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return ApiResponse.error(res, 'No images provided', 400);
    }

    // Upload files to S3 first
    const imageUrls = await uploadFilesToS3(files, 'devices', id);

    // Save device image records with S3 URLs
    const images = await ServiceService.uploadDeviceImages(id, imageUrls, userId, companyId);

    return ApiResponse.created(res, images, 'Device images uploaded successfully');
  });

  /**
   * DELETE /api/v1/services/:id/device-images/:imageId
   * Delete device image
   */
  static deleteDeviceImage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, imageId } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;

    await ServiceService.deleteDeviceImage(imageId, id, userId, companyId);

    return ApiResponse.success(res, null, 'Device image deleted successfully');
  });

  /**
   * POST /api/v1/services/:id/parts
   * Add service part
   */
  static addServicePart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { partId, quantity, unitPrice } = req.body;

    const servicePart = await ServiceService.addServicePart({
      serviceId: id,
      partId,
      quantity,
      unitPrice,
      userId,
      companyId,
    });

    return ApiResponse.created(res, servicePart, 'Service part added successfully');
  });

  /**
   * DELETE /api/v1/services/:id/parts/:partId
   * Remove service part
   */
  static removeServicePart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, partId } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;

    await ServiceService.removeServicePart(partId, id, userId, companyId);

    return ApiResponse.success(res, null, 'Service part removed successfully');
  });

  /**
   * PUT /api/v1/services/:id/status
   * Update service status
   */
  static updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { status, notes } = req.body;

    const service = await ServiceService.updateServiceStatus(id, status as ServiceStatus, notes, userId, companyId);

    return ApiResponse.success(res, service, 'Service status updated successfully');
  });

  /**
   * PUT /api/v1/services/:id/assign
   * Assign service to technician
   */
  static assignTechnician = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { assignedToId, notes } = req.body;

    const service = await ServiceService.assignTechnician(id, assignedToId, notes, userId, companyId);

    return ApiResponse.success(res, service, 'Service assigned to technician successfully');
  });

  /**
   * PUT /api/v1/services/:id/diagnosis
   * Update service diagnosis
   */
  static updateDiagnosis = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { diagnosis, estimatedCost } = req.body;

    const service = await ServiceService.updateDiagnosis(id, diagnosis, estimatedCost, userId, companyId);

    return ApiResponse.success(res, service, 'Service diagnosis updated successfully');
  });

  /**
   * GET /api/v1/services/:id/history
   * Get service status history
   */
  static getStatusHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const history = await ServiceService.getStatusHistory(id, companyId);

    return ApiResponse.success(res, history, 'Service status history retrieved successfully');
  });

  /**
   * POST /api/v1/services/:id/payment-entries
   * Add a payment entry to an existing service
   */
  static addPaymentEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { amount, paymentMethodId, notes, transactionId } = req.body;

    const result = await ServiceService.addPaymentEntry({
      serviceId: id,
      amount,
      paymentMethodId,
      notes,
      transactionId,
      userId,
      companyId,
    });

    return ApiResponse.created(res, result, 'Payment entry added successfully');
  });
}
