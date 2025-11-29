import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { ReportCacheOptions } from '../types/analytics';

const prisma = new PrismaClient();

export class ReportCacheService {
  /**
   * Generate a unique cache key from report parameters
   * Uses SHA256 hash of stringified parameters
   */
  generateCacheKey(reportType: string, params: Record<string, any>): string {
    // Sort keys to ensure consistent hashing
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    const paramsString = JSON.stringify(sortedParams);
    const hash = crypto
      .createHash('sha256')
      .update(`${reportType}:${paramsString}`)
      .digest('hex');

    return hash;
  }

  /**
   * Get cached report if it exists and is not expired
   */
  async getCachedReport<T>(
    reportType: string,
    reportKey: string,
    companyId: string
  ): Promise<T | null> {
    try {
      const cached = await prisma.reportCache.findUnique({
        where: { reportKey },
      });

      if (!cached) {
        return null;
      }

      // Check if cache is expired
      if (new Date() > cached.expiresAt) {
        // Delete expired cache
        await this.deleteCacheEntry(reportKey);
        return null;
      }

      // Verify company match for security
      if (cached.companyId !== companyId) {
        return null;
      }

      return cached.data as T;
    } catch (error) {
      console.error('Error retrieving cached report:', error);
      return null;
    }
  }

  /**
   * Cache a report with TTL
   */
  async cacheReport<T>(
    reportType: string,
    reportKey: string,
    companyId: string,
    branchId: string | undefined,
    data: T,
    ttl: number = 3600 // Default 1 hour in seconds
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000);

      await prisma.reportCache.upsert({
        where: { reportKey },
        create: {
          reportType,
          reportKey,
          companyId,
          branchId: branchId || null,
          data: data as any,
          expiresAt,
        },
        update: {
          data: data as any,
          generatedAt: new Date(),
          expiresAt,
        },
      });
    } catch (error) {
      console.error('Error caching report:', error);
      // Don't throw - caching failures shouldn't break the app
    }
  }

  /**
   * Get cached report or generate and cache it
   */
  async getOrGenerateReport<T>(
    reportType: string,
    params: Record<string, any>,
    companyId: string,
    branchId: string | undefined,
    generator: () => Promise<T>,
    options: ReportCacheOptions = { ttl: 3600 }
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(reportType, params);

    // Try to get from cache first
    const cached = await this.getCachedReport<T>(reportType, cacheKey, companyId);
    if (cached) {
      console.log(`Cache hit for ${reportType}:${cacheKey}`);
      return cached;
    }

    // Generate report
    console.log(`Cache miss for ${reportType}:${cacheKey} - generating...`);
    const data = await generator();

    // Cache the result
    await this.cacheReport(reportType, cacheKey, companyId, branchId, data, options.ttl);

    return data;
  }

  /**
   * Invalidate specific cache entry
   */
  async deleteCacheEntry(reportKey: string): Promise<void> {
    try {
      await prisma.reportCache.delete({
        where: { reportKey },
      });
    } catch (error) {
      // Entry might not exist, that's okay
      console.error('Error deleting cache entry:', error);
    }
  }

  /**
   * Invalidate all caches for a specific report type
   */
  async invalidateReportType(reportType: string, companyId?: string): Promise<number> {
    try {
      const result = await prisma.reportCache.deleteMany({
        where: {
          reportType,
          ...(companyId && { companyId }),
        },
      });
      return result.count;
    } catch (error) {
      console.error('Error invalidating report type:', error);
      return 0;
    }
  }

  /**
   * Invalidate all caches for a company
   */
  async invalidateCompany(companyId: string): Promise<number> {
    try {
      const result = await prisma.reportCache.deleteMany({
        where: { companyId },
      });
      return result.count;
    } catch (error) {
      console.error('Error invalidating company caches:', error);
      return 0;
    }
  }

  /**
   * Invalidate all caches for a branch
   */
  async invalidateBranch(branchId: string): Promise<number> {
    try {
      const result = await prisma.reportCache.deleteMany({
        where: { branchId },
      });
      return result.count;
    } catch (error) {
      console.error('Error invalidating branch caches:', error);
      return 0;
    }
  }

  /**
   * Clean up expired cache entries
   * Should be run periodically via cron job
   */
  async cleanupExpiredCaches(): Promise<number> {
    try {
      const result = await prisma.reportCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      console.log(`Cleaned up ${result.count} expired cache entries`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired caches:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(companyId?: string): Promise<{
    totalEntries: number;
    totalSize: number;
    byReportType: Record<string, number>;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    try {
      const where = companyId ? { companyId } : {};

      const entries = await prisma.reportCache.findMany({
        where,
        select: {
          reportType: true,
          generatedAt: true,
          data: true,
        },
      });

      const byReportType: Record<string, number> = {};
      let totalSize = 0;
      let oldestEntry: Date | null = null;
      let newestEntry: Date | null = null;

      entries.forEach((entry) => {
        byReportType[entry.reportType] = (byReportType[entry.reportType] || 0) + 1;

        // Estimate size (rough approximation)
        totalSize += JSON.stringify(entry.data).length;

        if (!oldestEntry || entry.generatedAt < oldestEntry) {
          oldestEntry = entry.generatedAt;
        }
        if (!newestEntry || entry.generatedAt > newestEntry) {
          newestEntry = entry.generatedAt;
        }
      });

      return {
        totalEntries: entries.length,
        totalSize,
        byReportType,
        oldestEntry,
        newestEntry,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        byReportType: {},
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }

  /**
   * Warm up cache by pre-generating common reports
   * Can be run after business hours
   */
  async warmupCache(
    companyId: string,
    branchId: string | undefined,
    generators: Array<{
      reportType: string;
      params: Record<string, any>;
      generator: () => Promise<any>;
      ttl?: number;
    }>
  ): Promise<void> {
    console.log(`Starting cache warmup for company ${companyId}...`);

    for (const { reportType, params, generator, ttl } of generators) {
      try {
        await this.getOrGenerateReport(
          reportType,
          params,
          companyId,
          branchId,
          generator,
          { ttl: ttl || 3600 }
        );
        console.log(`✓ Warmed up cache for ${reportType}`);
      } catch (error) {
        console.error(`✗ Failed to warm up cache for ${reportType}:`, error);
      }
    }

    console.log('Cache warmup completed');
  }
}

export default new ReportCacheService();
