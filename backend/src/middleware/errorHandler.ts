import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { ApiResponse } from '../utils/response';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    Logger.error(`Operational Error: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
    });
    return ApiResponse.error(res, err.message, err.statusCode);
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    Logger.error('Database error', {
      error: err.message,
      code: prismaError.code,
      meta: prismaError.meta,
      path: req.path,
    });
    // Include more detail in development
    const message = process.env.NODE_ENV === 'development'
      ? `Database error: ${prismaError.code} - ${err.message}`
      : 'Database error occurred';
    return ApiResponse.error(res, message, 500);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token expired');
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return ApiResponse.badRequest(res, err.message);
  }

  // Unknown errors
  Logger.error('Unexpected Error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  return ApiResponse.serverError(res, 'An unexpected error occurred');
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
