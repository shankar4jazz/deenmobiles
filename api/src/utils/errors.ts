import { AppError } from '../middleware/errorHandler';

// Re-export AppError for convenience
export { AppError };

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(400, message);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(404, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(409, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error') {
    super(500, message);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
