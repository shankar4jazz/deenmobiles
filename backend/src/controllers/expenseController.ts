import { Response } from 'express';
import { ExpenseService } from '../services/expenseService';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export class ExpenseController {
  static getAllExpenses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { companyId } = req.user!;
    const {
      page, limit, search, branchId, categoryId, recordedBy,
      startDate, endDate, minAmount, maxAmount,
    } = req.query;

    const result = await ExpenseService.getAllExpenses({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      branchId: branchId as string,
      categoryId: categoryId as string,
      recordedBy: recordedBy as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
    });

    res.status(200).json({ success: true, data: result });
  });

  static getExpenseById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { companyId } = req.user!;

    const expense = await ExpenseService.getExpenseById(id, companyId);

    res.status(200).json({ success: true, data: expense });
  });

  static createExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { companyId, userId, branchId } = req.user!;
    const { categoryId, amount, expenseDate, description, billNumber, vendorName, attachmentUrl, remarks } = req.body;

    const expense = await ExpenseService.createExpense({
      branchId: branchId!,
      categoryId,
      amount: parseFloat(amount),
      expenseDate: expenseDate ? new Date(expenseDate) : undefined,
      description,
      billNumber,
      vendorName,
      attachmentUrl,
      remarks,
      companyId,
      recordedBy: userId,
    });

    res.status(201).json({ success: true, message: 'Expense recorded successfully', data: expense });
  });

  static updateExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { companyId } = req.user!;
    const { categoryId, amount, expenseDate, description, billNumber, vendorName, attachmentUrl, remarks } = req.body;

    const expense = await ExpenseService.updateExpense(id, companyId, {
      categoryId,
      amount: amount ? parseFloat(amount) : undefined,
      expenseDate: expenseDate ? new Date(expenseDate) : undefined,
      description,
      billNumber,
      vendorName,
      attachmentUrl,
      remarks,
    });

    res.status(200).json({ success: true, message: 'Expense updated successfully', data: expense });
  });

  static deleteExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { companyId } = req.user!;

    const result = await ExpenseService.deleteExpense(id, companyId);

    res.status(200).json({ success: true, ...result });
  });

  static getExpenseStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { companyId } = req.user!;
    const { branchId, categoryId } = req.query;

    const stats = await ExpenseService.getExpenseStats(companyId, branchId as string, categoryId as string);

    res.status(200).json({ success: true, data: stats });
  });

  static getBranchDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { branchId } = req.params;
    const { companyId } = req.user!;

    const dashboard = await ExpenseService.getBranchDashboard(branchId, companyId);

    res.status(200).json({ success: true, data: dashboard });
  });
}
