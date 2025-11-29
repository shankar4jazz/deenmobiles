import express from 'express';
import { jobSheetTemplateController } from '../controllers/jobSheetTemplateController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get default template (must be before /:id route)
router.get('/default', jobSheetTemplateController.getDefault);

// Get all job sheet templates
router.get('/', jobSheetTemplateController.getAll);

// Get template by ID
router.get('/:id', jobSheetTemplateController.getById);

// Create new template
router.post('/', jobSheetTemplateController.create);

// Update template
router.put('/:id', jobSheetTemplateController.update);

// Delete template
router.delete('/:id', jobSheetTemplateController.delete);

// Toggle template active status
router.patch('/:id/toggle-status', jobSheetTemplateController.toggleStatus);

// Set template as default
router.patch('/:id/set-default', jobSheetTemplateController.setAsDefault);

export default router;
