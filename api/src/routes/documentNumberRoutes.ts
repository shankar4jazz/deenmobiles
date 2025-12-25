import { Router } from 'express';
import { DocumentNumberController } from '../controllers/documentNumberController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all formats - Admin/Manager only
router.get('/', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER), DocumentNumberController.getAllFormats);

// Preview a format - Anyone authenticated
router.post('/preview', DocumentNumberController.previewFormat);

// Get a specific format
router.get('/:documentType', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER), DocumentNumberController.getFormat);

// Get sequence info
router.get('/:documentType/sequence', DocumentNumberController.getSequenceInfo);

// Create or update a format - Admin only
router.put('/:documentType', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), DocumentNumberController.upsertFormat);

export default router;
