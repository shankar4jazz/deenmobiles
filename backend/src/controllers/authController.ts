import { Response } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { config } from '../config/env';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   * User login
   */
  static login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { identifier, password, rememberMe } = req.body;

    const result = await AuthService.login(identifier, password, rememberMe);

    // Set refresh token as httpOnly cookie
    const cookieExpiry = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
      maxAge: cookieExpiry,
    });

    return ApiResponse.success(
      res,
      {
        accessToken: result.accessToken,
        user: result.user,
      },
      'Login successful'
    );
  });

  /**
   * POST /api/v1/auth/register
   * User registration
   */
  static register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userData = req.body;

    const user = await AuthService.register(userData);

    return ApiResponse.created(res, user, 'User registered successfully');
  });

  /**
   * POST /api/v1/auth/logout
   * User logout
   */
  static logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return ApiResponse.badRequest(res, 'Refresh token required');
    }

    if (req.user) {
      await AuthService.logout(req.user.userId, refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    return ApiResponse.success(res, null, 'Logged out successfully');
  });

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  static refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return ApiResponse.unauthorized(res, 'Refresh token required');
    }

    const tokens = await AuthService.refreshAccessToken(refreshToken);

    return ApiResponse.success(
      res,
      { accessToken: tokens.accessToken },
      'Token refreshed successfully'
    );
  });

  /**
   * GET /api/v1/auth/me
   * Get current user
   */
  static getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const user = await AuthService.getCurrentUser(req.user.userId);

    return ApiResponse.success(res, user, 'User retrieved successfully');
  });
}
