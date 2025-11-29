import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { S3Service } from '../services/s3Service';

// Use memory storage - files are kept in buffer for S3 upload
const memoryStorage = multer.memoryStorage();

// File filter for images only
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, WebP) are allowed'));
  }
};

// File filter for documents (images + PDF)
const documentFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|webp|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === 'application/pdf' || /image\/(jpeg|jpg|png|webp)/.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, WebP) and PDF are allowed'));
  }
};

// Multer instance for images
const imageUpload = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});

// Multer instance for documents (includes PDF)
const documentUpload = multer({
  storage: memoryStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for documents
  },
});

// Export multer middlewares
export const uploadProfileImage = imageUpload.single('profileImage');
export const uploadServiceImages = imageUpload.array('serviceImages', 20);
export const uploadDeviceImages = imageUpload.array('deviceImages', 20);
export const uploadExpenseAttachment = documentUpload.single('attachment');
export const uploadIdProof = documentUpload.single('idProofDocument');
export const uploadSingleImage = imageUpload.single('image');

/**
 * Helper function to upload a single file to S3
 */
export async function uploadFileToS3(
  file: Express.Multer.File,
  folder: string,
  entityId: string
): Promise<string> {
  const key = S3Service.generateKey(folder, entityId, file.originalname);
  return S3Service.uploadFile({
    buffer: file.buffer,
    key,
    contentType: file.mimetype,
  });
}

/**
 * Helper function to upload multiple files to S3
 */
export async function uploadFilesToS3(
  files: Express.Multer.File[],
  folder: string,
  entityId: string
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadFileToS3(file, folder, entityId));
  return Promise.all(uploadPromises);
}

/**
 * Middleware to upload profile image to S3 after multer processing
 * Adds `profileImageUrl` to req.body
 */
export function processProfileImageUpload(folder: string = 'profiles') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.file) {
        // Use user ID or generate temp ID for new users
        const entityId = (req as any).params?.id || (req as any).body?.id || 'temp';
        const url = await uploadFileToS3(req.file, folder, entityId);
        req.body.profileImage = url;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to upload expense attachment to S3 after multer processing
 * Adds `attachmentUrl` to req.body
 */
export function processExpenseAttachmentUpload() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.file) {
        const branchId = req.body.branchId || 'general';
        const date = new Date();
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const folder = `expenses/${branchId}/${yearMonth}`;

        const key = S3Service.generateKey('expenses', `${branchId}/${yearMonth}`, req.file.originalname);
        const url = await S3Service.uploadFile({
          buffer: req.file.buffer,
          key,
          contentType: req.file.mimetype,
        });

        req.body.attachmentUrl = url;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to upload customer ID proof document to S3 after multer processing
 * Adds `idProofDocumentUrl` to req.body
 */
export function processIdProofUpload() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.file) {
        const customerId = (req as any).params?.id || 'new';
        const url = await uploadFileToS3(req.file, 'customers', customerId);
        req.body.idProofDocumentUrl = url;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default imageUpload;
