import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure service uploads directory exists
const servicesDir = path.join(__dirname, '../../public/uploads/services');
if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir, { recursive: true });
}

// Configure storage for service images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, servicesDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomString.ext
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const filename = `service-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, WebP) are allowed'));
  }
};

// Configure multer for service images
const serviceUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10, // Maximum 10 files per request
  },
});

// Export middleware for multiple service image uploads
export const uploadServiceImages = serviceUpload.array('serviceImages', 10);

// Export middleware for single service image upload
export const uploadServiceImage = serviceUpload.single('serviceImage');

// Export multer instance for custom configurations
export default serviceUpload;
