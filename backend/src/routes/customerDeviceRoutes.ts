import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { CustomerDeviceController } from '../controllers/customerDeviceController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { param, query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID validation
const idValidation = [param('id').isUUID().withMessage('Invalid ID format')];

// Customer ID validation in query
const customerIdQueryValidation = [
  query('customerId').isUUID().withMessage('Invalid customer ID format'),
];

// Authorize for Admin, Branch Admin, Manager, and Technician roles
const authorizedRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.BRANCH_ADMIN,
  UserRole.MANAGER,
  UserRole.TECHNICIAN,
];

// ==================== CUSTOMER DEVICE ROUTES ====================

/**
 * @route   GET /api/v1/customer-devices
 * @desc    Get all devices for a customer
 * @access  Private (Admin, Branch Admin, Manager, Technician)
 */
router.get(
  '/',
  authorize(...authorizedRoles),
  validate(customerIdQueryValidation),
  CustomerDeviceController.getAllDevices
);

/**
 * @route   GET /api/v1/customer-devices/summary/:customerId
 * @desc    Get devices summary for a customer
 * @access  Private (Admin, Branch Admin, Manager, Technician)
 */
router.get(
  '/summary/:customerId',
  authorize(...authorizedRoles),
  validate([param('customerId').isUUID().withMessage('Invalid customer ID format')]),
  CustomerDeviceController.getDevicesSummary
);

/**
 * @route   GET /api/v1/customer-devices/:id
 * @desc    Get a single customer device by ID
 * @access  Private (Admin, Branch Admin, Manager, Technician)
 */
router.get(
  '/:id',
  authorize(...authorizedRoles),
  validate([...idValidation, ...customerIdQueryValidation]),
  CustomerDeviceController.getDeviceById
);

/**
 * @route   GET /api/v1/customer-devices/:id/service-history
 * @desc    Get service history for a device
 * @access  Private (Admin, Branch Admin, Manager, Technician)
 */
router.get(
  '/:id/service-history',
  authorize(...authorizedRoles),
  validate([...idValidation, ...customerIdQueryValidation]),
  CustomerDeviceController.getServiceHistory
);

/**
 * @route   POST /api/v1/customer-devices
 * @desc    Create a new customer device
 * @access  Private (Admin, Branch Admin, Manager, Technician)
 */
router.post(
  '/',
  authorize(...authorizedRoles),
  CustomerDeviceController.createDevice
);

/**
 * @route   PUT /api/v1/customer-devices/:id
 * @desc    Update a customer device
 * @access  Private (Admin, Branch Admin, Manager, Technician)
 */
router.put(
  '/:id',
  authorize(...authorizedRoles),
  validate(idValidation),
  CustomerDeviceController.updateDevice
);

/**
 * @route   DELETE /api/v1/customer-devices/:id
 * @desc    Deactivate (soft delete) a customer device
 * @access  Private (Admin, Branch Admin, Manager)
 */
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN, UserRole.MANAGER),
  validate([...idValidation, ...customerIdQueryValidation]),
  CustomerDeviceController.deactivateDevice
);

export default router;
