import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticate } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/customers
 * @desc    Create a new customer
 * @access  Private
 */
router.post(
  '/',
  upload.single('idProofDocument'),
  CustomerController.createCustomer
);

/**
 * @route   GET /api/customers
 * @desc    Get all customers with filters
 * @access  Private
 */
router.get('/', CustomerController.getAllCustomers);

/**
 * @route   GET /api/customers/stats
 * @desc    Get customer statistics
 * @access  Private
 */
router.get('/stats', CustomerController.getCustomerStats);

/**
 * @route   GET /api/customers/check-phone
 * @desc    Check phone number availability
 * @access  Private
 */
router.get('/check-phone', CustomerController.checkPhoneAvailability);

/**
 * @route   GET /api/customers/:id
 * @desc    Get customer by ID
 * @access  Private
 */
router.get('/:id', CustomerController.getCustomerById);

/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer
 * @access  Private
 */
router.put(
  '/:id',
  upload.single('idProofDocument'),
  CustomerController.updateCustomer
);

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete customer
 * @access  Private
 */
router.delete('/:id', CustomerController.deleteCustomer);

export default router;
