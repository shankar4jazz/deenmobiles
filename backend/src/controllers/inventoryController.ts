import { Response } from 'express';
import { InventoryService } from '../services/inventoryService';
import { StockMovementService } from '../services/stockMovementService';
import { ExportService } from '../services/exportService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class InventoryController {
  /**
   * POST /api/v1/inventory
   * Create a new inventory item
   */
  static createInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const inventoryData = req.body;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;

    // Handle file upload if present
    if (req.file) {
      inventoryData.billAttachmentUrl = req.file.path || req.file.filename;
    }

    const inventory = await InventoryService.createInventory(
      {
        ...inventoryData,
        companyId,
      },
      userId
    );

    return ApiResponse.created(res, inventory, 'Inventory item created successfully');
  });

  /**
   * GET /api/v1/inventory
   * Get all inventory items with filters and pagination
   */
  static getAllInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const branchId = req.query.branchId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      companyId,
      branchId,
      search: req.query.search as string,
      category: req.query.category as any,
      brandName: req.query.brandName as string,
      gstRate: req.query.gstRate as any,
      stockStatus: (req.query.stockStatus as 'all' | 'low' | 'out') || 'all',
      active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
      page,
      limit,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await InventoryService.getInventories(filters);

    return ApiResponse.success(res, result, 'Inventory items retrieved successfully');
  });

  /**
   * GET /api/v1/inventory/low-stock
   * Get low stock items
   */
  static getLowStockItems = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const branchId = req.query.branchId as string;

    const lowStockItems = await InventoryService.getLowStockItems(companyId, branchId);

    return ApiResponse.success(res, lowStockItems, 'Low stock items retrieved successfully');
  });

  /**
   * GET /api/v1/inventory/:id
   * Get inventory item by ID
   */
  static getInventoryById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const inventory = await InventoryService.getInventoryById(id, companyId);

    return ApiResponse.success(res, inventory, 'Inventory item retrieved successfully');
  });

  /**
   * PUT /api/v1/inventory/:id
   * Update inventory item
   */
  static updateInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const updateData = req.body;

    // Handle file upload if present
    if (req.file) {
      updateData.billAttachmentUrl = req.file.path || req.file.filename;
    }

    const inventory = await InventoryService.updateInventory(id, companyId, updateData, userId);

    return ApiResponse.success(res, inventory, 'Inventory item updated successfully');
  });

  /**
   * POST /api/v1/inventory/:id/adjust-stock
   * Adjust stock quantity
   */
  static adjustStock = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const adjustmentData = {
      ...req.body,
      userId,
    };

    const inventory = await InventoryService.adjustStock(id, companyId, adjustmentData);

    return ApiResponse.success(res, inventory, 'Stock adjusted successfully');
  });

  /**
   * GET /api/v1/inventory/:id/movements
   * Get stock movement history for an inventory item
   */
  static getStockMovementHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await InventoryService.getStockMovementHistory(id, companyId, page, limit);

    return ApiResponse.success(res, result, 'Stock movement history retrieved successfully');
  });

  /**
   * DELETE /api/v1/inventory/:id
   * Delete inventory item (soft delete if has movements)
   */
  static deleteInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const result = await InventoryService.deleteInventory(id, companyId);

    return ApiResponse.success(res, result.inventory, result.message);
  });

  /**
   * GET /api/v1/inventory/export/excel
   * Export inventory to Excel
   */
  static exportToExcel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const filters = {
      companyId,
      branchId: req.query.branchId as string,
      category: req.query.category as any,
      brandName: req.query.brandName as string,
      gstRate: req.query.gstRate as any,
      active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
    };

    const workbook = await ExportService.exportToExcel(filters);

    // Set headers for Excel download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=inventory_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  });

  /**
   * GET /api/v1/inventory/export/csv
   * Export inventory to CSV
   */
  static exportToCSV = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const filters = {
      companyId,
      branchId: req.query.branchId as string,
      category: req.query.category as any,
      brandName: req.query.brandName as string,
      gstRate: req.query.gstRate as any,
      active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
    };

    const csv = await ExportService.exportToCSV(filters);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=inventory_${Date.now()}.csv`);

    res.send(csv);
  });

  /**
   * GET /api/v1/inventory/export/pdf
   * Export inventory to PDF
   */
  static exportToPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const filters = {
      companyId,
      branchId: req.query.branchId as string,
      category: req.query.category as any,
      brandName: req.query.brandName as string,
      gstRate: req.query.gstRate as any,
      active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
    };

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=inventory_${Date.now()}.pdf`);

    await ExportService.exportToPDF(filters, res);
  });

  /**
   * GET /api/v1/inventory/movements/all
   * Get all stock movements with filters
   */
  static getAllStockMovements = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const filters = {
      companyId,
      branchId: req.query.branchId as string,
      inventoryId: req.query.inventoryId as string,
      movementType: req.query.movementType as any,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      page,
      limit,
    };

    const result = await StockMovementService.getStockMovements(filters);

    return ApiResponse.success(res, result, 'Stock movements retrieved successfully');
  });
}
