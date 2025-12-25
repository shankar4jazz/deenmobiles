import { api } from './api';
import {
  CustomerDevice,
  CustomerDeviceFormData,
  CustomerDeviceUpdateData,
  CustomerDeviceFilters,
  CustomerDeviceSummary,
  Service,
} from '../types';

export interface CreateCustomerDeviceWithImages extends CustomerDeviceFormData {
  images?: File[];
}

export const customerDeviceApi = {
  /**
   * Create a new customer device with optional images
   */
  createDevice: async (data: CreateCustomerDeviceWithImages): Promise<CustomerDevice> => {
    const { images, ...deviceData } = data;

    // If images are provided, use FormData
    if (images && images.length > 0) {
      const formData = new FormData();

      // Append device data
      Object.entries(deviceData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((item) => formData.append(key, item));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // Append images
      images.forEach((image) => {
        formData.append('deviceImages', image);
      });

      const response = await api.post('/customer-devices', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    }

    // No images, use regular JSON
    const response = await api.post('/customer-devices', deviceData);
    return response.data.data;
  },

  /**
   * Get all devices for a customer with filters and pagination
   */
  getAllDevices: async (
    customerId: string,
    filters?: CustomerDeviceFilters
  ): Promise<{
    devices: CustomerDevice[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const params = new URLSearchParams();
    params.append('customerId', customerId);

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.brandId) params.append('brandId', filters.brandId);
    if (filters?.modelId) params.append('modelId', filters.modelId);
    if (filters?.conditionId) params.append('conditionId', filters.conditionId);

    const response = await api.get(`/customer-devices?${params.toString()}`);
    return {
      devices: response.data.data.devices,
      pagination: response.data.data.pagination,
    };
  },

  /**
   * Get device by ID
   */
  getDeviceById: async (id: string, customerId: string): Promise<CustomerDevice> => {
    const params = new URLSearchParams();
    params.append('customerId', customerId);

    const response = await api.get(`/customer-devices/${id}?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Update customer device
   */
  updateDevice: async (
    id: string,
    customerId: string,
    data: CustomerDeviceUpdateData
  ): Promise<CustomerDevice> => {
    const updateData = {
      ...data,
      customerId,
    };

    const response = await api.put(`/customer-devices/${id}`, updateData);
    return response.data.data;
  },

  /**
   * Deactivate (soft delete) a customer device
   */
  deactivateDevice: async (id: string, customerId: string): Promise<void> => {
    const params = new URLSearchParams();
    params.append('customerId', customerId);

    await api.delete(`/customer-devices/${id}?${params.toString()}`);
  },

  /**
   * Get service history for a device
   */
  getDeviceServiceHistory: async (
    deviceId: string,
    customerId: string
  ): Promise<{
    device: {
      id: string;
      brand: string;
      model: string;
      imei?: string;
      color?: string;
    };
    services: Service[];
    totalServices: number;
  }> => {
    const params = new URLSearchParams();
    params.append('customerId', customerId);

    const response = await api.get(
      `/customer-devices/${deviceId}/service-history?${params.toString()}`
    );
    return response.data.data;
  },

  /**
   * Get devices summary for a customer
   */
  getDevicesSummary: async (customerId: string): Promise<CustomerDeviceSummary> => {
    const response = await api.get(`/customer-devices/summary/${customerId}`);
    return response.data.data;
  },
};
