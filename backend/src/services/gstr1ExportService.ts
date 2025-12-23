import ExcelJS from 'exceljs';

interface B2BRecord {
  gstin: string;
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceValue: number;
  placeOfSupply: string;
  reverseCharge: boolean;
  invoiceType: string;
  rate: number;
  taxableValue: number;
  igstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  cessAmount: number;
}

interface B2CLargeRecord {
  placeOfSupply: string;
  rate: number;
  taxableValue: number;
  igstAmount: number;
  cessAmount: number;
}

interface B2CSmallRecord {
  type: string;
  placeOfSupply: string;
  rate: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
}

interface HSNSummaryRecord {
  hsnCode: string;
  description: string;
  uqc: string;
  totalQuantity: number;
  totalValue: number;
  taxableValue: number;
  igstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  cessAmount: number;
}

interface DocumentSummaryRecord {
  documentType: string;
  fromNumber: string;
  toNumber: string;
  totalCount: number;
  cancelledCount: number;
  netIssued: number;
}

interface GSTR1Data {
  period: string;
  b2b: B2BRecord[];
  b2cLarge: B2CLargeRecord[];
  b2cSmall: B2CSmallRecord[];
  hsnSummary: HSNSummaryRecord[];
  documentSummary: DocumentSummaryRecord[];
  summary: {
    totalTaxableValue: number;
    totalIGST: number;
    totalCGST: number;
    totalSGST: number;
    totalCess: number;
    totalTax: number;
  };
}

// State code to state name mapping
const STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

export class GSTR1ExportService {
  static async exportToExcel(data: GSTR1Data, companyName: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DeenMobiles';
    workbook.created = new Date();

    // Sheet 1: B2B
    await this.createB2BSheet(workbook, data.b2b);

    // Sheet 2: B2C Large
    await this.createB2CLargeSheet(workbook, data.b2cLarge);

    // Sheet 3: B2C Small
    await this.createB2CSmallSheet(workbook, data.b2cSmall);

    // Sheet 4: HSN Summary
    await this.createHSNSummarySheet(workbook, data.hsnSummary);

    // Sheet 5: Document Summary
    await this.createDocumentSummarySheet(workbook, data.documentSummary);

    // Sheet 6: Summary
    await this.createSummarySheet(workbook, data, companyName);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private static styleHeaderRow(row: ExcelJS.Row) {
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' },
      };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  }

  private static formatDate(date: Date): string {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private static getPlaceOfSupplyDisplay(stateCode: string): string {
    const stateName = STATE_CODES[stateCode] || stateCode;
    return `${stateCode}-${stateName}`;
  }

  private static async createB2BSheet(workbook: ExcelJS.Workbook, data: B2BRecord[]) {
    const sheet = workbook.addWorksheet('B2B');

    // Set columns
    sheet.columns = [
      { header: 'GSTIN/UIN of Recipient', key: 'gstin', width: 20 },
      { header: 'Invoice Number', key: 'invoiceNumber', width: 18 },
      { header: 'Invoice date', key: 'invoiceDate', width: 12 },
      { header: 'Invoice Value', key: 'invoiceValue', width: 15 },
      { header: 'Place Of Supply', key: 'placeOfSupply', width: 25 },
      { header: 'Reverse Charge', key: 'reverseCharge', width: 12 },
      { header: 'Invoice Type', key: 'invoiceType', width: 12 },
      { header: 'Rate', key: 'rate', width: 8 },
      { header: 'Taxable Value', key: 'taxableValue', width: 15 },
      { header: 'Integrated Tax Amount', key: 'igstAmount', width: 18 },
      { header: 'Central Tax Amount', key: 'cgstAmount', width: 18 },
      { header: 'State/UT Tax Amount', key: 'sgstAmount', width: 18 },
      { header: 'Cess Amount', key: 'cessAmount', width: 12 },
    ];

    // Style header
    this.styleHeaderRow(sheet.getRow(1));

    // Add data
    data.forEach((record) => {
      sheet.addRow({
        gstin: record.gstin,
        invoiceNumber: record.invoiceNumber,
        invoiceDate: this.formatDate(record.invoiceDate),
        invoiceValue: record.invoiceValue,
        placeOfSupply: this.getPlaceOfSupplyDisplay(record.placeOfSupply),
        reverseCharge: record.reverseCharge ? 'Y' : 'N',
        invoiceType: record.invoiceType,
        rate: record.rate,
        taxableValue: record.taxableValue,
        igstAmount: record.igstAmount,
        cgstAmount: record.cgstAmount,
        sgstAmount: record.sgstAmount,
        cessAmount: record.cessAmount,
      });
    });

    // Format number columns
    sheet.getColumn('invoiceValue').numFmt = '#,##0.00';
    sheet.getColumn('taxableValue').numFmt = '#,##0.00';
    sheet.getColumn('igstAmount').numFmt = '#,##0.00';
    sheet.getColumn('cgstAmount').numFmt = '#,##0.00';
    sheet.getColumn('sgstAmount').numFmt = '#,##0.00';
    sheet.getColumn('cessAmount').numFmt = '#,##0.00';
  }

  private static async createB2CLargeSheet(workbook: ExcelJS.Workbook, data: B2CLargeRecord[]) {
    const sheet = workbook.addWorksheet('B2C Large');

    sheet.columns = [
      { header: 'Place Of Supply', key: 'placeOfSupply', width: 25 },
      { header: 'Rate', key: 'rate', width: 8 },
      { header: 'Taxable Value', key: 'taxableValue', width: 15 },
      { header: 'Integrated Tax Amount', key: 'igstAmount', width: 18 },
      { header: 'Cess Amount', key: 'cessAmount', width: 12 },
    ];

    this.styleHeaderRow(sheet.getRow(1));

    data.forEach((record) => {
      sheet.addRow({
        placeOfSupply: this.getPlaceOfSupplyDisplay(record.placeOfSupply),
        rate: record.rate,
        taxableValue: record.taxableValue,
        igstAmount: record.igstAmount,
        cessAmount: record.cessAmount,
      });
    });

    sheet.getColumn('taxableValue').numFmt = '#,##0.00';
    sheet.getColumn('igstAmount').numFmt = '#,##0.00';
    sheet.getColumn('cessAmount').numFmt = '#,##0.00';
  }

  private static async createB2CSmallSheet(workbook: ExcelJS.Workbook, data: B2CSmallRecord[]) {
    const sheet = workbook.addWorksheet('B2C Small');

    sheet.columns = [
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Place Of Supply', key: 'placeOfSupply', width: 25 },
      { header: 'Rate', key: 'rate', width: 8 },
      { header: 'Taxable Value', key: 'taxableValue', width: 15 },
      { header: 'Central Tax Amount', key: 'cgstAmount', width: 18 },
      { header: 'State/UT Tax Amount', key: 'sgstAmount', width: 18 },
      { header: 'Integrated Tax Amount', key: 'igstAmount', width: 18 },
      { header: 'Cess Amount', key: 'cessAmount', width: 12 },
    ];

    this.styleHeaderRow(sheet.getRow(1));

    data.forEach((record) => {
      sheet.addRow({
        type: record.type,
        placeOfSupply: this.getPlaceOfSupplyDisplay(record.placeOfSupply),
        rate: record.rate,
        taxableValue: record.taxableValue,
        cgstAmount: record.cgstAmount,
        sgstAmount: record.sgstAmount,
        igstAmount: record.igstAmount,
        cessAmount: record.cessAmount,
      });
    });

    sheet.getColumn('taxableValue').numFmt = '#,##0.00';
    sheet.getColumn('cgstAmount').numFmt = '#,##0.00';
    sheet.getColumn('sgstAmount').numFmt = '#,##0.00';
    sheet.getColumn('igstAmount').numFmt = '#,##0.00';
    sheet.getColumn('cessAmount').numFmt = '#,##0.00';
  }

  private static async createHSNSummarySheet(workbook: ExcelJS.Workbook, data: HSNSummaryRecord[]) {
    const sheet = workbook.addWorksheet('HSN Summary');

    sheet.columns = [
      { header: 'HSN', key: 'hsnCode', width: 12 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'UQC', key: 'uqc', width: 8 },
      { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
      { header: 'Total Value', key: 'totalValue', width: 15 },
      { header: 'Taxable Value', key: 'taxableValue', width: 15 },
      { header: 'Integrated Tax Amount', key: 'igstAmount', width: 18 },
      { header: 'Central Tax Amount', key: 'cgstAmount', width: 18 },
      { header: 'State/UT Tax Amount', key: 'sgstAmount', width: 18 },
      { header: 'Cess Amount', key: 'cessAmount', width: 12 },
    ];

    this.styleHeaderRow(sheet.getRow(1));

    data.forEach((record) => {
      sheet.addRow({
        hsnCode: record.hsnCode,
        description: record.description,
        uqc: record.uqc,
        totalQuantity: record.totalQuantity,
        totalValue: record.totalValue,
        taxableValue: record.taxableValue,
        igstAmount: record.igstAmount,
        cgstAmount: record.cgstAmount,
        sgstAmount: record.sgstAmount,
        cessAmount: record.cessAmount,
      });
    });

    sheet.getColumn('totalQuantity').numFmt = '#,##0';
    sheet.getColumn('totalValue').numFmt = '#,##0.00';
    sheet.getColumn('taxableValue').numFmt = '#,##0.00';
    sheet.getColumn('igstAmount').numFmt = '#,##0.00';
    sheet.getColumn('cgstAmount').numFmt = '#,##0.00';
    sheet.getColumn('sgstAmount').numFmt = '#,##0.00';
    sheet.getColumn('cessAmount').numFmt = '#,##0.00';
  }

  private static async createDocumentSummarySheet(workbook: ExcelJS.Workbook, data: DocumentSummaryRecord[]) {
    const sheet = workbook.addWorksheet('Document Summary');

    sheet.columns = [
      { header: 'Document Type', key: 'documentType', width: 35 },
      { header: 'Sr. No. From', key: 'fromNumber', width: 20 },
      { header: 'Sr. No. To', key: 'toNumber', width: 20 },
      { header: 'Total Number', key: 'totalCount', width: 12 },
      { header: 'Cancelled', key: 'cancelledCount', width: 12 },
      { header: 'Net Issued', key: 'netIssued', width: 12 },
    ];

    this.styleHeaderRow(sheet.getRow(1));

    data.forEach((record) => {
      sheet.addRow({
        documentType: record.documentType,
        fromNumber: record.fromNumber,
        toNumber: record.toNumber,
        totalCount: record.totalCount,
        cancelledCount: record.cancelledCount,
        netIssued: record.netIssued,
      });
    });
  }

  private static async createSummarySheet(workbook: ExcelJS.Workbook, data: GSTR1Data, companyName: string) {
    const sheet = workbook.addWorksheet('Summary');

    // Title
    sheet.mergeCells('A1:C1');
    sheet.getCell('A1').value = `GSTR1 Summary - ${data.period}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:C2');
    sheet.getCell('A2').value = companyName;
    sheet.getCell('A2').font = { bold: true, size: 12 };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    // Summary data
    const summaryData = [
      ['', '', ''],
      ['Metric', 'Value', ''],
      ['Total Taxable Value', data.summary.totalTaxableValue, ''],
      ['Total IGST', data.summary.totalIGST, ''],
      ['Total CGST', data.summary.totalCGST, ''],
      ['Total SGST', data.summary.totalSGST, ''],
      ['Total Cess', data.summary.totalCess, ''],
      ['Total Tax', data.summary.totalTax, ''],
    ];

    summaryData.forEach((row, index) => {
      const excelRow = sheet.addRow(row);
      if (index === 1) { // Header row
        this.styleHeaderRow(excelRow);
      }
    });

    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(2).numFmt = '#,##0.00';
  }
}

export default GSTR1ExportService;
