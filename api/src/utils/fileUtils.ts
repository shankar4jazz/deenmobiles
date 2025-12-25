import fs from 'fs';
import path from 'path';

/**
 * File utility service for handling file operations
 */
export class FileUtils {
  /**
   * Delete a file from the filesystem
   * @param filePath - Relative or absolute path to the file
   * @returns true if deleted successfully, false otherwise
   */
  static deleteFile(filePath: string): boolean {
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

  /**
   * Generate a public URL for an uploaded file
   * @param filename - Name of the file
   * @param category - Category/folder (e.g., 'profiles')
   * @returns Public URL path
   */
  static generateFileUrl(filename: string, category: string = 'profiles'): string {
    return `/uploads/${category}/${filename}`;
  }

  /**
   * Get file size in bytes
   * @param filePath - Path to the file
   * @returns File size in bytes, or 0 if file doesn't exist
   */
  static getFileSize(filePath: string): number {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return stats.size;
      }
      return 0;
    } catch (error) {
      console.error('Error getting file size:', error);
      return 0;
    }
  }

  /**
   * Check if a file exists
   * @param filePath - Path to check
   * @returns true if file exists, false otherwise
   */
  static fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Sanitize filename to prevent directory traversal attacks
   * @param filename - Original filename
   * @returns Sanitized filename
   */
  static sanitizeFilename(filename: string): string {
    return path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  /**
   * Get file extension
   * @param filename - Filename
   * @returns File extension (without dot)
   */
  static getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase().replace('.', '');
  }

  /**
   * Validate image file extension
   * @param filename - Filename to validate
   * @returns true if valid image extension, false otherwise
   */
  static isValidImageExtension(filename: string): boolean {
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const ext = this.getFileExtension(filename);
    return validExtensions.includes(ext);
  }
}
