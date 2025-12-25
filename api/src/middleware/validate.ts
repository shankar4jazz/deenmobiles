import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiResponse } from '../utils/response';

/**
 * Middleware to handle validation results
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors = errors.array().map((err) => ({
      field: 'param' in err ? err.param : 'unknown',
      message: err.msg,
    }));

    return ApiResponse.badRequest(res, 'Validation failed', formattedErrors);
  };
};
