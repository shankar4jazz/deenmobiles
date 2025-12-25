import { api } from './api';
import {
  BranchInventory,
  BranchInventoryFormData,
  BranchInventoryUpdateData,
  BranchInventoryFilters,
  StockMovement,
  StockAdjustmentData,
} from '../types';

export const branchInventoryApi = {
  /**
   * Get all branch inventories with filters
   */
  getAllBranchInventories: async (
    filters?: BranchInventoryFilters
  ): Promise<{
    inventories: BranchInventory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.itemId) params.append('itemId', filters.itemId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.stockStatus) params.append('stockStatus', filters.stockStatus);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/branch-inventory?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get branch inventory by ID
   */
  getBranchInventoryById: async (id: string): Promise<BranchInventory> => {
    const response = await api.get(`/branch-inventory/${id}`);
    return response.data.data;
  },

  /**
   * Get low stock items for a branch
   */
  getLowStockItems: async (branchId?: string): Promise<BranchInventory[]> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);

    const response = await api.get(`/branch-inventory/low-stock?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get out of stock items for a branch
   */
  getOutOfStockItems: async (branchId?: string): Promise<BranchInventory[]> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);

    const response = await api.get(`/branch-inventory/out-of-stock?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get branch inventory dropdown (for form selects)
   */
  getBranchInventoryDropdown: async (
    branchId?: string
  ): Promise<
    Array<{
      id: string;
      stockQuantity: number;
      item: {
        id: string;
        itemCode: string;
        itemName: string;
        description?: string;
        modelVariant?: string;
        purchasePrice?: number;
        salesPrice?: number;
        hsnCode?: string;
        itemCategory?: {
          id: string;
          name: string;
        };
        itemUnit?: {
          id: string;
          name: string;
        };
        itemGSTRate?: {
          id: string;
          name: string;
          rate: number;
        };
        taxType?: string;
      };
    }>
  > => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);

    const response = await api.get(`/branch-inventory/dropdown?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Add item to branch inventory
   */
  addItemToBranch: async (data: BranchInventoryFormData): Promise<BranchInventory> => {
    const response = await api.post('/branch-inventory', data);
    return response.data.data;
  },

  /**
   * Update branch inventory settings
   */
  updateBranchInventory: async (
    id: string,
    data: BranchInventoryUpdateData
  ): Promise<BranchInventory> => {
    const response = await api.put(`/branch-inventory/${id}`, data);
    return response.data.data;
  },

  /**
   * Adjust stock quantity
   */
  adjustStock: async (
    id: string,
    data: StockAdjustmentData
  ): Promise<BranchInventory> => {
    const response = await api.post(`/branch-inventory/${id}/adjust`, data);
    return response.data.data;
  },

  /**
   * Remove item from branch (soft delete)
   */
  removeItemFromBranch: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/branch-inventory/${id}`);
    return response.data;
  },

  /**
   * Get stock movement history for a branch inventory item
   */
  getStockMovementHistory: async (
    id: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    movements: StockMovement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(
      `/branch-inventory/${id}/movements?${params.toString()}`
    );
    return response.data.data;
  },

  /**
   * Get all stock movements for a branch
   */
  getAllStockMovements: async (filters: {
    branchId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    movements: StockMovement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const params = new URLSearchParams();
    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(
      `/branch-inventory/movements/history?${params.toString()}`
    );
    return response.data.data;
  },
};
