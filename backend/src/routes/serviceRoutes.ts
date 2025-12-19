import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ServiceController } from '../controllers/serviceController';
import JobSheetController from '../controllers/jobSheetController';
import InvoiceController from '../controllers/invoiceController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  createServiceValidation,
  updateServiceValidation,
  updateStatusValidation,
  assignTechnicianValidation,
  updateDiagnosisValidation,
  addServicePartValidation,
} from '../validators/serviceValidators';
import { uploadServiceImages, uploadDeviceImages } from '../middleware/s3Upload';
import { param } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ID validation
const serviceIdValidation = [
  param('id').isUUID().withMessage('Invalid service ID format'),
];

const imageIdValidation = [
  param('imageId').isUUID().withMessage('Invalid image ID format'),
];

const partIdValidation = [
  param('partId').isUUID().withMessage('Invalid part ID format'),
];

/**
 * @route   POST /api/v1/services
 * @desc    Create a new service
 * @access  Private (Receptionist, Manager, Admin)
 */
router.post(
  '/',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(createServiceValidation),
  ServiceController.createService
);

/**
 * @route   GET /api/v1/services
 * @desc    Get all services with filters
 * @access  Private (All authenticated users with role-based filtering)
 */
router.get(
  '/',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN
  ),
  ServiceController.getAllServices
);

/**
 * @route   GET /api/v1/services/:id
 * @desc    Get service by ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN
  ),
  validate(serviceIdValidation),
  ServiceController.getServiceById
);

/**
 * @route   PUT /api/v1/services/:id
 * @desc    Update service
 * @access  Private (Receptionist, Manager, Admin)
 */
router.put(
  '/:id',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...serviceIdValidation, ...updateServiceValidation]),
  ServiceController.updateService
);

/**
 * @route   DELETE /api/v1/services/:id
 * @desc    Delete service
 * @access  Private (Manager, Admin)
 */
router.delete(
  '/:id',
  authorize(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(serviceIdValidation),
  ServiceController.deleteService
);

/**
 * @route   POST /api/v1/services/:id/images
 * @desc    Upload service images
 * @access  Private (Receptionist, Technician, Manager, Admin)
 */
router.post(
  '/:id/images',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(serviceIdValidation),
  uploadServiceImages,
  ServiceController.uploadImages
);

/**
 * @route   DELETE /api/v1/services/:id/images/:imageId
 * @desc    Delete service image
 * @access  Private (Receptionist, Technician, Manager, Admin)
 */
router.delete(
  '/:id/images/:imageId',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...serviceIdValidation, ...imageIdValidation]),
  ServiceController.deleteImage
);

/**
 * @route   POST /api/v1/services/:id/device-images
 * @desc    Upload device images
 * @access  Private (Receptionist, Technician, Manager, Admin)
 */
router.post(
  '/:id/device-images',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(serviceIdValidation),
  uploadDeviceImages,
  ServiceController.uploadDeviceImages
);

/**
 * @route   DELETE /api/v1/services/:id/device-images/:imageId
 * @desc    Delete device image
 * @access  Private (Receptionist, Technician, Manager, Admin)
 */
router.delete(
  '/:id/device-images/:imageId',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...serviceIdValidation, ...imageIdValidation]),
  ServiceController.deleteDeviceImage
);

/**
 * @route   GET /api/v1/services/:id/available-parts
 * @desc    Get available parts from branch inventory for adding to service
 * @access  Private (Technician, Manager, Admin)
 */
router.get(
  '/:id/available-parts',
  authorize(
    UserRole.TECHNICIAN,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(serviceIdValidation),
  ServiceController.getAvailableParts
);

/**
 * @route   POST /api/v1/services/:id/parts
 * @desc    Add service part
 * @access  Private (Technician, Manager, Admin)
 */
router.post(
  '/:id/parts',
  authorize(
    UserRole.TECHNICIAN,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...serviceIdValidation, ...addServicePartValidation]),
  ServiceController.addServicePart
);

/**
 * @route   DELETE /api/v1/services/:id/parts/:partId
 * @desc    Remove service part
 * @access  Private (Technician, Manager, Admin)
 */
router.delete(
  '/:id/parts/:partId',
  authorize(
    UserRole.TECHNICIAN,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...serviceIdValidation, ...partIdValidation]),
  ServiceController.removeServicePart
);

/**
 * @route   PUT /api/v1/services/:id/parts/:partId
 * @desc    Update service part (quantity and/or unit price)
 * @access  Private (Technician, Manager, Admin)
 */
router.put(
  '/:id/parts/:partId',
  authorize(
    UserRole.TECHNICIAN,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...serviceIdValidation, ...partIdValidation]),
  ServiceController.updateServicePart
);

/**
 * @route   PUT /api/v1/services/:id/status
 * @desc    Update service status
 * @access  Private (Technician, Manager, Admin)
 */
router.put(
  '/:id/status',
  authorize(
    UserRole.TECHNICIAN,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...serviceIdValidation, ...updateStatusValidation]),
  ServiceController.updateStatus
);

/**
 * @route   PUT /api/v1/services/:id/assign
 * @desc    Assign service to technician
 * @access  Private (Manager, Admin)
 */
router.put(
  '/:id/assign',
  authorize(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...serviceIdValidation, ...assignTechnicianValidation]),
  ServiceController.assignTechnician
);

/**
 * @route   PUT /api/v1/services/:id/diagnosis
 * @desc    Update service diagnosis
 * @access  Private (Technician, Manager, Admin)
 */
router.put(
  '/:id/diagnosis',
  authorize(
    UserRole.TECHNICIAN,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate([...serviceIdValidation, ...updateDiagnosisValidation]),
  ServiceController.updateDiagnosis
);

/**
 * @route   PUT /api/v1/services/:id/labour-charge
 * @desc    Update service labour charge
 * @access  Private (Technician, Manager, Admin)
 */
router.put(
  '/:id/labour-charge',
  authorize(
    UserRole.TECHNICIAN,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(serviceIdValidation),
  ServiceController.updateLabourCharge
);

/**
 * @route   GET /api/v1/services/:id/history
 * @desc    Get service status history
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id/history',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN
  ),
  validate(serviceIdValidation),
  ServiceController.getStatusHistory
);

/**
 * @route   GET /api/v1/services/:id/jobsheet
 * @desc    Get job sheet by service ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id/jobsheet',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN
  ),
  validate(serviceIdValidation),
  JobSheetController.getJobSheetByServiceId
);

/**
 * @route   POST /api/v1/services/:id/jobsheet
 * @desc    Generate job sheet from service
 * @access  Private (Receptionist, Manager, Admin)
 */
router.post(
  '/:id/jobsheet',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(serviceIdValidation),
  JobSheetController.generateJobSheet
);

/**
 * @route   GET /api/v1/services/:id/invoice
 * @desc    Get invoice by service ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id/invoice',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN
  ),
  validate(serviceIdValidation),
  InvoiceController.getInvoiceByServiceId
);

/**
 * @route   POST /api/v1/services/:id/invoice
 * @desc    Generate invoice from service
 * @access  Private (Receptionist, Manager, Admin)
 */
router.post(
  '/:id/invoice',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(serviceIdValidation),
  InvoiceController.generateInvoiceFromService
);

/**
 * @route   POST /api/v1/services/:id/payment-entries
 * @desc    Add a payment entry to an existing service
 * @access  Private (Receptionist, Manager, Admin)
 */
router.post(
  '/:id/payment-entries',
  authorize(
    UserRole.RECEPTIONIST,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(serviceIdValidation),
  ServiceController.addPaymentEntry
);

/**
 * @route   GET /api/v1/services/:id/notes
 * @desc    Get all notes for a service
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id/notes',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN
  ),
  validate(serviceIdValidation),
  ServiceController.getNotes
);

/**
 * @route   POST /api/v1/services/:id/notes
 * @desc    Add a note to a service
 * @access  Private (Technician, Manager, Admin)
 */
router.post(
  '/:id/notes',
  authorize(
    UserRole.TECHNICIAN,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validate(serviceIdValidation),
  ServiceController.addNote
);

/**
 * @route   DELETE /api/v1/services/:id/notes/:noteId
 * @desc    Delete a note from a service
 * @access  Private (Note creator, Manager, Admin)
 */
router.delete(
  '/:id/notes/:noteId',
  authorize(
    UserRole.TECHNICIAN,
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  ServiceController.deleteNote
);

export default router;

// Route update
