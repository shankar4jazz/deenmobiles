import { Router } from 'express';
import { ItemController } from '../controllers/itemController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Authorized roles for item management (company-level items)
const authorizedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN, UserRole.MANAGER];

// Get all items with filters
router.get('/', authorize(...authorizedRoles), ItemController.getAllItems);

// Get items dropdown (for form selects)
router.get('/dropdown', authorize(...authorizedRoles), ItemController.getItemsDropdown);

// Check if item name exists (for form validation)
router.get('/check-name', authorize(...authorizedRoles), ItemController.checkItemNameExists);

// Get item by ID
router.get('/:id', authorize(...authorizedRoles), ItemController.getItemById);

// Create new item
router.post('/', authorize(...authorizedRoles), ItemController.createItem);

// Update item
router.put('/:id', authorize(...authorizedRoles), ItemController.updateItem);

// Deactivate item (soft delete)
router.delete('/:id', authorize(...authorizedRoles), ItemController.deactivateItem);

export default router;
