import { Router } from 'express';
import { BranchInventoryController } from '../controllers/branchInventoryController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Authorized roles for branch inventory management
const authorizedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN, UserRole.MANAGER];

// Get all branch inventories with filters
router.get('/', authorize(...authorizedRoles), BranchInventoryController.getAllBranchInventories);

// Get low stock items for a branch
router.get('/low-stock', authorize(...authorizedRoles, UserRole.MANAGER), BranchInventoryController.getLowStockItems);

// Get out of stock items for a branch
router.get('/out-of-stock', authorize(...authorizedRoles, UserRole.MANAGER), BranchInventoryController.getOutOfStockItems);

// Get branch inventory dropdown (for form selects)
router.get('/dropdown', authorize(...authorizedRoles, UserRole.MANAGER), BranchInventoryController.getBranchInventoryDropdown);

// Get stock movements history for a branch
router.get('/movements/history', authorize(...authorizedRoles, UserRole.MANAGER), BranchInventoryController.getStockMovementsHistory);

// Get branch inventory by ID
router.get('/:id', authorize(...authorizedRoles), BranchInventoryController.getBranchInventoryById);

// Add item to branch inventory
router.post('/', authorize(...authorizedRoles), BranchInventoryController.addItemToBranch);

// Update branch inventory settings
router.put('/:id', authorize(...authorizedRoles), BranchInventoryController.updateBranchInventory);

// Adjust stock quantity
router.post('/:id/adjust', authorize(...authorizedRoles, UserRole.MANAGER), BranchInventoryController.adjustStock);

// Remove item from branch (soft delete)
router.delete('/:id', authorize(...authorizedRoles), BranchInventoryController.removeItemFromBranch);

export default router;
