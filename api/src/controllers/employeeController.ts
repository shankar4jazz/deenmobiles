import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { EmployeeService } from '../services/employeeService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class EmployeeController {
  /**
   * POST /api/v1/employees
   * Create a new employee
   */
  static createEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeData = req.body;
    const companyId = req.user!.companyId;

    // Parse boolean values from FormData (when multipart/form-data is used)
    if (typeof employeeData.isActive === 'string') {
      employeeData.isActive = employeeData.isActive === 'true';
    }

    // Profile image URL is already set by S3 upload middleware in req.body.profileImage
    const employee = await EmployeeService.createEmployee({
      ...employeeData,
      companyId,
    });

    return ApiResponse.created(res, employee, 'Employee created successfully');
  });

  /**
   * GET /api/v1/employees
   * Get all employees with filters and pagination
   */
  static getAllEmployees = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      companyId,
      search: req.query.search as string,
      role: req.query.role as UserRole,
      branchId: req.query.branchId as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    };

    const result = await EmployeeService.getAllEmployees(filters, page, limit);

    return ApiResponse.success(res, result, 'Employees retrieved successfully');
  });

  /**
   * GET /api/v1/employees/check-username
   * Check if username is available
   */
  static checkUsernameAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
    const username = req.query.username as string;
    const excludeUserId = req.query.excludeUserId as string | undefined;

    const isAvailable = await EmployeeService.checkUsernameAvailability(username, excludeUserId);

    return ApiResponse.success(res, { available: isAvailable }, isAvailable ? 'Username is available' : 'Username is already taken');
  });

  /**
   * GET /api/v1/employees/by-role
   * Get employees by role (for dropdowns)
   */
  static getEmployeesByRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const role = req.query.role as UserRole | undefined;

    const employees = await EmployeeService.getEmployeesByRole(companyId, role);

    return ApiResponse.success(res, employees, 'Employees retrieved successfully');
  });

  /**
   * GET /api/v1/employees/:id
   * Get employee by ID
   */
  static getEmployeeById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const employee = await EmployeeService.getEmployeeById(id, companyId);

    return ApiResponse.success(res, employee, 'Employee retrieved successfully');
  });

  /**
   * PUT /api/v1/employees/:id
   * Update employee
   */
  static updateEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const updateData = req.body;

    // Parse boolean values from FormData (when multipart/form-data is used)
    if (typeof updateData.isActive === 'string') {
      updateData.isActive = updateData.isActive === 'true';
    }

    // Profile image URL is already set by S3 upload middleware in req.body.profileImage
    const employee = await EmployeeService.updateEmployee(id, companyId, updateData);

    return ApiResponse.success(res, employee, 'Employee updated successfully');
  });

  /**
   * DELETE /api/v1/employees/:id
   * Delete employee
   */
  static deleteEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const result = await EmployeeService.deleteEmployee(id, companyId);

    return ApiResponse.success(res, result, 'Employee deleted successfully');
  });

  /**
   * POST /api/v1/employees/:id/add-to-branch
   * Add an existing employee to a branch
   */
  static addEmployeeToBranch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { branchId } = req.body;
    const companyId = req.user!.companyId;

    const employee = await EmployeeService.addEmployeeToBranch(id, branchId, companyId);

    return ApiResponse.success(res, employee, 'Employee added to branch successfully');
  });

  /**
   * PUT /api/v1/employees/:id/transfer
   * Transfer employee to a different branch
   */
  static transferEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { branchId } = req.body;
    const companyId = req.user!.companyId;

    const result = await EmployeeService.transferEmployee(id, branchId, companyId);

    return ApiResponse.success(res, result.employee, result.message);
  });

  /**
   * DELETE /api/v1/employees/:id/remove-from-branch
   * Remove employee from their current branch
   */
  static removeEmployeeFromBranch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const result = await EmployeeService.removeEmployeeFromBranch(id, companyId);

    return ApiResponse.success(res, result.employee, result.message);
  });
}
