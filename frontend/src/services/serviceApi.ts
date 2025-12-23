import { api } from './api';

// Service Types
export interface Service {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerDeviceId?: string;
  deviceModel: string;
  deviceIMEI?: string;
  devicePassword?: string;
  devicePattern?: string;
  deviceCondition?: string;
  intakeNotes?: string;
  damageCondition: string;
  diagnosis?: string;
  estimatedCost: number;
  actualCost?: number;
  labourCharge?: number;
  advancePayment: number;
  status: ServiceStatus;
  assignedToId?: string;
  companyId: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deliveredAt?: string;
  notServiceableReason?: string;
  deviceReturnedAt?: string;
  deviceReturnedById?: string;
  deviceReturnedBy?: {
    id: string;
    name: string;
  };
  // Repeated service tracking
  isRepeatedService?: boolean;
  previousServiceId?: string;
  previousService?: {
    id: string;
    ticketNumber: string;
    createdAt: string;
    status: ServiceStatus;
    damageCondition: string;
    completedAt?: string;
    faults?: { fault: { id: string; name: string } }[];
  };
  // Warranty repair fields
  isWarrantyRepair?: boolean;
  warrantyReason?: string;
  matchingFaultIds?: string[];
  dataWarrantyAccepted?: boolean;
  sendNotificationOnAssign?: boolean;
  createdById?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  createdBy?: {
    id: string;
    name: string;
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
  condition?: {
    id: string;
    name: string;
    description?: string;
  };
  accessories?: {
    id: string;
    accessoryId: string;
    accessory: {
      id: string;
      name: string;
    };
  }[];
  faults?: {
    id: string;
    faultId: string;
    fault: {
      id: string;
      name: string;
      code?: string;
      defaultPrice: number;
    };
  }[];
  images?: ServiceImage[];
  deviceImages?: DeviceImage[];
  partsUsed?: ServicePart[];
  statusHistory?: ServiceStatusHistory[];
  paymentEntries?: PaymentEntry[];
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
  partId?: string;             // Legacy
  branchInventoryId?: string;  // New
  itemId?: string;             // New
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  // Customer approval fields
  isApproved: boolean;
  approvalMethod?: string;     // PHONE_CALL, WHATSAPP, IN_PERSON, SMS
  approvalNote?: string;
  approvedAt?: string;
  approvedById?: string;
  approvedBy?: {
    id: string;
    name: string;
  };
  part?: {                     // Legacy
    id: string;
    name: string;
    partNumber?: string;
  };
  branchInventory?: {          // New
    id: string;
    stockQuantity: number;
  };
  item?: {                     // New
    id: string;
    itemName: string;
    itemCode: string;
  };
}

export interface BranchInventoryPart {
  id: string;
  stockQuantity: number;
  item: {
    id: string;
    itemCode: string;
    itemName: string;
    salesPrice: number | null;
    purchasePrice: number | null;
    barcode: string | null;
    itemUnit: {
      name: string;
      symbol: string | null;
    } | null;
    itemCategory: {
      name: string;
    } | null;
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
  NOT_SERVICEABLE = 'NOT_SERVICEABLE',
}

export interface PaymentEntryData {
  amount: number;
  paymentMethodId: string;
  notes?: string;
  transactionId?: string;
  paymentDate?: Date;
}

export interface PaymentEntry {
  id: string;
  amount: number;
  paymentMethodId: string;
  paymentMethod: {
    id: string;
    name: string;
  };
  notes?: string;
  transactionId?: string;
  paymentDate: string;
  createdAt: string;
}

export interface AddPaymentEntryData {
  amount: number;
  paymentMethodId: string;
  notes?: string;
  transactionId?: string;
}

export interface BulkPaymentEntryData {
  payments: Array<{
    amount: number;
    paymentMethodId: string;
    transactionId?: string;
  }>;
  notes?: string;
  markAsCompleted?: boolean;
  markAsDelivered?: boolean;
}

export interface ServiceNote {
  id: string;
  serviceId: string;
  note: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export interface CreateServiceData {
  customerId: string;
  customerDeviceId: string;
  faultIds: string[];
  damageCondition: string;
  damageConditionIds?: string[];
  diagnosis?: string;
  estimatedCost?: number;
  actualCost?: number;
  paymentEntries?: PaymentEntryData[];
  branchId?: string;
  images?: File[];
  // Intake fields (moved from device level)
  devicePassword?: string;
  devicePattern?: string;
  deviceCondition?: string;
  intakeNotes?: string;
  accessoryIds?: string[];
  // New fields
  dataWarrantyAccepted?: boolean;
  sendNotificationOnAssign?: boolean;
  // Warranty repair fields
  isWarrantyRepair?: boolean;
  warrantyReason?: string;
  matchingFaultIds?: string[];
}

export interface UpdateServiceData {
  customerDeviceId?: string;
  faultIds?: string[];
  damageCondition?: string;
  diagnosis?: string;
  estimatedCost?: number;
  actualCost?: number;
  advancePayment?: number;
  // Intake fields
  devicePassword?: string;
  devicePattern?: string;
  deviceCondition?: string;
  intakeNotes?: string;
  accessoryIds?: string[];
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
  unassigned?: boolean;
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
  branchInventoryId: string;  // Changed from partId
  quantity: number;
  unitPrice: number;
  isExtraSpare?: boolean;  // true = extra spare, false = tagged part
  faultTag?: string;  // Which fault tag this part belongs to
}

export type ApprovalMethod = 'PHONE_CALL' | 'WHATSAPP' | 'IN_PERSON' | 'SMS';

export interface ApproveServicePartData {
  approvalMethod: ApprovalMethod;
  approvalNote?: string;
}

export interface PreviousServiceInfo {
  isRepeated: boolean;
  lastService: {
    id: string;
    ticketNumber: string;
    createdAt: string;
    status: ServiceStatus;
    damageCondition: string;
    completedAt?: string;
    faults?: { id: string; name: string }[];
  } | null;
  daysSinceLastService: number | null;
  hasFaultMatch: boolean;
  matchingFaultIds: string[];
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
   * Check if a device has been serviced within the last 30 days
   * Optionally pass faultIds to check for matching faults
   */
  checkPreviousServices: async (customerDeviceId: string, faultIds?: string[]): Promise<PreviousServiceInfo> => {
    const params = new URLSearchParams();
    if (faultIds && faultIds.length > 0) {
      params.append('faultIds', faultIds.join(','));
    }
    const queryString = params.toString();
    const url = `/services/check-previous/${customerDeviceId}${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
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
    if (filters?.unassigned) params.append('unassigned', 'true');

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
   * Get available parts from branch inventory for a service
   */
  getAvailableParts: async (serviceId: string, search?: string): Promise<BranchInventoryPart[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await api.get(`/services/${serviceId}/available-parts?${params.toString()}`);
    return response.data.data;
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
   * Update service part (quantity and/or unit price)
   */
  updateServicePart: async (
    serviceId: string,
    partId: string,
    data: { quantity?: number; unitPrice?: number }
  ): Promise<ServicePart> => {
    const response = await api.put(`/services/${serviceId}/parts/${partId}`, data);
    return response.data.data;
  },

  /**
   * Approve a service part (deduct stock and record customer approval)
   */
  approveServicePart: async (
    serviceId: string,
    partId: string,
    data: ApproveServicePartData
  ): Promise<ServicePart> => {
    const response = await api.post(`/services/${serviceId}/parts/${partId}/approve`, data);
    return response.data.data;
  },

  /**
   * Approve a service part for warranty repair (staff internal approval)
   * Deducts stock but does NOT charge the customer
   */
  approveServicePartForWarranty: async (
    serviceId: string,
    partId: string,
    approvalNote?: string
  ): Promise<ServicePart> => {
    const response = await api.post(`/services/${serviceId}/parts/${partId}/approve-warranty`, { approvalNote });
    return response.data.data;
  },

  /**
   * Update service status
   */
  updateServiceStatus: async (
    serviceId: string,
    status: ServiceStatus,
    notes?: string,
    notServiceableReason?: string
  ): Promise<Service> => {
    const response = await api.put(`/services/${serviceId}/status`, { status, notes, notServiceableReason });
    return response.data.data;
  },

  /**
   * Mark device as returned to customer
   */
  markDeviceReturned: async (serviceId: string): Promise<Service> => {
    const response = await api.put(`/services/${serviceId}/device-returned`);
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
      assignedToId: technicianId,
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

  /**
   * Add a payment entry to an existing service
   */
  addPaymentEntry: async (
    serviceId: string,
    data: AddPaymentEntryData
  ): Promise<{ paymentEntry: PaymentEntry; service: Service }> => {
    const response = await api.post(`/services/${serviceId}/payment-entries`, data);
    return response.data.data;
  },

  /**
   * Add multiple payment entries to an existing service (bulk payment)
   */
  addBulkPaymentEntries: async (
    serviceId: string,
    data: BulkPaymentEntryData
  ): Promise<{ paymentEntries: PaymentEntry[]; service: Service }> => {
    const response = await api.post(`/services/${serviceId}/payment-entries/bulk`, data);
    return response.data.data;
  },

  /**
   * Update estimated cost only
   */
  updateEstimatedCost: async (serviceId: string, estimatedCost: number): Promise<Service> => {
    const response = await api.put(`/services/${serviceId}`, { estimatedCost });
    return response.data.data;
  },

  /**
   * Update labour charge
   */
  updateLabourCharge: async (serviceId: string, labourCharge: number): Promise<Service> => {
    const response = await api.put(`/services/${serviceId}/labour-charge`, { labourCharge });
    return response.data.data;
  },

  /**
   * Get all notes for a service
   */
  getNotes: async (serviceId: string): Promise<ServiceNote[]> => {
    const response = await api.get(`/services/${serviceId}/notes`);
    return response.data.data;
  },

  /**
   * Add a note to a service
   */
  addNote: async (serviceId: string, note: string): Promise<ServiceNote> => {
    const response = await api.post(`/services/${serviceId}/notes`, { note });
    return response.data.data;
  },

  /**
   * Delete a note from a service
   */
  deleteNote: async (serviceId: string, noteId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/services/${serviceId}/notes/${noteId}`);
    return response.data.data;
  },
};
