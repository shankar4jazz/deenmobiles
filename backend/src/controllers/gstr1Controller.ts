import { Response } from 'express';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import gstr1Service from '../services/gstr1Service';
import { GSTR1ExportService } from '../services/gstr1ExportService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GSTR1Controller {
  /**
   * GET /api/v1/reports/gstr1
   * Get full GSTR1 report
   */
  static getGSTR1Report = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Branch isolation for non-admin roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);

    if (!month || month < 1 || month > 12) {
      return ApiResponse.badRequest(res, 'Valid month (1-12) is required');
    }

    if (!year || year < 2017) {
      return ApiResponse.badRequest(res, 'Valid year is required');
    }

    const report = await gstr1Service.getFullGSTR1Report({
      companyId,
      branchId,
      month,
      year,
    });

    return ApiResponse.success(res, report, 'GSTR1 report retrieved successfully');
  });

  /**
   * GET /api/v1/reports/gstr1/b2b
   * Get B2B invoices
   */
  static getB2BReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);

    if (!month || month < 1 || month > 12) {
      return ApiResponse.badRequest(res, 'Valid month (1-12) is required');
    }

    if (!year || year < 2017) {
      return ApiResponse.badRequest(res, 'Valid year is required');
    }

    const data = await gstr1Service.getB2BInvoices({
      companyId,
      branchId,
      month,
      year,
    });

    return ApiResponse.success(res, data, 'B2B invoices retrieved successfully');
  });

  /**
   * GET /api/v1/reports/gstr1/b2c-large
   * Get B2C Large invoices
   */
  static getB2CLargeReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);

    if (!month || month < 1 || month > 12) {
      return ApiResponse.badRequest(res, 'Valid month (1-12) is required');
    }

    if (!year || year < 2017) {
      return ApiResponse.badRequest(res, 'Valid year is required');
    }

    const data = await gstr1Service.getB2CLargeInvoices({
      companyId,
      branchId,
      month,
      year,
    });

    return ApiResponse.success(res, data, 'B2C Large invoices retrieved successfully');
  });

  /**
   * GET /api/v1/reports/gstr1/b2c-small
   * Get B2C Small invoices
   */
  static getB2CSmallReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);

    if (!month || month < 1 || month > 12) {
      return ApiResponse.badRequest(res, 'Valid month (1-12) is required');
    }

    if (!year || year < 2017) {
      return ApiResponse.badRequest(res, 'Valid year is required');
    }

    const data = await gstr1Service.getB2CSmallInvoices({
      companyId,
      branchId,
      month,
      year,
    });

    return ApiResponse.success(res, data, 'B2C Small invoices retrieved successfully');
  });

  /**
   * GET /api/v1/reports/gstr1/hsn-summary
   * Get HSN Summary
   */
  static getHSNSummaryReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);

    if (!month || month < 1 || month > 12) {
      return ApiResponse.badRequest(res, 'Valid month (1-12) is required');
    }

    if (!year || year < 2017) {
      return ApiResponse.badRequest(res, 'Valid year is required');
    }

    const data = await gstr1Service.getHSNSummary({
      companyId,
      branchId,
      month,
      year,
    });

    return ApiResponse.success(res, data, 'HSN Summary retrieved successfully');
  });

  /**
   * GET /api/v1/reports/gstr1/document-summary
   * Get Document Summary
   */
  static getDocumentSummaryReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);

    if (!month || month < 1 || month > 12) {
      return ApiResponse.badRequest(res, 'Valid month (1-12) is required');
    }

    if (!year || year < 2017) {
      return ApiResponse.badRequest(res, 'Valid year is required');
    }

    const data = await gstr1Service.getDocumentSummary({
      companyId,
      branchId,
      month,
      year,
    });

    return ApiResponse.success(res, data, 'Document Summary retrieved successfully');
  });

  /**
   * POST /api/v1/reports/gstr1/export
   * Export GSTR1 report to Excel
   */
  static exportGSTR1 = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);

    if (!month || month < 1 || month > 12) {
      return ApiResponse.badRequest(res, 'Valid month (1-12) is required');
    }

    if (!year || year < 2017) {
      return ApiResponse.badRequest(res, 'Valid year is required');
    }

    // Get company name for the report
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    // Get full GSTR1 data
    const reportData = await gstr1Service.getFullGSTR1Report({
      companyId,
      branchId,
      month,
      year,
    });

    // Export to Excel
    const buffer = await GSTR1ExportService.exportToExcel(reportData, company?.name || 'Company');

    // Set response headers for file download
    const filename = `GSTR1_${month.toString().padStart(2, '0')}_${year}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  });
}
