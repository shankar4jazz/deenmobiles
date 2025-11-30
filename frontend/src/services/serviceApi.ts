import { api } from './api';

// Service Types
export interface Service {
  id: string;
  ticketNumber: string;
  customerId: string;
  deviceModel: string;
  deviceIMEI?: string;
  devicePassword?: string;
  issue: string;
  diagnosis?: string;
  estimatedCost: number;
  actualCost?: number;
  advancePayment: number;
  status: ServiceStatus;
  assignedToId?: string;
  companyId: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deliveredAt?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
  };
  images?: ServiceImage[];
  deviceImages?: DeviceImage[];
  partsUsed?: ServicePart[];
  statusHistory?: ServiceStatusHistory[];
  _count?: {
    images: number;
    deviceImages: number;
    partsUsed: number;
  };
}

export interface ServiceImage {
  id: string;
  serviceId: string;
  imageUrl: string;
  caption?: string;
  createdAt: string;
}

export interface DeviceImage {
  id: string;
  serviceId: string;
  imageUrl: string;
  caption?: string;
  createdAt: string;
}

export interface ServicePart {
  id: string;
  serviceId: string;
  partId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  part: {
    id: string;
    name: string;
    partNumber?: string;
  };
}

export interface ServiceStatusHistory {
  id: string;
  serviceId: string;
  status: ServiceStatus;
  notes?: string;
  changedBy?: string;
  changedByUser?: {
    id: string;
    name: string;
    email?: string;
    role: string;
  };
  createdAt: string;
}

export enum ServiceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_PARTS = 'WAITING_PARTS',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface PaymentEntryData {
  amount: number;
  paymentMethodId: string;
  notes?: string;
  transactionId?: string;
  paymentDate?: Date;
}

export interface CreateServiceData {
  customerId: string;
  customerDeviceId: string;
  serviceCategoryId: string;
  issue: string;
  issueIds?: string[];
  diagnosis?: string;
  estimatedCost?: number;
  actualCost?: number;
  paymentEntries?: PaymentEntryData[];
  branchId?: string;
  images?: File[];
}

export interface UpdateServiceData {
  deviceModel?: string;
  deviceIMEI?: string;
  devicePassword?: string;
  issue?: string;
  diagnosis?: string;
  estimatedCost?: number;
  actualCost?: number;
  advancePayment?: number;
}

export interface ServiceFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  customerId?: string;
  assignedToId?: string;
  status?: ServiceStatus;
  ticketNumber?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  includeStats?: boolean;
}

export interface ServiceStats {
  total: number;
  pending: number;
  inProgress: number;
  waitingParts: number;
  completed: number;
  delivered: number;
  cancelled: number;
  unassigned: number;
}

export interface AddServicePartData {
  partId: string;
  quantity: number;
  unitPrice: number;
}

export const serviceApi = {
  /**
   * Create a new service
   */
  createService: async (data: CreateServiceData): Promise<Service> => {
    const response = await api.post('/services', data);
    return response.data.data;
  },

  /**
   * Get all services with filters and pagination
   */
  getAllServices: async (
    filters?: ServiceFilters
  ): Promise<{
    services: Service[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    stats?: ServiceStats;
  }> => {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.assignedToId) params.append('assignedToId', filters.assignedToId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.ticketNumber) params.append('ticketNumber', filters.ticketNumber);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.includeStats) params.append('includeStats', 'true');

    const response = await api.get(`/services?${params.toString()}`);
    return {
      services: response.data.data.services,
      pagination: response.data.data.pagination,
      ...(response.data.data.stats && { stats: response.data.data.stats }),
    };
  },

  /**
   * Get service by ID
   */
  getServiceById: async (id: string): Promise<Service> => {
    const response = await api.get(`/services/${id}`);
    return response.data.data;
  },

  /**
   * Update service
   */
  updateService: async (id: string, data: UpdateServiceData): Promise<Service> => {
    const response = await api.put(`/services/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete service
   */
  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
  },

  /**
   * Upload service images
   */
  uploadServiceImages: async (serviceId: string, files: File[]): Promise<ServiceImage[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('serviceImages', file);
    });

    const response = await api.post(`/services/${serviceId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Delete service image
   */
  deleteServiceImage: async (serviceId: string, imageId: string): Promise<void> => {
    await api.delete(`/services/${serviceId}/images/${imageId}`);
  },

  /**
   * Upload device images
   */
  uploadDeviceImages: async (serviceId: string, files: File[]): Promise<DeviceImage[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('deviceImages', file);
    });

    const response = await api.post(`/services/${serviceId}/device-images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Delete device image
   */
  deleteDeviceImage: async (serviceId: string, imageId: string): Promise<void> => {
    await api.delete(`/services/${serviceId}/device-images/${imageId}`);
  },

  /**
   * Add service part
   */
  addServicePart: async (serviceId: string, data: AddServicePartData): Promise<ServicePart> => {
    const response = await api.post(`/services/${serviceId}/parts`, data);
    return response.data.data;
  },

  /**
   * Remove service part
   */
  removeServicePart: async (serviceId: string, partId: string): Promise<void> => {
    await api.delete(`/services/${serviceId}/parts/${partId}`);
  },

  /**
   * Update service status
   */
  updateServiceStatus: async (
    serviceId: string,
    status: ServiceStatus,
    notes?: string
  ): Promise<Service> => {
    const response = await api.put(`/services/${serviceId}/status`, { status, notes });
    return response.data.data;
  },

  /**
   * Assign service to technician
   */
  assignTechnician: async (
    serviceId: string,
    technicianId: string,
    notes?: string
  ): Promise<Service> => {
    const response = await api.put(`/services/${serviceId}/assign`, {
      technicianId,
      notes,
    });
    return response.data.data;
  },

  /**
   * Update service diagnosis
   */
  updateDiagnosis: async (
    serviceId: string,
    diagnosis: string,
    estimatedCost?: number
  ): Promise<Service> => {
    const response = await api.put(`/services/${serviceId}/diagnosis`, {
      diagnosis,
      estimatedCost,
    });
    return response.data.data;
  },

  /**
   * Get service status history
   */
  getStatusHistory: async (serviceId: string): Promise<ServiceStatusHistory[]> => {
    const response = await api.get(`/services/${serviceId}/history`);
    return response.data.data;
  },
};
