import prisma from '../config/database';
import { comparePassword, hashPassword } from '../utils/password';
import { TokenService } from './tokenService';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { JWTPayload, TokenPair } from '../types';

const ACCOUNT_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

export class AuthService {
  /**
   * Login with email/username and password
   */
  static async login(
    identifier: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string | null;
      name: string;
      role: string;
      companyId: string;
      branchId: string | null;
      managedBranchId: string | null;
      branch: {
        id: string;
        name: string;
        code: string;
      } | null;
      managedBranch: {
        id: string;
        name: string;
        code: string;
      } | null;
    };
  }> {
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        name: true,
        phone: true,
        role: true,
        roleId: true,
        customRoleId: true,
        companyId: true,
        branchId: true,
        isActive: true,
        lastLoginAt: true,
        failedLoginAttempts: true,
        accountLockedUntil: true,
        lastFailedLoginAt: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!user) {
      Logger.warn('Login attempt with non-existent email or username', { identifier });
      throw new AppError(401, 'Invalid email/username or password');
    }

    // Check if account is active
    if (!user.isActive) {
      Logger.warn('Login attempt on inactive account', { userId: user.id });
      throw new AppError(403, 'Account is deactivated. Please contact administrator.');
    }

    // Check if account is locked
    if (await this.isAccountLocked(user.id)) {
      const lockedUntil = user.accountLockedUntil;
      const remainingMinutes = lockedUntil
        ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
        : 0;

      Logger.warn('Login attempt on locked account', { userId: user.id });
      throw new AppError(
        423,
        `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minutes.`
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      // Increment failed attempts
      await this.incrementFailedAttempts(user.id);

      const failedAttempts = user.failedLoginAttempts + 1;
      const remainingAttempts = MAX_FAILED_ATTEMPTS - failedAttempts;

      Logger.warn('Failed login attempt', {
        userId: user.id,
        attempts: failedAttempts,
      });

      if (remainingAttempts <= 0) {
        throw new AppError(
          423,
          'Account locked due to multiple failed login attempts. Please try again in 15 minutes.'
        );
      }

      throw new AppError(
        401,
        `Invalid email/username or password. ${remainingAttempts} attempts remaining before account lockout.`
      );
    }

    // Reset failed attempts on successful login
    await this.resetFailedAttempts(user.id);

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Fetch branch where user is the manager
    const managedBranch = await prisma.branch.findFirst({
      where: { managerId: user.id },
      select: { id: true, name: true, code: true },
    });

    // Generate tokens
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      roleId: user.roleId || undefined,
      companyId: user.companyId,
      branchId: user.branchId || undefined,
    };

    const accessToken = TokenService.generateAccessToken(tokenPayload);
    const refreshToken = TokenService.generateRefreshToken(
      {
        userId: user.id,
        email: user.email,
      },
      rememberMe
    );

    // Store refresh token in database
    await TokenService.storeRefreshToken(user.id, refreshToken, rememberMe);

    Logger.info('User logged in successfully', {
      userId: user.id,
      role: user.role,
      rememberMe,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        branchId: user.branchId,
        managedBranchId: managedBranch?.id || null,
        branch: user.branch ? {
          id: user.branch.id,
          name: user.branch.name,
          code: user.branch.code,
        } : null,
        managedBranch: managedBranch ? {
          id: managedBranch.id,
          name: managedBranch.name,
          code: managedBranch.code,
        } : null,
      },
    };
  }

  /**
   * Logout user and revoke refresh token
   */
  static async logout(userId: string, refreshToken: string): Promise<void> {
    await TokenService.revokeRefreshToken(refreshToken);
    Logger.info('User logged out', { userId });
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    // Verify token format
    const decoded = TokenService.verifyRefreshToken(refreshToken);

    // Check if token exists in database and is not expired
    const isValid = await TokenService.validateRefreshToken(refreshToken);

    if (!isValid) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        name: true,
        phone: true,
        role: true,
        roleId: true,
        customRoleId: true,
        companyId: true,
        branchId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'User not found or inactive');
    }

    // Generate new access token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      roleId: user.roleId || undefined,
      companyId: user.companyId,
      branchId: user.branchId || undefined,
    };

    const newAccessToken = TokenService.generateAccessToken(tokenPayload);

    Logger.info('Access token refreshed', { userId: user.id });

    return {
      accessToken: newAccessToken,
      refreshToken, // Return same refresh token
    };
  }

  /**
   * Register new user
   */
  static async register(userData: {
    email: string;
    username?: string;
    password: string;
    name: string;
    phone?: string;
    role: string;
    companyId: string;
    branchId?: string;
  }): Promise<{ id: string; email: string | null; username?: string | null; name: string }> {
    // Check if user already exists with email or username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { username: userData.username }
        ]
      },
    });

    if (existingUser) {
      if (existingUser.email === userData.email) {
        throw new AppError(409, 'User with this email already exists');
      }
      throw new AppError(409, 'User with this username already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        name: userData.name,
        phone: userData.phone,
        role: userData.role as any,
        companyId: userData.companyId,
        branchId: userData.branchId,
      },
    });

    Logger.info('New user registered', { userId: user.id, role: user.role });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    };
  }

  /**
   * Check if account is currently locked
   */
  private static async isAccountLocked(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        accountLockedUntil: true,
        failedLoginAttempts: true,
      },
    });

    if (!user) return false;

    // Check if account has lockout timestamp
    if (user.accountLockedUntil) {
      const now = new Date();

      // If lockout period has expired, unlock account
      if (user.accountLockedUntil <= now) {
        await this.unlockAccount(userId);
        return false;
      }

      return true; // Still locked
    }

    return false;
  }

  /**
   * Increment failed login attempts and lock account if needed
   */
  private static async incrementFailedAttempts(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    if (!user) return;

    const newAttempts = user.failedLoginAttempts + 1;
    const updateData: any = {
      failedLoginAttempts: newAttempts,
      lastFailedLoginAt: new Date(),
    };

    // Lock account if max attempts reached
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      updateData.accountLockedUntil = new Date(Date.now() + ACCOUNT_LOCKOUT_DURATION);
      Logger.warn('Account locked due to failed attempts', { userId });
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  /**
   * Reset failed login attempts (on successful login)
   */
  private static async resetFailedAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastFailedLoginAt: null,
      },
    });
  }

  /**
   * Manually unlock an account
   */
  private static async unlockAccount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    });
    Logger.info('Account unlocked', { userId });
  }

  /**
   * Get current user by ID
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        companyId: true,
        branchId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }
}
