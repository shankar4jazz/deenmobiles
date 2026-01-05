import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { config } from '../config/env';

/**
 * Check if rate limiting should be bypassed
 * Bypasses in development mode when RATE_LIMIT_BYPASS_DEV=true
 */
const shouldBypassRateLimit = (): boolean => {
  return config.env === 'development' && config.rateLimit.bypassInDev;
};

/**
 * Rate limiter for login endpoint
 * Prevents brute force attacks
 * - Only counts failed login attempts (successful logins don't consume quota)
 * - Can be bypassed in development via RATE_LIMIT_BYPASS_DEV=true
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 failed login requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Only count failed requests (Option A)
  skipFailedRequests: false,
  skip: (_req: Request) => shouldBypassRateLimit(), // Bypass in dev mode (Option D)
});

/**
 * Rate limiter for general API endpoints
 * 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for sensitive operations
 * 3 requests per hour per IP
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many attempts. Please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Registration rate limiter
 * 3 registrations per hour per IP
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
