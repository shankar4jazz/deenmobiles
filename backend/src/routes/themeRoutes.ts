import express from 'express';
import { themeController } from '../controllers/themeController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get default theme
router.get('/default', themeController.getDefault);

// Get all themes
router.get('/', themeController.getAll);

// Get theme by ID
router.get('/:id', themeController.getById);

// Create new theme
router.post('/', themeController.create);

// Update theme
router.put('/:id', themeController.update);

// Delete theme
router.delete('/:id', themeController.delete);

// Toggle theme active status
router.patch('/:id/toggle-status', themeController.toggleStatus);

// Set theme as default
router.patch('/:id/set-default', themeController.setAsDefault);

export default router;
