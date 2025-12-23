import { Response } from 'express';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import reportService from '../services/reportService';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export class ReportController {
  /**
   * GET /api/v1/reports/booking-person
   * Booking person wise report
   */
  static getBookingPersonReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const report = await reportService.getBookingPersonReport({
      companyId,
      branchId,
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
    });

    return ApiResponse.success(res, report, 'Booking person report retrieved successfully');
  });

  /**
   * GET /api/v1/reports/technician
   * Technician wise report
   */
  static getTechnicianReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const report = await reportService.getTechnicianReport({
      companyId,
      branchId,
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
    });

    return ApiResponse.success(res, report, 'Technician report retrieved successfully');
  });

  /**
   * GET /api/v1/reports/brand
   * Brand wise report
   */
  static getBrandReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const report = await reportService.getBrandReport({
      companyId,
      branchId,
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
    });

    return ApiResponse.success(res, report, 'Brand report retrieved successfully');
  });

  /**
   * GET /api/v1/reports/fault
   * Fault wise report
   */
  static getFaultReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const report = await reportService.getFaultReport({
      companyId,
      branchId,
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
    });

    return ApiResponse.success(res, report, 'Fault report retrieved successfully');
  });

  /**
   * GET /api/v1/reports/daily-transaction
   * Daily transaction report
   */
  static getDailyTransactionReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string | undefined;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    const date = new Date(req.query.date as string);

    const report = await reportService.getDailyTransactionReport(companyId, branchId, date);

    return ApiResponse.success(res, report, 'Daily transaction report retrieved successfully');
  });

  /**
   * GET /api/v1/reports/cash-settlement
   * Daily cash settlement report
   */
  static getDailyCashSettlement = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.query.branchId as string;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required for cash settlement report');
    }

    const date = new Date(req.query.date as string);

    const report = await reportService.getDailyCashSettlement(companyId, branchId, date);

    return ApiResponse.success(res, report, 'Cash settlement report retrieved successfully');
  });

  /**
   * POST /api/v1/reports/opening-balance
   * Set opening balance for a payment method
   */
  static setOpeningBalance = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.body.branchId as string;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required');
    }

    const { date, paymentMethodId, openingAmount } = req.body;

    const result = await reportService.setOpeningBalance(
      companyId,
      branchId,
      new Date(date),
      paymentMethodId,
      parseFloat(openingAmount)
    );

    return ApiResponse.success(res, result, 'Opening balance set successfully');
  });

  /**
   * POST /api/v1/reports/closing-balance
   * Set closing balance and carry forward to next day
   */
  static setClosingBalance = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const userRole = req.user!.role;

    let branchId = req.body.branchId as string;

    // Apply branch filter for branch-specific roles
    if (req.user!.branchId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      branchId = req.user!.branchId;
    }

    if (!branchId) {
      return ApiResponse.badRequest(res, 'Branch ID is required');
    }

    const { date, paymentMethodId, closingAmount } = req.body;

    const result = await reportService.setClosingBalanceAndCarryForward(
      companyId,
      branchId,
      new Date(date),
      paymentMethodId,
      parseFloat(closingAmount)
    );

    return ApiResponse.success(res, result, 'Closing balance set and carried forward successfully');
  });

  /**
   * POST /api/v1/reports/export
   * Export report to PDF or Excel
   */
  static exportReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reportType, format, reportData, title } = req.body;

    if (!['pdf', 'excel'].includes(format)) {
      return ApiResponse.badRequest(res, 'Invalid export format. Must be pdf or excel.');
    }

    if (format === 'excel') {
      const buffer = await ReportController.generateExcel(reportType, reportData, title);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.xlsx"`);
      return res.send(buffer);
    } else {
      const buffer = await ReportController.generatePDF(reportType, reportData, title);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
      return res.send(buffer);
    }
  });

  /**
   * Generate Excel report
   */
  private static async generateExcel(reportType: string, data: any, title: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(title || 'Report');

    // Set column widths
    sheet.columns = [
      { width: 5 },
      { width: 25 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ];

    // Add title
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = title || 'Report';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    // Add generated date
    sheet.mergeCells('A2:F2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Generated on: ${new Date().toLocaleString()}`;
    dateCell.font = { italic: true, size: 10 };
    dateCell.alignment = { horizontal: 'center' };

    let currentRow = 4;

    // Add summary section if exists
    if (data.summary && Array.isArray(data.summary)) {
      sheet.getCell(`A${currentRow}`).value = 'Summary';
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      currentRow++;

      // Add summary headers based on report type
      const summaryHeaders = Object.keys(data.summary[0] || {});
      summaryHeaders.forEach((header, idx) => {
        const cell = sheet.getCell(currentRow, idx + 1);
        cell.value = header.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };
      });
      currentRow++;

      // Add summary data
      for (const item of data.summary) {
        summaryHeaders.forEach((header, idx) => {
          const cell = sheet.getCell(currentRow, idx + 1);
          cell.value = item[header];
          if (typeof item[header] === 'number') {
            cell.numFmt = '#,##0.00';
          }
        });
        currentRow++;
      }

      currentRow += 2;
    }

    // Add totals if exists
    if (data.totals) {
      sheet.getCell(`A${currentRow}`).value = 'Totals';
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      currentRow++;

      for (const [key, value] of Object.entries(data.totals)) {
        sheet.getCell(`A${currentRow}`).value = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        sheet.getCell(`B${currentRow}`).value = value as any;
        if (typeof value === 'number') {
          sheet.getCell(`B${currentRow}`).numFmt = '#,##0.00';
        }
        currentRow++;
      }

      currentRow += 2;
    }

    // Add details section if exists
    if (data.details && Array.isArray(data.details) && data.details.length > 0) {
      sheet.getCell(`A${currentRow}`).value = 'Details';
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      currentRow++;

      // Add detail headers
      const detailHeaders = Object.keys(data.details[0]);
      detailHeaders.forEach((header, idx) => {
        const cell = sheet.getCell(currentRow, idx + 1);
        cell.value = header.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };
      });
      currentRow++;

      // Add detail data
      for (const item of data.details) {
        detailHeaders.forEach((header, idx) => {
          const cell = sheet.getCell(currentRow, idx + 1);
          let value = item[header];
          if (value instanceof Date) {
            value = value.toLocaleString();
          } else if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value);
          }
          cell.value = value;
        });
        currentRow++;
      }
    }

    // Add transactions section for transaction reports
    if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
      sheet.getCell(`A${currentRow}`).value = 'Transactions';
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      currentRow++;

      const txHeaders = ['Ticket #', 'Customer', 'Amount', 'Method', 'Date', 'Notes'];
      txHeaders.forEach((header, idx) => {
        const cell = sheet.getCell(currentRow, idx + 1);
        cell.value = header;
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };
      });
      currentRow++;

      for (const tx of data.transactions) {
        sheet.getCell(currentRow, 1).value = tx.ticketNumber || '-';
        sheet.getCell(currentRow, 2).value = tx.customerName || '-';
        sheet.getCell(currentRow, 3).value = tx.amount;
        sheet.getCell(currentRow, 3).numFmt = '#,##0.00';
        sheet.getCell(currentRow, 4).value = tx.paymentMethodName;
        sheet.getCell(currentRow, 5).value = new Date(tx.paymentDate).toLocaleString();
        sheet.getCell(currentRow, 6).value = tx.notes || '-';
        currentRow++;
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generate PDF report
   */
  private static async generatePDF(reportType: string, data: any, title: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(18).font('Helvetica-Bold').text(title || 'Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1);

      // Totals section
      if (data.totals) {
        doc.fontSize(14).font('Helvetica-Bold').text('Summary');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');

        for (const [key, value] of Object.entries(data.totals)) {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
          const displayValue = typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : value;
          doc.text(`${label}: ${displayValue}`);
        }
        doc.moveDown(1);
      }

      // Summary table
      if (data.summary && Array.isArray(data.summary) && data.summary.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Breakdown');
        doc.moveDown(0.5);

        const headers = Object.keys(data.summary[0]);
        const colWidth = 100;
        let y = doc.y;

        // Headers
        doc.fontSize(9).font('Helvetica-Bold');
        headers.slice(0, 5).forEach((header, idx) => {
          const label = header.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
          doc.text(label.substring(0, 15), 50 + idx * colWidth, y, { width: colWidth - 5 });
        });

        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(8);

        // Data rows (limit to 20 rows for PDF)
        const maxRows = Math.min(data.summary.length, 20);
        for (let i = 0; i < maxRows; i++) {
          const item = data.summary[i];
          y = doc.y;
          headers.slice(0, 5).forEach((header, idx) => {
            let value = item[header];
            if (typeof value === 'number') {
              value = value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
            }
            doc.text(String(value).substring(0, 18), 50 + idx * colWidth, y, { width: colWidth - 5 });
          });
          doc.moveDown(0.3);
        }

        if (data.summary.length > 20) {
          doc.moveDown(0.5);
          doc.text(`... and ${data.summary.length - 20} more items`);
        }
      }

      // By Method breakdown for transaction reports
      if (data.byMethod && Array.isArray(data.byMethod) && data.byMethod.length > 0) {
        doc.moveDown(1);
        doc.fontSize(14).font('Helvetica-Bold').text('By Payment Method');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');

        for (const method of data.byMethod) {
          const amount = method.amount?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0';
          doc.text(`${method.paymentMethodName || method.methodName}: ₹${amount} (${method.count} transactions)`);
        }
      }

      doc.end();
    });
  }
}
