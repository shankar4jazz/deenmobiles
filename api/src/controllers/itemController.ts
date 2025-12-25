import { Response } from 'express';
import { AuthRequest } from '../types';
import { ItemService } from '../services/itemService';
import { ApiResponse } from '../utils/response';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export class ItemController {
  /**
   * Get all items
   */
  static getAllItems = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const {
      search,
      categoryId,
      brandId,
      modelId,
      isActive,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await ItemService.getAllItems({
      companyId,
      search: search as string,
      categoryId: categoryId as string,
      brandId: brandId as string,
      modelId: modelId as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    return ApiResponse.success(res, result);
  });

  /**
   * Get item by ID
   */
  static getItemById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const item = await ItemService.getItemById(id, companyId);

    return ApiResponse.success(res, item);
  });

  /**
   * Create a new item
   */
  static createItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const {
      itemName,
      description,
      modelVariant,
      brandId,
      modelId,
      categoryId,
      unitId,
      purchasePrice,
      salesPrice,
      hsnCode,
      gstRateId,
      taxType,
      warrantyDays,
      warrantyType,
    } = req.body;

    const item = await ItemService.createItem({
      itemName,
      description,
      modelVariant,
      brandId,
      modelId,
      categoryId,
      unitId,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      salesPrice: salesPrice ? parseFloat(salesPrice) : undefined,
      hsnCode,
      gstRateId,
      taxType,
      companyId,
      warrantyDays: warrantyDays !== undefined ? parseInt(warrantyDays) : undefined,
      warrantyType,
    });

    return ApiResponse.created(res, item, 'Item created successfully');
  });

  /**
   * Update an item
   */
  static updateItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const {
      itemName,
      description,
      modelVariant,
      brandId,
      modelId,
      categoryId,
      unitId,
      purchasePrice,
      salesPrice,
      hsnCode,
      gstRateId,
      taxType,
      isActive,
      warrantyDays,
      warrantyType,
    } = req.body;

    const item = await ItemService.updateItem(id, companyId, {
      itemName,
      description,
      modelVariant,
      brandId,
      modelId,
      categoryId,
      unitId,
      purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : undefined,
      salesPrice: salesPrice !== undefined ? parseFloat(salesPrice) : undefined,
      hsnCode,
      gstRateId,
      taxType,
      isActive,
      warrantyDays: warrantyDays !== undefined ? parseInt(warrantyDays) : undefined,
      warrantyType,
    });

    return ApiResponse.success(res, item, 'Item updated successfully');
  });

  /**
   * Deactivate an item
   */
  static deactivateItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const item = await ItemService.deactivateItem(id, companyId);

    return ApiResponse.success(res, item, 'Item deactivated successfully');
  });

  /**
   * Get items dropdown
   */
  static getItemsDropdown = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { categoryId, brandId } = req.query;

    const items = await ItemService.getItemsDropdown(companyId, {
      categoryId: categoryId as string,
      brandId: brandId as string,
    });

    return ApiResponse.success(res, items);
  });

  /**
   * Check if item name exists
   */
  static checkItemNameExists = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { itemName, excludeItemId } = req.query;

    if (!itemName) {
      throw new AppError(400, 'Item name is required');
    }

    const result = await ItemService.checkItemNameExists(
      itemName as string,
      companyId,
      excludeItemId as string | undefined
    );

    return ApiResponse.success(res, result);
  });
}

