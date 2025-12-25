import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { InventoryService } from './inventoryService';
import { Writable } from 'stream';
import { InventoryCategory, GSTRate } from '@prisma/client';

interface ExportFilters {
  companyId: string;
  branchId?: string;
  category?: InventoryCategory;
  brandName?: string;
  gstRate?: GSTRate;
  active?: boolean;
}

export class ExportService {
  /**
   * Map GST rate enum to percentage
   */
  private static getGSTPercentage(gstRate: string): number {
    const gstMap: Record<string, number> = {
      ZERO: 0,
      FIVE: 5,
      TWELVE: 12,
      EIGHTEEN: 18,
      TWENTY_EIGHT: 28,
    };
    return gstMap[gstRate] || 0;
  }

  /**
   * Export inventory to Excel (XLSX)
   */
  static async exportToExcel(filters: ExportFilters): Promise<ExcelJS.Workbook> {
    try {
      // Fetch all inventory data (no pagination for export)
      const { inventories } = await InventoryService.getInventories({
        ...filters,
        limit: 10000, // Large limit for export
        page: 1,
      });

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventory Report');

      // Define columns
      worksheet.columns = [
        { header: 'Part Number', key: 'partNumber', width: 15 },
        { header: 'Part Name', key: 'partName', width: 25 },
        { header: 'Brand', key: 'brandName', width: 15 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'HSN Code', key: 'hsnCode', width: 12 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Stock Qty', key: 'stockQuantity', width: 12 },
        { header: 'Purchase Price (₹)', key: 'purchasePrice', width: 15 },
        { header: 'Sales Price (₹)', key: 'salesPrice', width: 15 },
        { header: 'GST Rate (%)', key: 'gstRate', width: 12 },
        { header: 'Tax Type', key: 'taxType', width: 12 },
        { header: 'Supplier', key: 'supplier', width: 20 },
        { header: 'Branch', key: 'branch', width: 15 },
        { header: 'Status', key: 'active', width: 10 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Add data rows
      inventories.forEach((inventory) => {
        worksheet.addRow({
          partNumber: inventory.partNumber,
          partName: inventory.partName,
          brandName: inventory.brandName || 'N/A',
          category: inventory.category || 'N/A',
          hsnCode: inventory.hsnCode,
          unit: inventory.unit,
          stockQuantity: parseFloat(inventory.stockQuantity.toString()),
          purchasePrice: inventory.purchasePrice ? parseFloat(inventory.purchasePrice.toString()) : 0,
          salesPrice: inventory.salesPrice ? parseFloat(inventory.salesPrice.toString()) : 0,
          gstRate: this.getGSTPercentage(inventory.gstRate),
          taxType: inventory.taxType,
          supplier: inventory.supplier?.name || 'N/A',
          branch: inventory.branch?.name || 'N/A',
          active: inventory.active ? 'Active' : 'Inactive',
        });
      });

      // Add summary section
      const summaryRow = worksheet.rowCount + 2;
      worksheet.getCell(`A${summaryRow}`).value = 'Total Items:';
      worksheet.getCell(`B${summaryRow}`).value = inventories.length;
      worksheet.getCell(`A${summaryRow}`).font = { bold: true };

      const totalValue = inventories.reduce(
        (acc, item) =>
          acc + parseFloat(item.stockQuantity.toString()) * (item.purchasePrice ? parseFloat(item.purchasePrice.toString()) : 0),
        0
      );
      worksheet.getCell(`A${summaryRow + 1}`).value = 'Total Inventory Value (₹):';
      worksheet.getCell(`B${summaryRow + 1}`).value = totalValue.toFixed(2);
      worksheet.getCell(`A${summaryRow + 1}`).font = { bold: true };

      Logger.info('Excel export generated successfully', {
        itemCount: inventories.length,
        companyId: filters.companyId,
      });

      return workbook;
    } catch (error) {
      Logger.error('Error generating Excel export', { error, filters });
      throw new AppError(500, 'Failed to generate Excel export');
    }
  }

  /**
   * Export inventory to CSV
   */
  static async exportToCSV(filters: ExportFilters): Promise<string> {
    try {
      // Fetch all inventory data
      const { inventories } = await InventoryService.getInventories({
        ...filters,
        limit: 10000,
        page: 1,
      });

      // CSV headers
      const headers = [
        'Part Number',
        'Part Name',
        'Brand',
        'Category',
        'HSN Code',
        'Unit',
        'Stock Qty',
        'Purchase Price',
        'Sales Price',
        'GST Rate (%)',
        'Tax Type',
        'Supplier',
        'Branch',
        'Status',
      ];

      // Build CSV content
      let csv = headers.join(',') + '\n';

      inventories.forEach((inventory) => {
        const row = [
          inventory.partNumber,
          `"${inventory.partName}"`,
          inventory.brandName || 'N/A',
          inventory.category || 'N/A',
          inventory.hsnCode,
          inventory.unit,
          inventory.stockQuantity.toString(),
          inventory.purchasePrice ? inventory.purchasePrice.toString() : '0',
          inventory.salesPrice ? inventory.salesPrice.toString() : '0',
          this.getGSTPercentage(inventory.gstRate).toString(),
          inventory.taxType,
          inventory.supplier?.name || 'N/A',
          inventory.branch?.name || 'N/A',
          inventory.active ? 'Active' : 'Inactive',
        ];
        csv += row.join(',') + '\n';
      });

      Logger.info('CSV export generated successfully', {
        itemCount: inventories.length,
        companyId: filters.companyId,
      });

      return csv;
    } catch (error) {
      Logger.error('Error generating CSV export', { error, filters });
      throw new AppError(500, 'Failed to generate CSV export');
    }
  }

  /**
   * Export inventory to PDF
   */
  static async exportToPDF(filters: ExportFilters, stream: Writable): Promise<void> {
    try {
      // Fetch all inventory data
      const { inventories } = await InventoryService.getInventories({
        ...filters,
        limit: 10000,
        page: 1,
      });

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(stream);

      // Add header
      doc.fontSize(20).text('Inventory Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();

      // Add summary
      doc.fontSize(12).text(`Total Items: ${inventories.length}`, { continued: true });
      const totalValue = inventories.reduce(
        (acc, item) =>
          acc + parseFloat(item.stockQuantity.toString()) * (item.purchasePrice ? parseFloat(item.purchasePrice.toString()) : 0),
        0
      );
      doc.text(`   Total Value: ₹${totalValue.toFixed(2)}`);
      doc.moveDown();

      // Add table headers
      const tableTop = doc.y;
      doc.fontSize(8);
      doc.text('Part #', 50, tableTop);
      doc.text('Name', 100, tableTop);
      doc.text('HSN', 200, tableTop);
      doc.text('Stock', 250, tableTop);
      doc.text('Purchase', 300, tableTop);
      doc.text('Sales', 360, tableTop);
      doc.text('GST%', 420, tableTop);
      doc.text('Branch', 460, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      let y = tableTop + 20;

      // Add inventory items
      inventories.forEach((item, index) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc.text(item.partNumber, 50, y);
        doc.text(item.partName.substring(0, 15), 100, y);
        doc.text(item.hsnCode, 200, y);
        doc.text(item.stockQuantity.toString(), 250, y);
        doc.text(item.purchasePrice ? item.purchasePrice.toString() : '0', 300, y);
        doc.text(item.salesPrice ? item.salesPrice.toString() : '0', 360, y);
        doc.text(this.getGSTPercentage(item.gstRate).toString(), 420, y);
        doc.text(item.branch?.name.substring(0, 10) || 'N/A', 460, y);

        y += 20;
      });

      // Finalize PDF
      doc.end();

      Logger.info('PDF export generated successfully', {
        itemCount: inventories.length,
        companyId: filters.companyId,
      });
    } catch (error) {
      Logger.error('Error generating PDF export', { error, filters });
      throw new AppError(500, 'Failed to generate PDF export');
    }
  }
}
