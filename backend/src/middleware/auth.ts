import { Response, NextFunction } from 'express';
import { UserRole as PrismaUserRole } from '@prisma/client';
import { TokenService } from '../services/tokenService';
import { AuthRequest, UserRole } from '../types';
import { AppError } from './errorHandler';
import { Logger } from '../utils/logger';

/**
 * Authentication middleware - Verify JWT token
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided. Authorization required.');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = TokenService.verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      roleId: decoded.roleId,
      companyId: decoded.companyId,
      branchId: decoded.branchId,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return next(new AppError(401, 'Token has expired. Please login again.'));
      }
      if (error.message.includes('invalid')) {
        return next(new AppError(401, 'Invalid token. Please login again.'));
      }
    }

    Logger.error('Authentication error', { error });
    return next(new AppError(401, 'Authentication failed'));
  }
};

/**
 * Authorization middleware - Check user role
 * Usage: authorize('ADMIN', 'MANAGER')
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    const hasPermission = allowedRoles.includes(req.user.role);

    if (!hasPermission) {
      Logger.warn('Authorization failed', {
        userId: req.user.userId,
        userRole: req.user.role,
        allowedRoles,
      });
      return next(
        new AppError(403, 'Access denied. Insufficient permissions.')
      );
    }

    next();
  };
};

/**
 * Multi-tenant middleware - Ensure user can only access their company's data
 */
export const enforceCompanyAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(401, 'Authentication required'));
  }

  // Super admins can access all companies
  if (req.user.role === PrismaUserRole.SUPER_ADMIN) {
    return next();
  }

  // Other users must have a companyId
  if (!req.user.companyId) {
    return next(new AppError(403, 'No company access assigned'));
  }

  next();
};

/**
 * Branch access middleware - Ensure user can only access their branch's data
 */
export const enforceBranchAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(401, 'Authentication required'));
  }

  // Super admins and company admins can access all branches
  if (
    req.user.role === PrismaUserRole.SUPER_ADMIN ||
    req.user.role === PrismaUserRole.ADMIN
  ) {
    return next();
  }

  // Other users must have a branchId
  if (!req.user.branchId) {
    return next(new AppError(403, 'No branch access assigned'));
  }

  next();
};

/**
 * Optional authentication - Attach user if token is valid, but don't require it
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = TokenService.verifyAccessToken(token);

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        roleId: decoded.roleId,
        companyId: decoded.companyId,
        branchId: decoded.branchId,
      };
    }
  } catch (error) {
    // Silently fail - user will just be treated as unauthenticated
    Logger.debug('Optional auth failed', { error });
  }

  next();
};

/**
 * Helper to add company/branch filters to Prisma queries
 */
export const getMultitenantFilter = (req: AuthRequest) => {
  if (!req.user) {
    return {};
  }

  // Super admins see everything
  if (req.user.role === PrismaUserRole.SUPER_ADMIN) {
    return {};
  }

  // Company admins see their company
  if (req.user.role === PrismaUserRole.ADMIN) {
    return {
      companyId: req.user.companyId,
    };
  }

  // Branch-level users see only their branch
  return {
    companyId: req.user.companyId,
    branchId: req.user.branchId,
  };
};
