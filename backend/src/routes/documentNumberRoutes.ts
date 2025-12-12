import { Router } from 'express';
import { DocumentNumberController } from '../controllers/documentNumberController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all formats - Admin/Manager only
router.get('/', authorize(['ADMIN', 'SUPER_ADMIN', 'MANAGER']), DocumentNumberController.getAllFormats);

// Preview a format - Anyone authenticated
router.post('/preview', DocumentNumberController.previewFormat);

// Get a specific format
router.get('/:documentType', authorize(['ADMIN', 'SUPER_ADMIN', 'MANAGER']), DocumentNumberController.getFormat);

// Get sequence info
router.get('/:documentType/sequence', DocumentNumberController.getSequenceInfo);

// Create or update a format - Admin only
router.put('/:documentType', authorize(['ADMIN', 'SUPER_ADMIN']), DocumentNumberController.upsertFormat);

export default router;
