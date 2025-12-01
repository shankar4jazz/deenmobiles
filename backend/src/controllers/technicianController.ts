import { Response } from 'express';
import { ServiceStatus } from '@prisma/client';
import { TechnicianService } from '../services/technicianService';
import { PointsService } from '../services/pointsService';
import { LevelService } from '../services/levelService';
import { TechnicianNotificationService } from '../services/technicianNotificationService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class TechnicianController {
  // ==================== PROFILE ENDPOINTS ====================

  /**
   * POST /api/v1/technicians/profile
   * Create technician profile
   */
  static createProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { userId, branchId, maxConcurrentJobs, skillIds } = req.body;

    const profile = await TechnicianService.createProfile({
      userId,
      companyId,
      branchId,
      maxConcurrentJobs,
      skillIds,
    });

    return ApiResponse.created(res, profile, 'Technician profile created successfully');
  });

  /**
   * GET /api/v1/technicians/profile/me
   * Get current user's technician profile
   */
  static getMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    const profile = await TechnicianService.getProfileByUserId(userId, companyId);

    return ApiResponse.success(res, profile, 'Profile retrieved successfully');
  });

  /**
   * GET /api/v1/technicians/profile/:userId
   * Get technician profile by user ID
   */
  static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const companyId = req.user!.companyId;

    const profile = await TechnicianService.getProfileByUserId(userId, companyId);

    return ApiResponse.success(res, profile, 'Profile retrieved successfully');
  });

  /**
   * PUT /api/v1/technicians/profile/:userId
   * Update technician profile
   */
  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const companyId = req.user!.companyId;
    const { isAvailable, maxConcurrentJobs } = req.body;

    const profile = await TechnicianService.updateProfile(userId, companyId, {
      isAvailable,
      maxConcurrentJobs,
    });

    return ApiResponse.success(res, profile, 'Profile updated successfully');
  });

  /**
   * GET /api/v1/technicians
   * Get all technicians with filters
   */
  static getAllTechnicians = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      companyId,
      branchId: req.query.branchId as string,
      isAvailable: req.query.isAvailable === 'true' ? true : req.query.isAvailable === 'false' ? false : undefined,
      levelId: req.query.levelId as string,
      categoryId: req.query.categoryId as string,
      search: req.query.search as string,
    };

    const result = await TechnicianService.getAllTechnicians(filters, page, limit);

    return ApiResponse.success(res, result, 'Technicians retrieved successfully');
  });

  /**
   * GET /api/v1/technicians/available
   * Get technicians available for assignment
   */
  static getTechniciansForAssignment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const branchId = req.query.branchId as string || req.user!.branchId!;

    const filters = {
      companyId,
      branchId,
      categoryId: req.query.categoryId as string,
      available: req.query.available === 'true',
      sortBy: req.query.sortBy as 'workload' | 'rating' | 'points',
    };

    const technicians = await TechnicianService.getTechniciansForAssignment(filters);

    return ApiResponse.success(res, { technicians }, 'Technicians retrieved successfully');
  });

  // ==================== SKILLS ENDPOINTS ====================

  /**
   * POST /api/v1/technicians/:userId/skills
   * Add skill to technician
   */
  static addSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const companyId = req.user!.companyId;
    const { serviceCategoryId, proficiencyLevel } = req.body;

    const skill = await TechnicianService.addSkill(
      userId,
      companyId,
      serviceCategoryId,
      proficiencyLevel
    );

    return ApiResponse.created(res, skill, 'Skill added successfully');
  });

  /**
   * PUT /api/v1/technicians/skills/:skillId
   * Update skill
   */
  static updateSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { skillId } = req.params;
    const companyId = req.user!.companyId;
    const { proficiencyLevel, isVerified } = req.body;

    const skill = await TechnicianService.updateSkill(skillId, companyId, {
      proficiencyLevel,
      isVerified,
      verifiedBy: isVerified ? req.user!.userId : undefined,
    });

    return ApiResponse.success(res, skill, 'Skill updated successfully');
  });

  /**
   * DELETE /api/v1/technicians/skills/:skillId
   * Remove skill from technician
   */
  static removeSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { skillId } = req.params;
    const companyId = req.user!.companyId;

    const result = await TechnicianService.removeSkill(skillId, companyId);

    return ApiResponse.success(res, result, 'Skill removed successfully');
  });

  // ==================== POINTS ENDPOINTS ====================

  /**
   * GET /api/v1/technicians/:userId/points
   * Get points summary
   */
  static getPointsSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const companyId = req.user!.companyId;

    const summary = await PointsService.getPointsSummary(userId, companyId);

    return ApiResponse.success(res, summary, 'Points summary retrieved successfully');
  });

  /**
   * GET /api/v1/technicians/:userId/points/history
   * Get points history
   */
  static getPointsHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await PointsService.getPointsHistory(userId, companyId, page, limit);

    return ApiResponse.success(res, result, 'Points history retrieved successfully');
  });

  /**
   * POST /api/v1/technicians/:userId/points/adjust
   * Manual points adjustment
   */
  static adjustPoints = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const companyId = req.user!.companyId;
    const { points, reason } = req.body;
    const adjustedBy = req.user!.userId;

    const result = await PointsService.adjustPoints(userId, companyId, points, reason, adjustedBy);

    return ApiResponse.success(res, result, 'Points adjusted successfully');
  });

  // ==================== LEVEL ENDPOINTS ====================

  /**
   * GET /api/v1/technicians/levels
   * Get all levels
   */
  static getLevels = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;

    const levels = await LevelService.getLevels(companyId);

    return ApiResponse.success(res, { levels }, 'Levels retrieved successfully');
  });

  /**
   * POST /api/v1/technicians/levels
   * Create level
   */
  static createLevel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const levelData = req.body;

    const level = await LevelService.createLevel({
      ...levelData,
      companyId,
    });

    return ApiResponse.created(res, level, 'Level created successfully');
  });

  /**
   * PUT /api/v1/technicians/levels/:levelId
   * Update level
   */
  static updateLevel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { levelId } = req.params;
    const companyId = req.user!.companyId;
    const levelData = req.body;

    const level = await LevelService.updateLevel(levelId, companyId, levelData);

    return ApiResponse.success(res, level, 'Level updated successfully');
  });

  /**
   * DELETE /api/v1/technicians/levels/:levelId
   * Delete level
   */
  static deleteLevel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { levelId } = req.params;
    const companyId = req.user!.companyId;

    const result = await LevelService.deleteLevel(levelId, companyId);

    return ApiResponse.success(res, result, 'Level deleted successfully');
  });

  /**
   * GET /api/v1/technicians/promotions/candidates
   * Get technicians eligible for promotion
   */
  static getPromotionCandidates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;

    const candidates = await LevelService.getPromotionCandidates(companyId);

    return ApiResponse.success(res, { candidates }, 'Promotion candidates retrieved successfully');
  });

  /**
   * POST /api/v1/technicians/:userId/promote
   * Promote technician
   */
  static promoteTechnician = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const companyId = req.user!.companyId;
    const { toLevelId, notes } = req.body;
    const promotedBy = req.user!.userId;

    const result = await LevelService.promoteTechnician(userId, companyId, toLevelId, promotedBy, notes);

    return ApiResponse.success(res, result, 'Technician promoted successfully');
  });

  /**
   * GET /api/v1/technicians/:userId/promotions
   * Get promotion history
   */
  static getPromotionHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const companyId = req.user!.companyId;

    const promotions = await LevelService.getPromotionHistory(userId, companyId);

    return ApiResponse.success(res, { promotions }, 'Promotion history retrieved successfully');
  });

  // ==================== NOTIFICATION ENDPOINTS ====================

  /**
   * GET /api/v1/technicians/notifications
   * Get notifications for current user
   */
  static getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await TechnicianNotificationService.getNotifications(userId, page, limit, unreadOnly);

    return ApiResponse.success(res, result, 'Notifications retrieved successfully');
  });

  /**
   * GET /api/v1/technicians/notifications/unread-count
   * Get unread notification count
   */
  static getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    const result = await TechnicianNotificationService.getUnreadCount(userId);

    return ApiResponse.success(res, result, 'Unread count retrieved successfully');
  });

  /**
   * PUT /api/v1/technicians/notifications/:notificationId/read
   * Mark notification as read
   */
  static markNotificationAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { notificationId } = req.params;
    const userId = req.user!.userId;

    const notification = await TechnicianNotificationService.markAsRead(notificationId, userId);

    return ApiResponse.success(res, notification, 'Notification marked as read');
  });

  /**
   * PUT /api/v1/technicians/notifications/read-all
   * Mark all notifications as read
   */
  static markAllNotificationsAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    const result = await TechnicianNotificationService.markAllAsRead(userId);

    return ApiResponse.success(res, result, 'All notifications marked as read');
  });

  // ==================== DASHBOARD ENDPOINTS ====================

  /**
   * GET /api/v1/technicians/dashboard/stats
   * Get dashboard stats for technician
   */
  static getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    const stats = await TechnicianService.getTechnicianStats(userId, companyId);

    return ApiResponse.success(res, stats, 'Dashboard stats retrieved successfully');
  });

  /**
   * GET /api/v1/technicians/dashboard/services
   * Get assigned services for technician
   */
  static getAssignedServices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;
    const status = req.query.status as ServiceStatus | undefined;

    const services = await TechnicianService.getAssignedServices(userId, companyId, status);

    return ApiResponse.success(res, { services }, 'Assigned services retrieved successfully');
  });

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * POST /api/v1/technicians/levels/initialize
   * Initialize default levels for company
   */
  static initializeDefaultLevels = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;

    const result = await LevelService.initializeDefaultLevels(companyId);

    return ApiResponse.success(res, result, 'Default levels initialized');
  });

  /**
   * POST /api/v1/technicians/announcement
   * Send announcement to technicians
   */
  static sendAnnouncement = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { branchId, title, message } = req.body;

    const result = await TechnicianNotificationService.sendAnnouncement(companyId, branchId, title, message);

    return ApiResponse.success(res, result, 'Announcement sent successfully');
  });
}
