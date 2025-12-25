import { Router } from 'express';
import { WarrantyController } from '../controllers/warrantyController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Check warranty status for a customer and item (accessible by all authenticated users)
router.get('/check', WarrantyController.checkWarranty);

// Get warranty label/display text
router.get('/label', WarrantyController.getWarrantyLabel);

// Get warranty statistics (admin/manager only)
router.get(
  '/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN, UserRole.MANAGER),
  WarrantyController.getWarrantyStats
);

// Search/list warranties (admin/manager only)
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN, UserRole.MANAGER),
  WarrantyController.searchWarranties
);

// Get all active warranties for a customer
router.get('/customer/:customerId', WarrantyController.getCustomerWarranties);

// Get warranties for a service
router.get('/service/:serviceId', WarrantyController.getServiceWarranties);

// Get warranties for an invoice
router.get('/invoice/:invoiceId', WarrantyController.getInvoiceWarranties);

// Get warranty by ID
router.get('/:id', WarrantyController.getWarrantyById);

// Mark warranty as claimed (admin/manager only)
router.post(
  '/:id/claim',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN, UserRole.MANAGER),
  WarrantyController.markWarrantyClaimed
);

export default router;
