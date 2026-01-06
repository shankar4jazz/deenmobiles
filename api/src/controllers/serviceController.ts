import { Response } from 'express';
import { ServiceService } from '../services/serviceService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';
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

    // Unassigned filter
    if (req.query.unassigned === 'true') filters.unassigned = true;

    // Undelivered filter (COMPLETED only - ready but not picked up)
    if (req.query.undelivered === 'true') filters.undelivered = true;

    // Completed all filter (COMPLETED + DELIVERED)
    if (req.query.completedAll === 'true') filters.completedAll = true;

    // Repeated service filter
    if (req.query.repeatedService === 'true') filters.repeatedService = true;

    // Fault IDs filter (comma-separated)
    if (req.query.faultIds) {
      filters.faultIds = (req.query.faultIds as string).split(',').filter(id => id.trim());
    }

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
   * GET /api/v1/services/:id/available-parts
   * Get available parts from branch inventory for adding to service
   */
  static getAvailableParts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const { search } = req.query;

    const parts = await ServiceService.getAvailablePartsForService(
      id,
      companyId,
      search as string | undefined
    );

    return ApiResponse.success(res, parts, 'Available parts retrieved successfully');
  });

  /**
   * POST /api/v1/services/:id/parts
   * Add service part
   */
  static addServicePart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { branchInventoryId, quantity, unitPrice, isExtraSpare, faultTag } = req.body;

    const servicePart = await ServiceService.addServicePart({
      serviceId: id,
      branchInventoryId,
      quantity,
      unitPrice,
      userId,
      companyId,
      isExtraSpare: isExtraSpare === true,
      faultTag: faultTag || undefined,
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
   * PUT /api/v1/services/:id/parts/:partId
   * Update service part (quantity and/or unit price)
   */
  static updateServicePart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, partId } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { quantity, unitPrice } = req.body;

    const servicePart = await ServiceService.updateServicePart(
      partId,
      id,
      userId,
      companyId,
      { quantity, unitPrice }
    );

    return ApiResponse.success(res, servicePart, 'Service part updated successfully');
  });

  /**
   * POST /api/v1/services/:id/parts/:partId/approve
   * Approve a service part (deduct stock and record approval)
   */
  static approveServicePart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, partId } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { approvalMethod, approvalNote } = req.body;

    if (!approvalMethod) {
      throw new AppError(400, 'Approval method is required');
    }

    const validMethods = ['PHONE_CALL', 'WHATSAPP', 'IN_PERSON', 'SMS'];
    if (!validMethods.includes(approvalMethod)) {
      throw new AppError(400, `Invalid approval method. Must be one of: ${validMethods.join(', ')}`);
    }

    const servicePart = await ServiceService.approveServicePart(
      partId,
      id,
      userId,
      companyId,
      approvalMethod,
      approvalNote
    );

    return ApiResponse.success(res, servicePart, 'Service part approved successfully');
  });

  /**
   * POST /api/v1/services/:id/parts/:partId/approve-warranty
   * Approve service part for warranty repair (staff internal approval)
   * Deducts stock but does NOT charge the customer
   */
  static approveServicePartForWarranty = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, partId } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { approvalNote } = req.body;

    const servicePart = await ServiceService.approveServicePartForWarranty(
      partId,
      id,
      userId,
      companyId,
      approvalNote
    );

    return ApiResponse.success(res, servicePart, 'Service part approved for warranty successfully');
  });

  /**
   * PUT /api/v1/services/:id/status
   * Update service status
   */
  static updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { status, notes, notServiceableReason } = req.body;

    const service = await ServiceService.updateServiceStatus(id, status as ServiceStatus, notes, userId, companyId, notServiceableReason);

    return ApiResponse.success(res, service, 'Service status updated successfully');
  });

  /**
   * PUT /api/v1/services/:id/device-returned
   * Mark device as returned to customer
   */
  static markDeviceReturned = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;

    const service = await ServiceService.markDeviceReturned(id, userId, companyId);

    return ApiResponse.success(res, service, 'Device marked as returned to customer');
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
   * PUT /api/v1/services/:id/labour-charge
   * Update service labour charge
   */
  static updateLabourCharge = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { labourCharge } = req.body;

    const service = await ServiceService.updateLabourCharge(id, labourCharge, userId, companyId);

    return ApiResponse.success(res, service, 'Labour charge updated successfully');
  });

  /**
   * PUT /api/v1/services/:id/discount
   * Update service discount
   */
  static updateDiscount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { discount } = req.body;

    const service = await ServiceService.updateDiscount(id, discount, userId, companyId);

    return ApiResponse.success(res, service, 'Discount updated successfully');
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

  /**
   * POST /api/v1/services/:id/payment-entries/bulk
   * Add multiple payment entries to an existing service
   */
  static addBulkPaymentEntries = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { payments, notes, markAsDelivered } = req.body;

    const result = await ServiceService.addBulkPaymentEntries({
      serviceId: id,
      payments,
      notes,
      markAsDelivered,
      userId,
      companyId,
    });

    return ApiResponse.created(res, result, 'Payment entries added successfully');
  });

  /**
   * GET /api/v1/services/:id/notes
   * Get all notes for a service
   */
  static getNotes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const notes = await ServiceService.getNotes(id, companyId);

    return ApiResponse.success(res, notes, 'Notes retrieved successfully');
  });

  /**
   * POST /api/v1/services/:id/notes
   * Add a note to a service
   */
  static addNote = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const { note } = req.body;

    const serviceNote = await ServiceService.addNote({
      serviceId: id,
      note,
      userId,
      companyId,
    });

    return ApiResponse.created(res, serviceNote, 'Note added successfully');
  });

  /**
   * DELETE /api/v1/services/:id/notes/:noteId
   * Delete a note from a service
   */
  static deleteNote = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { noteId } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;

    const result = await ServiceService.deleteNote(noteId, userId, companyId);

    return ApiResponse.success(res, result, 'Note deleted successfully');
  });

  /**
   * GET /api/v1/services/check-previous/:customerDeviceId
   * Check if a device has been serviced within the last 30 days
   */
  static checkPreviousServices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { customerDeviceId } = req.params;
    const companyId = req.user!.companyId;
    const { faultIds } = req.query;

    if (!customerDeviceId) {
      throw new AppError(400, 'Customer device ID is required');
    }

    // Parse faultIds from query string (comma-separated)
    let currentFaultIds: string[] | undefined;
    if (faultIds && typeof faultIds === 'string') {
      currentFaultIds = faultIds.split(',').filter(id => id.trim());
    }

    const result = await ServiceService.checkPreviousServices(customerDeviceId, companyId, currentFaultIds);

    return ApiResponse.success(res, result, 'Previous services check completed');
  });

  /**
   * GET /api/v1/services/check-active/:customerDeviceId
   * Check if a device has any active (non-delivered) service
   */
  static checkActiveServices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { customerDeviceId } = req.params;
    const companyId = req.user!.companyId;

    if (!customerDeviceId) {
      throw new AppError(400, 'Customer device ID is required');
    }

    const result = await ServiceService.checkActiveServices(customerDeviceId, companyId);

    return ApiResponse.success(res, result, 'Active services check completed');
  });

  /**
   * POST /api/v1/services/:id/refund
   * Process service refund
   */
  static processRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { reason, paymentMethodId } = req.body;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const branchId = req.user!.branchId;

    if (!reason || !paymentMethodId) {
      throw new AppError(400, 'Reason and payment method are required');
    }

    const result = await ServiceService.processServiceRefund({
      serviceId: id,
      reason,
      paymentMethodId,
      userId,
      companyId,
      branchId: branchId || '',
    });

    return ApiResponse.success(res, result, 'Refund processed successfully');
  });

  /**
   * POST /api/v1/services/:id/faults
   * Add a fault to an existing service
   */
  static addFaultToService = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { faultId, price } = req.body;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;

    if (!faultId) {
      throw new AppError(400, 'Fault ID is required');
    }

    const result = await ServiceService.addFaultToService(
      id,
      faultId,
      price,
      userId,
      companyId
    );

    return ApiResponse.success(res, result, 'Fault added successfully');
  });
}
