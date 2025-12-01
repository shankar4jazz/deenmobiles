import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { TechnicianController } from '../controllers/technicianController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== LEVEL ENDPOINTS (before param routes) ====================

/**
 * @route   GET /api/v1/technicians/levels
 * @desc    Get all levels
 * @access  Private (All authenticated users)
 */
router.get('/levels', TechnicianController.getLevels);

/**
 * @route   POST /api/v1/technicians/levels
 * @desc    Create level
 * @access  Private (Admin, Super Admin)
 */
router.post(
  '/levels',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  TechnicianController.createLevel
);

/**
 * @route   POST /api/v1/technicians/levels/initialize
 * @desc    Initialize default levels for company
 * @access  Private (Admin, Super Admin)
 */
router.post(
  '/levels/initialize',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  TechnicianController.initializeDefaultLevels
);

/**
 * @route   PUT /api/v1/technicians/levels/:levelId
 * @desc    Update level
 * @access  Private (Admin, Super Admin)
 */
router.put(
  '/levels/:levelId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  TechnicianController.updateLevel
);

/**
 * @route   DELETE /api/v1/technicians/levels/:levelId
 * @desc    Delete level
 * @access  Private (Admin, Super Admin)
 */
router.delete(
  '/levels/:levelId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  TechnicianController.deleteLevel
);

// ==================== NOTIFICATION ENDPOINTS ====================

/**
 * @route   GET /api/v1/technicians/notifications
 * @desc    Get notifications for current user
 * @access  Private (Technician)
 */
router.get(
  '/notifications',
  authorize(UserRole.TECHNICIAN, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TechnicianController.getNotifications
);

/**
 * @route   GET /api/v1/technicians/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private (Technician)
 */
router.get(
  '/notifications/unread-count',
  authorize(UserRole.TECHNICIAN, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TechnicianController.getUnreadCount
);

/**
 * @route   PUT /api/v1/technicians/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private (Technician)
 */
router.put(
  '/notifications/read-all',
  authorize(UserRole.TECHNICIAN, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TechnicianController.markAllNotificationsAsRead
);

/**
 * @route   PUT /api/v1/technicians/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private (Technician)
 */
router.put(
  '/notifications/:notificationId/read',
  authorize(UserRole.TECHNICIAN, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TechnicianController.markNotificationAsRead
);

// ==================== PROMOTION ENDPOINTS ====================

/**
 * @route   GET /api/v1/technicians/promotions/candidates
 * @desc    Get technicians eligible for promotion
 * @access  Private (Admin, Super Admin, Manager)
 */
router.get(
  '/promotions/candidates',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TechnicianController.getPromotionCandidates
);

// ==================== DASHBOARD ENDPOINTS ====================

/**
 * @route   GET /api/v1/technicians/dashboard/stats
 * @desc    Get dashboard stats for current technician
 * @access  Private (Technician)
 */
router.get(
  '/dashboard/stats',
  authorize(UserRole.TECHNICIAN, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TechnicianController.getDashboardStats
);

/**
 * @route   GET /api/v1/technicians/dashboard/services
 * @desc    Get assigned services for current technician
 * @access  Private (Technician)
 */
router.get(
  '/dashboard/services',
  authorize(UserRole.TECHNICIAN, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TechnicianController.getAssignedServices
);

// ==================== PROFILE ENDPOINTS ====================

/**
 * @route   GET /api/v1/technicians/profile/me
 * @desc    Get current user's technician profile
 * @access  Private (Technician)
 */
router.get(
  '/profile/me',
  authorize(UserRole.TECHNICIAN, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TechnicianController.getMyProfile
);

/**
 * @route   POST /api/v1/technicians/profile
 * @desc    Create technician profile
 * @access  Private (Admin, Super Admin)
 */
router.post(
  '/profile',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  TechnicianController.createProfile
);

/**
 * @route   GET /api/v1/technicians/available
 * @desc    Get technicians available for assignment
 * @access  Private (Admin, Super Admin, Manager, Receptionist)
 */
router.get(
  '/available',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST),
  TechnicianController.getTechniciansForAssignment
);

// ==================== ADMIN ENDPOINTS ====================

/**
 * @route   POST /api/v1/technicians/announcement
 * @desc    Send announcement to technicians
 * @access  Private (Admin, Super Admin, Manager)
 */
router.post(
  '/announcement',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TechnicianController.sendAnnouncement
);

// ==================== LIST ENDPOINT ====================

/**
 * @route   GET /api/v1/technicians
 * @desc    Get all technicians with filters
 * @access  Private (Admin, Super Admin, Manager)
 */
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST),
  TechnicianController.getAllTechnicians
);

// ==================== TECHNICIAN-SPECIFIC ENDPOINTS (with :userId param) ====================

/**
 * @route   GET /api/v1/technicians/:userId/profile
 * @desc    Get technician profile by user ID
 * @access  Private (Admin, Super Admin, Manager)
 */
router.get(
  '/:userId/profile',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TechnicianController.getProfile
);

/**
 * @route   PUT /api/v1/technicians/:userId/profile
 * @desc    Update technician profile
 * @access  Private (Admin, Super Admin, Manager)
 */
router.put(
  '/:userId/profile',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TechnicianController.updateProfile
);

/**
 * @route   POST /api/v1/technicians/:userId/skills
 * @desc    Add skill to technician
 * @access  Private (Admin, Super Admin, Manager)
 */
router.post(
  '/:userId/skills',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TechnicianController.addSkill
);

/**
 * @route   GET /api/v1/technicians/:userId/points
 * @desc    Get points summary
 * @access  Private (Admin, Super Admin, Manager, Technician)
 */
router.get(
  '/:userId/points',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN),
  TechnicianController.getPointsSummary
);

/**
 * @route   GET /api/v1/technicians/:userId/points/history
 * @desc    Get points history
 * @access  Private (Admin, Super Admin, Manager, Technician)
 */
router.get(
  '/:userId/points/history',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN),
  TechnicianController.getPointsHistory
);

/**
 * @route   POST /api/v1/technicians/:userId/points/adjust
 * @desc    Manual points adjustment
 * @access  Private (Admin, Super Admin)
 */
router.post(
  '/:userId/points/adjust',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  TechnicianController.adjustPoints
);

/**
 * @route   POST /api/v1/technicians/:userId/promote
 * @desc    Promote technician
 * @access  Private (Admin, Super Admin)
 */
router.post(
  '/:userId/promote',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  TechnicianController.promoteTechnician
);

/**
 * @route   GET /api/v1/technicians/:userId/promotions
 * @desc    Get promotion history
 * @access  Private (Admin, Super Admin, Manager, Technician)
 */
router.get(
  '/:userId/promotions',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN),
  TechnicianController.getPromotionHistory
);

// ==================== SKILL ENDPOINTS (with :skillId param) ====================

/**
 * @route   PUT /api/v1/technicians/skills/:skillId
 * @desc    Update skill
 * @access  Private (Admin, Super Admin, Manager)
 */
router.put(
  '/skills/:skillId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  TechnicianController.updateSkill
);

/**
 * @route   DELETE /api/v1/technicians/skills/:skillId
 * @desc    Remove skill from technician
 * @access  Private (Admin, Super Admin)
 */
router.delete(
  '/skills/:skillId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  TechnicianController.removeSkill
);

export default router;
