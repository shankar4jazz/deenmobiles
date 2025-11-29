import { Response } from 'express';
import { AuthRequest } from '../types';
import { BranchInventoryService } from '../services/branchInventoryService';
import { StockMovementService } from '../services/stockMovementService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { StockMovementType } from '@prisma/client';

export class BranchInventoryController {
  /**
   * Get all branch inventories
   */
  static getAllBranchInventories = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const {
      branchId,
      itemId,
      search,
      stockStatus,
      isActive,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await BranchInventoryService.getAllBranchInventories({
      companyId,
      branchId: branchId as string,
      itemId: itemId as string,
      search: search as string,
      stockStatus: stockStatus as 'all' | 'low' | 'out' | 'normal',
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    return ApiResponse.success(res, result);
  });

  /**
   * Get branch inventory by ID
   */
  static getBranchInventoryById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const inventory = await BranchInventoryService.getBranchInventoryById(id, companyId);

    return ApiResponse.success(res, inventory);
  });

  /**
   * Add item to branch inventory
   */
  static addItemToBranch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const {
      itemId,
      branchId,
      stockQuantity,
      minStockLevel,
      maxStockLevel,
      reorderLevel,
      supplierId,
      lastPurchasePrice,
      lastPurchaseDate,
    } = req.body;

    const inventory = await BranchInventoryService.addItemToBranch({
      itemId,
      branchId,
      companyId,
      stockQuantity: stockQuantity ? parseFloat(stockQuantity) : undefined,
      minStockLevel: minStockLevel ? parseFloat(minStockLevel) : undefined,
      maxStockLevel: maxStockLevel ? parseFloat(maxStockLevel) : undefined,
      reorderLevel: reorderLevel ? parseFloat(reorderLevel) : undefined,
      supplierId,
      lastPurchasePrice: lastPurchasePrice ? parseFloat(lastPurchasePrice) : undefined,
      lastPurchaseDate: lastPurchaseDate ? new Date(lastPurchaseDate) : undefined,
      userId,
    });

    return ApiResponse.created(res, inventory, 'Item added to branch inventory successfully');
  });

  /**
   * Update branch inventory settings
   */
  static updateBranchInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const {
      minStockLevel,
      maxStockLevel,
      reorderLevel,
      supplierId,
      isActive,
    } = req.body;

    const inventory = await BranchInventoryService.updateBranchInventory(id, companyId, {
      minStockLevel: minStockLevel !== undefined ? parseFloat(minStockLevel) : undefined,
      maxStockLevel: maxStockLevel !== undefined ? parseFloat(maxStockLevel) : undefined,
      reorderLevel: reorderLevel !== undefined ? parseFloat(reorderLevel) : undefined,
      supplierId,
      isActive,
    });

    return ApiResponse.success(res, inventory, 'Branch inventory updated successfully');
  });

  /**
   * Adjust stock quantity
   */
  static adjustStock = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;
    const branchId = req.user!.branchId || req.body.branchId;
    const {
      quantity,
      movementType,
      notes,
      referenceType,
      referenceId,
    } = req.body;

    const inventory = await BranchInventoryService.adjustStock({
      branchInventoryId: id,
      quantity: parseFloat(quantity),
      movementType: movementType as StockMovementType,
      notes,
      referenceType,
      referenceId,
      userId,
      branchId,
      companyId,
    });

    return ApiResponse.success(res, inventory, 'Stock adjusted successfully');
  });

  /**
   * Remove item from branch (soft delete)
   */
  static removeItemFromBranch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const inventory = await BranchInventoryService.removeItemFromBranch(id, companyId);

    return ApiResponse.success(res, inventory, 'Item removed from branch successfully');
  });

  /**
   * Get low stock items
   */
  static getLowStockItems = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { branchId } = req.query;

    const items = await BranchInventoryService.getLowStockItems(branchId as string, companyId);

    return ApiResponse.success(res, items);
  });

  /**
   * Get out of stock items
   */
  static getOutOfStockItems = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { branchId } = req.query;

    const items = await BranchInventoryService.getOutOfStockItems(branchId as string, companyId);

    return ApiResponse.success(res, items);
  });

  /**
   * Get branch inventory dropdown
   */
  static getBranchInventoryDropdown = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { branchId } = req.query;

    const inventories = await BranchInventoryService.getBranchInventoryDropdown(
      branchId as string,
      companyId
    );

    return ApiResponse.success(res, inventories);
  });

  /**
   * Get stock movements history for a branch
   */
  static getStockMovementsHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const branchId = req.user!.branchId || (req.query.branchId as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await StockMovementService.getStockMovements({
      companyId,
      branchId,
      page,
      limit,
    });

    return ApiResponse.success(res, result);
  });
}
