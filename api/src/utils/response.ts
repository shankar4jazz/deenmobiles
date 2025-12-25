import { Response } from 'express';

export class ApiResponse {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res: Response, message = 'Error', statusCode = 500, errors?: any) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static created<T>(res: Response, data: T, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static badRequest(res: Response, message = 'Bad request', errors?: any) {
    return this.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  static notFound(res: Response, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  static conflict(res: Response, message = 'Conflict', errors?: any) {
    return this.error(res, message, 409, errors);
  }

  static serverError(res: Response, message = 'Internal server error', errors?: any) {
    return this.error(res, message, 500, errors);
  }
}
