import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import prisma from '../config/database';
import { JWTPayload } from '../types';
import { Logger } from '../utils/logger';

export class TokenService {
  /**
   * Generate JWT access token (short-lived: 15 minutes)
   */
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry,
    } as SignOptions);
  }

  /**
   * Generate JWT refresh token (long-lived: 7 days or 30 days with remember-me)
   */
  static generateRefreshToken(
    payload: Omit<JWTPayload, 'role' | 'companyId' | 'branchId'>,
    rememberMe: boolean = false
  ): string {
    const expiresIn = rememberMe ? '30d' : config.jwt.refreshExpiry;
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn,
    } as SignOptions);
  }

  /**
   * Verify and decode JWT access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwt.accessSecret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Verify and decode JWT refresh token
   */
  static verifyRefreshToken(token: string): {
    userId: string;
    email: string;
  } {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as {
        userId: string;
        email: string;
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Store refresh token in database
   */
  static async storeRefreshToken(
    userId: string,
    token: string,
    rememberMe: boolean = false
  ): Promise<void> {
    const expiresIn = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days or 7 days
    const expiresAt = new Date(Date.now() + expiresIn);

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    Logger.info('Refresh token stored', { userId });
  }

  /**
   * Revoke refresh token (on logout)
   */
  static async revokeRefreshToken(token: string): Promise<void> {
    try {
      await prisma.refreshToken.delete({
        where: { token },
      });
      Logger.info('Refresh token revoked');
    } catch (error) {
      Logger.warn('Failed to revoke refresh token', { error });
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: { userId },
      });
      Logger.info('All user tokens revoked', { userId, count: result.count });
    } catch (error) {
      Logger.error('Failed to revoke user tokens', { userId, error });
    }
  }

  /**
   * Check if refresh token exists and is valid in database
   */
  static async validateRefreshToken(token: string): Promise<boolean> {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshToken) {
      return false;
    }

    // Check if token is expired
    if (refreshToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.revokeRefreshToken(token);
      return false;
    }

    return true;
  }

  /**
   * Clean up expired refresh tokens (can be run as a cron job)
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      Logger.info('Expired tokens cleaned up', { count: result.count });
    } catch (error) {
      Logger.error('Failed to cleanup expired tokens', { error });
    }
  }
}
