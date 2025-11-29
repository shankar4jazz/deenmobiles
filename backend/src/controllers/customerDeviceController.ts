import { Response } from 'express';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import CustomerDeviceService from '../services/customerDeviceService';

export class CustomerDeviceController {
  /**
   * GET /api/v1/customer-devices
   * Get all devices for a customer
   */
  static getAllDevices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { customerId } = req.query;

    if (!customerId) {
      return ApiResponse.badRequest(res, 'Customer ID is required');
    }

    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      search: req.query.search as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      brandId: req.query.brandId as string,
      modelId: req.query.modelId as string,
      conditionId: req.query.conditionId as string,
    };

    const result = await CustomerDeviceService.getAllCustomerDevices(
      customerId as string,
      companyId,
      filters
    );

    return ApiResponse.success(res, result, 'Customer devices retrieved successfully');
  });

  /**
   * GET /api/v1/customer-devices/:id
   * Get a single customer device by ID
   */
  static getDeviceById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { customerId } = req.query;

    if (!customerId) {
      return ApiResponse.badRequest(res, 'Customer ID is required');
    }

    const device = await CustomerDeviceService.getCustomerDeviceById(
      id,
      customerId as string,
      companyId
    );

    return ApiResponse.success(res, device, 'Customer device retrieved successfully');
  });

  /**
   * POST /api/v1/customer-devices
   * Create a new customer device
   */
  static createDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const branchId = req.user!.branchId;

    const deviceData = {
      ...req.body,
      companyId,
      branchId: branchId || req.body.branchId,
    };

    const device = await CustomerDeviceService.createCustomerDevice(deviceData);

    return ApiResponse.created(res, device, 'Customer device created successfully');
  });

  /**
   * PUT /api/v1/customer-devices/:id
   * Update a customer device
   */
  static updateDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { customerId } = req.body;

    if (!customerId) {
      return ApiResponse.badRequest(res, 'Customer ID is required');
    }

    const device = await CustomerDeviceService.updateCustomerDevice(
      id,
      customerId,
      companyId,
      req.body
    );

    return ApiResponse.success(res, device, 'Customer device updated successfully');
  });

  /**
   * DELETE /api/v1/customer-devices/:id
   * Deactivate (soft delete) a customer device
   */
  static deactivateDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { customerId } = req.query;

    if (!customerId) {
      return ApiResponse.badRequest(res, 'Customer ID is required');
    }

    const result = await CustomerDeviceService.deactivateCustomerDevice(
      id,
      customerId as string,
      companyId
    );

    return ApiResponse.success(res, result, 'Customer device deactivated successfully');
  });

  /**
   * GET /api/v1/customer-devices/:id/service-history
   * Get service history for a device
   */
  static getServiceHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { customerId } = req.query;

    if (!customerId) {
      return ApiResponse.badRequest(res, 'Customer ID is required');
    }

    const history = await CustomerDeviceService.getDeviceServiceHistory(
      id,
      customerId as string,
      companyId
    );

    return ApiResponse.success(res, history, 'Device service history retrieved successfully');
  });

  /**
   * GET /api/v1/customer-devices/summary/:customerId
   * Get devices summary for a customer
   */
  static getDevicesSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { customerId } = req.params;

    const summary = await CustomerDeviceService.getCustomerDevicesSummary(
      customerId,
      companyId
    );

    return ApiResponse.success(res, summary, 'Customer devices summary retrieved successfully');
  });
}
