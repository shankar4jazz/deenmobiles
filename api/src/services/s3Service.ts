import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config/env';
import path from 'path';
import { Logger } from '../utils/logger';

// Initialize S3 Client
const s3Client = new S3Client({
  region: config.storage.region,
  credentials: {
    accessKeyId: config.storage.accessKeyId,
    secretAccessKey: config.storage.secretAccessKey,
  },
  ...(config.storage.endpoint && { endpoint: config.storage.endpoint }),
});

export class S3Service {
  private static bucketName = config.storage.bucketName;
  private static region = config.storage.region;

  /**
   * Upload a file to S3
   */
  static async uploadFile(params: {
    buffer: Buffer;
    key: string;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: params.key,
        Body: params.buffer,
        ContentType: params.contentType,
        Metadata: params.metadata,
      });

      await s3Client.send(command);

      const url = this.getPublicUrl(params.key);
      Logger.info('File uploaded to S3', { key: params.key, url });

      return url;
    } catch (error) {
      Logger.error('S3 upload error', { error, key: params.key });
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await s3Client.send(command);
      Logger.info('File deleted from S3', { key });
    } catch (error) {
      Logger.error('S3 delete error', { error, key });
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Generate a public URL for an S3 object
   */
  static getPublicUrl(key: string): string {
    if (config.storage.endpoint) {
      // For custom endpoints (R2, DigitalOcean Spaces, etc.)
      return `${config.storage.endpoint}/${this.bucketName}/${key}`;
    }
    // Standard AWS S3 URL
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Generate a unique key for file storage
   */
  static generateKey(folder: string, entityId: string, filename: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const ext = path.extname(filename).toLowerCase();
    const safeName = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20);

    return `${folder}/${entityId}/${timestamp}-${randomSuffix}-${safeName}${ext}`;
  }

  /**
   * Check if a URL is an S3 URL
   */
  static isS3Url(url: string): boolean {
    if (!url) return false;
    return (
      url.includes('.s3.') ||
      url.includes('amazonaws.com') ||
      (config.storage.endpoint ? url.includes(config.storage.endpoint) : false)
    );
  }

  /**
   * Extract S3 key from a full URL
   */
  static extractKeyFromUrl(url: string): string | null {
    if (!url) return null;

    try {
      // Handle standard S3 URLs: https://bucket.s3.region.amazonaws.com/key
      const s3Pattern = new RegExp(
        `https://${this.bucketName}\\.s3\\.${this.region}\\.amazonaws\\.com/(.+)`
      );
      const s3Match = url.match(s3Pattern);
      if (s3Match) return s3Match[1];

      // Handle custom endpoint URLs
      if (config.storage.endpoint) {
        const endpointPattern = new RegExp(
          `${config.storage.endpoint}/${this.bucketName}/(.+)`
        );
        const endpointMatch = url.match(endpointPattern);
        if (endpointMatch) return endpointMatch[1];
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Delete file by URL (handles both S3 and local paths)
   */
  static async deleteFileByUrl(url: string): Promise<boolean> {
    if (!url) return false;

    if (this.isS3Url(url)) {
      const key = this.extractKeyFromUrl(url);
      if (key) {
        await this.deleteFile(key);
        return true;
      }
    }

    // Not an S3 URL, return false (let caller handle local deletion)
    return false;
  }
}
