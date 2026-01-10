import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { CompanyController } from '../controllers/companyController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadSingleImage, uploadFileToS3 } from '../middleware/s3Upload';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Middleware to process company logo upload to S3
 */
function processCompanyLogoUpload() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.file) {
        const companyId = (req as any).user?.companyId || 'company';
        const url = await uploadFileToS3(req.file, 'company-logos', companyId);
        req.body.logo = url;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * @route   GET /api/v1/company
 * @desc    Get current company details
 * @access  Private (Super Admin, Admin)
 */
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  CompanyController.getCompany
);

/**
 * @route   PUT /api/v1/company
 * @desc    Update company details (name, email, phone, address, gstin, stateCode)
 * @access  Private (Super Admin only)
 */
router.put(
  '/',
  authorize(UserRole.SUPER_ADMIN),
  CompanyController.updateCompany
);

/**
 * @route   POST /api/v1/company/logo
 * @desc    Upload company logo
 * @access  Private (Super Admin only)
 */
router.post(
  '/logo',
  authorize(UserRole.SUPER_ADMIN),
  uploadSingleImage,
  processCompanyLogoUpload(),
  CompanyController.uploadLogo
);

/**
 * @route   DELETE /api/v1/company/logo
 * @desc    Delete company logo
 * @access  Private (Super Admin only)
 */
router.delete(
  '/logo',
  authorize(UserRole.SUPER_ADMIN),
  CompanyController.deleteLogo
);

export default router;
