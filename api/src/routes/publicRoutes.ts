import { Router } from 'express';
import { PublicController } from '../controllers/publicController';
import { query } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

// Validation for tracking queries
const trackingValidation = [
  query('ticket')
    .optional()
    .isString()
    .trim()
    .matches(/^SRV-[A-Z0-9]{2,10}-\d{8}-\d{3}(-\d{2})?$/i)
    .withMessage('Invalid ticket number format. Expected format: SRV-XXX-YYYYMMDD-001'),
  query('phone')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Invalid phone number. Must be 10-15 digits'),
];

/**
 * @route   GET /api/v1/public/track
 * @desc    Track service by ticket number or phone
 * @access  Public (no authentication required)
 * @query   ticket - Ticket number (e.g., SRV-BLR-20251202-001)
 * @query   phone - Customer phone number (10 digits)
 * @example GET /api/v1/public/track?ticket=SRV-BLR-20251202-001
 * @example GET /api/v1/public/track?phone=9876543210
 */
router.get('/track', validate(trackingValidation), PublicController.trackService);

/**
 * @route   GET /api/v1/public/company-info
 * @desc    Get basic company info for branding
 * @access  Public (no authentication required)
 */
router.get('/company-info', PublicController.getCompanyInfo);

export default router;
