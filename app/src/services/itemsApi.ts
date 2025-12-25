import { api } from './api';
import { Item, ItemFormData, ItemFilters } from '../types';

export const itemsApi = {
  /**
   * Create a new item
   */
  createItem: async (data: ItemFormData): Promise<Item> => {
    const response = await api.post('/items', data);
    return response.data.data;
  },

  /**
   * Get all items with filters and pagination
   */
  getAllItems: async (
    filters?: ItemFilters
  ): Promise<{
    items: Item[];
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
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.brandId) params.append('brandId', filters.brandId);
    if (filters?.modelId) params.append('modelId', filters.modelId);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/items?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get item by ID
   */
  getItemById: async (id: string): Promise<Item> => {
    const response = await api.get(`/items/${id}`);
    return response.data.data;
  },

  /**
   * Get items dropdown (for form selects)
   */
  getItemsDropdown: async (): Promise<
    Array<{
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
    }>
  > => {
    const response = await api.get('/items/dropdown');
    return response.data.data;
  },

  /**
   * Update item
   */
  updateItem: async (
    id: string,
    data: Partial<ItemFormData>
  ): Promise<Item> => {
    const response = await api.put(`/items/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate item (soft delete)
   */
  deactivateItem: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },

  /**
   * Check if item name exists
   */
  checkItemNameExists: async (
    itemName: string,
    excludeItemId?: string
  ): Promise<{ exists: boolean }> => {
    const params = new URLSearchParams();
    params.append('itemName', itemName);
    if (excludeItemId) {
      params.append('excludeItemId', excludeItemId);
    }

    const response = await api.get(`/items/check-name?${params.toString()}`);
    return response.data.data;
  },
};
