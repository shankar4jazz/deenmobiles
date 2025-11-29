import fs from 'fs';
import path from 'path';

/**
 * Upload a file and return its URL path
 * Note: The actual file upload is handled by multer middleware
 * This function generates the public URL path for the uploaded file
 *
 * @param file - Multer file object or file path
 * @param category - Category folder (e.g., 'id-proofs', 'profiles')
 * @returns Public URL path to the file
 */
export async function uploadFile(
  file: Express.Multer.File | string,
  category: string = 'uploads'
): Promise<string> {
  // If file is a string (filename), just construct the path
  if (typeof file === 'string') {
    return `/uploads/${category}/${file}`;
  }

  // If it's a multer file object, return the path
  if (file && file.filename) {
    return `/uploads/${category}/${file.filename}`;
  }

  throw new Error('Invalid file provided for upload');
}

/**
 * Delete a file from the filesystem
 *
 * @param filePath - Relative or absolute path to the file
 * @returns true if deleted successfully, false otherwise
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    if (!filePath) return false;

    // Handle both relative URLs and absolute paths
    let absolutePath: string;

    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      // Extract path from URL
      const url = new URL(filePath);
      absolutePath = path.join(__dirname, '../../public', url.pathname);
    } else if (filePath.startsWith('/uploads/')) {
      // Relative URL path
      absolutePath = path.join(__dirname, '../../public', filePath);
    } else {
      // Assume it's already an absolute path
      absolutePath = filePath;
    }

    // Check if file exists before attempting to delete
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}
