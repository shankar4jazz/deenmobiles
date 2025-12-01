import { api } from './api';

// Types
export interface TechnicianLevel {
  id: string;
  name: string;
  code: string;
  minPoints: number;
  maxPoints: number | null;
  pointsMultiplier: number;
  incentivePercent: number;
  badgeColor: string | null;
  description: string | null;
  sortOrder: number;
  technicianCount?: number;
}

export interface TechnicianSkill {
  id: string;
  serviceCategoryId: string;
  categoryName?: string;
  serviceCategory?: {
    id: string;
    name: string;
    code?: string;
  };
  proficiencyLevel: number;
  isVerified: boolean;
  verifiedAt: string | null;
}

export interface TechnicianProfile {
  id: string;
  userId: string;
  companyId: string;
  branchId: string;
  totalPoints: number;
  currentLevelId: string | null;
  currentLevel: TechnicianLevel | null;
  averageRating: number | null;
  totalServicesCompleted: number;
  totalRevenue: number;
  avgCompletionHours: number | null;
  isAvailable: boolean;
  maxConcurrentJobs: number;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    profileImage: string | null;
    isActive?: boolean;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  skills?: TechnicianSkill[];
  nextLevel?: TechnicianLevel | null;
  pointsToNextLevel?: number;
  progressPercent?: number;
  pendingServicesCount?: number;
}

export interface TechnicianForAssignment {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  profileImage: string | null;
  profile: {
    totalPoints: number;
    currentLevel: TechnicianLevel | null;
    averageRating: number | null;
    totalServicesCompleted: number;
    isAvailable: boolean;
    maxConcurrentJobs: number;
  };
  skills: Array<{
    categoryId: string;
    categoryName: string;
    proficiencyLevel: number;
  }>;
  pendingServicesCount: number;
  inProgressCount: number;
  totalWorkload: number;
  workloadPercent: number;
  canAcceptMore: boolean;
}

export interface PointsHistoryEntry {
  id: string;
  points: number;
  type: string;
  description: string;
  basePoints: number;
  bonusMultiplier: number;
  serviceId: string | null;
  service?: {
    ticketNumber: string;
    deviceModel: string;
  };
  createdAt: string;
}

export interface PointsSummary {
  totalPoints: number;
  monthlyPoints: number;
  weeklyPoints: number;
  pointsByType: Array<{
    type: string;
    points: number;
  }>;
}

export interface TechnicianNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface TechnicianDashboardStats {
  profile: {
    totalPoints: number;
    currentLevel: TechnicianLevel | null;
    nextLevel: TechnicianLevel | null;
    pointsToNextLevel: number;
    progressPercent: number;
  };
  today: {
    assigned: number;
    completed: number;
    pending: number;
  };
  thisMonth: {
    servicesCompleted: number;
    totalPoints: number;
    averageRating: number | null;
  };
}

export interface AssignedService {
  id: string;
  ticketNumber: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
  deviceModel: string;
  issue: string;
  status: string;
  category: {
    id: string;
    name: string;
    technicianPoints: number;
  } | null;
  estimatedCost: number | null;
  createdAt: string;
  assignedAt: string;
}

export interface PromotionCandidate {
  profile: TechnicianProfile;
  currentLevel: TechnicianLevel | null;
  eligibleLevel: TechnicianLevel;
  totalPoints: number;
  pointsAboveThreshold: number;
}

export interface TechnicianPromotion {
  id: string;
  technicianProfileId: string;
  fromLevelId: string | null;
  toLevelId: string;
  fromLevel: TechnicianLevel | null;
  toLevel: TechnicianLevel;
  pointsAtPromotion: number;
  promotedBy: string;
  notes: string | null;
  createdAt: string;
}

export interface TechnicianFilters {
  branchId?: string;
  isAvailable?: boolean;
  levelId?: string;
  categoryId?: string;
  search?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API Client
export const technicianApi = {
  // ==================== PROFILE ENDPOINTS ====================

  /**
   * Create technician profile
   */
  createProfile: async (data: {
    userId: string;
    branchId: string;
    maxConcurrentJobs?: number;
    skillIds?: string[];
  }): Promise<TechnicianProfile> => {
    const response = await api.post('/technicians/profile', data);
    return response.data.data;
  },

  /**
   * Get current user's technician profile
   */
  getMyProfile: async (): Promise<TechnicianProfile> => {
    const response = await api.get('/technicians/profile/me');
    return response.data.data;
  },

  /**
   * Get technician profile by user ID
   */
  getProfile: async (userId: string): Promise<TechnicianProfile> => {
    const response = await api.get(`/technicians/${userId}/profile`);
    return response.data.data;
  },

  /**
   * Update technician profile
   */
  updateProfile: async (
    userId: string,
    data: { isAvailable?: boolean; maxConcurrentJobs?: number }
  ): Promise<TechnicianProfile> => {
    const response = await api.put(`/technicians/${userId}/profile`, data);
    return response.data.data;
  },

  /**
   * Get all technicians with filters
   */
  getAllTechnicians: async (
    filters?: TechnicianFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{ technicians: TechnicianProfile[]; pagination: Pagination }> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.isAvailable !== undefined) params.append('isAvailable', filters.isAvailable.toString());
    if (filters?.levelId) params.append('levelId', filters.levelId);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/technicians?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get technicians available for assignment
   */
  getTechniciansForAssignment: async (params: {
    branchId: string;
    categoryId?: string;
    available?: boolean;
    sortBy?: 'workload' | 'rating' | 'points';
  }): Promise<{ technicians: TechnicianForAssignment[] }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('branchId', params.branchId);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.available !== undefined) queryParams.append('available', params.available.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);

    const response = await api.get(`/technicians/available?${queryParams.toString()}`);
    return response.data.data;
  },

  // ==================== SKILLS ENDPOINTS ====================

  /**
   * Add skill to technician
   */
  addSkill: async (
    userId: string,
    data: { serviceCategoryId: string; proficiencyLevel?: number }
  ): Promise<TechnicianSkill> => {
    const response = await api.post(`/technicians/${userId}/skills`, data);
    return response.data.data;
  },

  /**
   * Update skill
   */
  updateSkill: async (
    skillId: string,
    data: { proficiencyLevel?: number; isVerified?: boolean }
  ): Promise<TechnicianSkill> => {
    const response = await api.put(`/technicians/skills/${skillId}`, data);
    return response.data.data;
  },

  /**
   * Remove skill from technician
   */
  removeSkill: async (skillId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/technicians/skills/${skillId}`);
    return response.data.data;
  },

  // ==================== POINTS ENDPOINTS ====================

  /**
   * Get points summary
   */
  getPointsSummary: async (userId: string): Promise<PointsSummary> => {
    const response = await api.get(`/technicians/${userId}/points`);
    return response.data.data;
  },

  /**
   * Get points history
   */
  getPointsHistory: async (
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ history: PointsHistoryEntry[]; pagination: Pagination }> => {
    const response = await api.get(`/technicians/${userId}/points/history?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  /**
   * Manual points adjustment
   */
  adjustPoints: async (
    userId: string,
    data: { points: number; reason: string }
  ): Promise<{ newTotalPoints: number }> => {
    const response = await api.post(`/technicians/${userId}/points/adjust`, data);
    return response.data.data;
  },

  // ==================== LEVEL ENDPOINTS ====================

  /**
   * Get all levels
   */
  getLevels: async (): Promise<{ levels: TechnicianLevel[] }> => {
    const response = await api.get('/technicians/levels');
    return response.data.data;
  },

  /**
   * Create level
   */
  createLevel: async (data: {
    name: string;
    code: string;
    minPoints: number;
    maxPoints?: number | null;
    pointsMultiplier?: number;
    incentivePercent?: number;
    badgeColor?: string;
    description?: string;
    sortOrder?: number;
  }): Promise<TechnicianLevel> => {
    const response = await api.post('/technicians/levels', data);
    return response.data.data;
  },

  /**
   * Update level
   */
  updateLevel: async (levelId: string, data: Partial<TechnicianLevel>): Promise<TechnicianLevel> => {
    const response = await api.put(`/technicians/levels/${levelId}`, data);
    return response.data.data;
  },

  /**
   * Delete level
   */
  deleteLevel: async (levelId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/technicians/levels/${levelId}`);
    return response.data.data;
  },

  /**
   * Initialize default levels
   */
  initializeDefaultLevels: async (): Promise<{ message: string; count?: number }> => {
    const response = await api.post('/technicians/levels/initialize');
    return response.data.data;
  },

  // ==================== PROMOTION ENDPOINTS ====================

  /**
   * Get promotion candidates
   */
  getPromotionCandidates: async (): Promise<{ candidates: PromotionCandidate[] }> => {
    const response = await api.get('/technicians/promotions/candidates');
    return response.data.data;
  },

  /**
   * Promote technician
   */
  promoteTechnician: async (
    userId: string,
    data: { toLevelId: string; notes?: string }
  ): Promise<{ promotion: TechnicianPromotion; toLevel: TechnicianLevel; bonusPoints: number }> => {
    const response = await api.post(`/technicians/${userId}/promote`, data);
    return response.data.data;
  },

  /**
   * Get promotion history
   */
  getPromotionHistory: async (userId: string): Promise<{ promotions: TechnicianPromotion[] }> => {
    const response = await api.get(`/technicians/${userId}/promotions`);
    return response.data.data;
  },

  // ==================== NOTIFICATION ENDPOINTS ====================

  /**
   * Get notifications
   */
  getNotifications: async (
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{
    notifications: TechnicianNotification[];
    unreadCount: number;
    pagination: Pagination;
  }> => {
    const response = await api.get(
      `/technicians/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`
    );
    return response.data.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const response = await api.get('/technicians/notifications/unread-count');
    return response.data.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string): Promise<TechnicianNotification> => {
    const response = await api.put(`/technicians/notifications/${notificationId}/read`);
    return response.data.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ markedCount: number }> => {
    const response = await api.put('/technicians/notifications/read-all');
    return response.data.data;
  },

  // ==================== DASHBOARD ENDPOINTS ====================

  /**
   * Get dashboard stats
   */
  getDashboardStats: async (): Promise<TechnicianDashboardStats> => {
    const response = await api.get('/technicians/dashboard/stats');
    return response.data.data;
  },

  /**
   * Get assigned services
   */
  getAssignedServices: async (status?: string): Promise<{ services: AssignedService[] }> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/technicians/dashboard/services${params}`);
    return response.data.data;
  },

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Send announcement to technicians
   */
  sendAnnouncement: async (data: {
    branchId?: string;
    title: string;
    message: string;
  }): Promise<{ sentCount: number }> => {
    const response = await api.post('/technicians/announcement', data);
    return response.data.data;
  },
};
