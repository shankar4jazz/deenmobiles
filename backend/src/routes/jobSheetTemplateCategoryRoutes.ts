import express from 'express';
import { jobSheetTemplateCategoryController } from '../controllers/jobSheetTemplateCategoryController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all job sheet template categories
router.get('/', jobSheetTemplateCategoryController.getAll);

// Get category by ID
router.get('/:id', jobSheetTemplateCategoryController.getById);

// Create new category
router.post('/', jobSheetTemplateCategoryController.create);

// Update category
router.put('/:id', jobSheetTemplateCategoryController.update);

// Delete category
router.delete('/:id', jobSheetTemplateCategoryController.delete);

// Toggle category active status
router.patch('/:id/toggle-status', jobSheetTemplateCategoryController.toggleStatus);

export default router;
