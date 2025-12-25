import { api } from './api';
import {
  Inventory,
  InventoryFormData,
  InventoryFilters,
  StockMovement,
  StockAdjustmentData,
} from '../types';

export const inventoryApi = {
  /**
   * Create a new inventory item
   */
  createInventory: async (data: InventoryFormData): Promise<Inventory> => {
    const formData = new FormData();

    // Add all fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'billAttachment' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await api.post('/inventory', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Get all inventory items with filters and pagination
   */
  getAllInventory: async (
    filters?: InventoryFilters
  ): Promise<{
    inventories: Inventory[];
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
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.brandName) params.append('brandName', filters.brandName);
    if (filters?.gstRate) params.append('gstRate', filters.gstRate);
    if (filters?.stockStatus) params.append('stockStatus', filters.stockStatus);
    if (filters?.active !== undefined)
      params.append('active', filters.active.toString());
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/inventory?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get low stock items
   */
  getLowStockItems: async (branchId?: string): Promise<Inventory[]> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);

    const response = await api.get(`/inventory/low-stock?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get inventory item by ID
   */
  getInventoryById: async (id: string): Promise<Inventory> => {
    const response = await api.get(`/inventory/${id}`);
    return response.data.data;
  },

  /**
   * Update inventory item
   */
  updateInventory: async (
    id: string,
    data: Partial<InventoryFormData>
  ): Promise<Inventory> => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'billAttachment' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await api.put(`/inventory/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Adjust stock quantity
   */
  adjustStock: async (
    id: string,
    data: StockAdjustmentData
  ): Promise<Inventory> => {
    const response = await api.post(`/inventory/${id}/adjust-stock`, data);
    return response.data.data;
  },

  /**
   * Get stock movement history for an inventory item
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
      `/inventory/${id}/movements?${params.toString()}`
    );
    return response.data.data;
  },

  /**
   * Delete inventory item
   */
  deleteInventory: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },

  /**
   * Export inventory to Excel
   */
  exportToExcel: async (filters?: Partial<InventoryFilters>): Promise<Blob> => {
    const params = new URLSearchParams();

    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.brandName) params.append('brandName', filters.brandName);
    if (filters?.gstRate) params.append('gstRate', filters.gstRate);
    if (filters?.active !== undefined)
      params.append('active', filters.active.toString());

    const response = await api.get(
      `/inventory/export/excel?${params.toString()}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * Export inventory to CSV
   */
  exportToCSV: async (filters?: Partial<InventoryFilters>): Promise<Blob> => {
    const params = new URLSearchParams();

    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.brandName) params.append('brandName', filters.brandName);
    if (filters?.gstRate) params.append('gstRate', filters.gstRate);
    if (filters?.active !== undefined)
      params.append('active', filters.active.toString());

    const response = await api.get(
      `/inventory/export/csv?${params.toString()}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * Export inventory to PDF
   */
  exportToPDF: async (filters?: Partial<InventoryFilters>): Promise<Blob> => {
    const params = new URLSearchParams();

    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.brandName) params.append('brandName', filters.brandName);
    if (filters?.gstRate) params.append('gstRate', filters.gstRate);
    if (filters?.active !== undefined)
      params.append('active', filters.active.toString());

    const response = await api.get(
      `/inventory/export/pdf?${params.toString()}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * Get all stock movements with filters
   */
  getAllStockMovements: async (filters?: {
    branchId?: string;
    inventoryId?: string;
    movementType?: string;
    startDate?: string;
    endDate?: string;
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

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.inventoryId) params.append('inventoryId', filters.inventoryId);
    if (filters?.movementType) params.append('movementType', filters.movementType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(
      `/inventory/movements/all?${params.toString()}`
    );
    return response.data.data;
  },
};
