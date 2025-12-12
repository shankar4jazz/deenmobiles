import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string | null;
  gst?: string | null;
}

interface JobSheetData {
  jobSheetNumber: string;
  service: {
    ticketNumber: string;
    createdAt: Date;
    deviceModel: string;
    deviceIMEI?: string;
    devicePassword?: string;
    issue: string;
    diagnosis?: string;
    estimatedCost: number;
    advancePayment: number;
  };
  customer: {
    name: string;
    phone: string;
    address?: string;
    email?: string;
  };
  customerDevice?: {
    color?: string;
    accessories?: string[];
    purchaseYear?: number;
  };
  branch: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  company: CompanyInfo;
  technician?: {
    name: string;
  };
  faults?: Array<{
    name: string;
  }>;
  template?: {
    termsAndConditions?: string;
    showCustomerSignature: boolean;
    showAuthorizedSignature: boolean;
    showCompanyLogo: boolean;
    showContactDetails: boolean;
    footerText?: string;
  };
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  service: {
    ticketNumber: string;
    createdAt: Date;
    deviceModel: string;
    issue: string;
    diagnosis?: string;
    actualCost?: number;
    estimatedCost: number;
    advancePayment: number;
    completedAt?: Date;
  };
  customer: {
    name: string;
    phone: string;
    address?: string;
    email?: string;
  };
  branch: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  company: CompanyInfo;
  parts?: Array<{
    partName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  payments?: Array<{
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    createdAt: Date;
  }>;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
}

interface EstimateData {
  estimateNumber: string;
  estimateDate: Date;
  validUntil?: Date;
  customer: {
    name: string;
    phone: string;
    address?: string;
    email?: string;
  };
  service?: {
    ticketNumber: string;
    deviceModel: string;
    issue: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  branch: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  company: CompanyInfo;
}

/**
 * Service for generating PDF documents for Job Sheets and Invoices
 */
export class PDFGenerationService {
  private uploadDir: string;
  private baseUrl: string;
  private isServerless: boolean;

  constructor() {
    // Use /tmp on serverless environments (Vercel)
    this.isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    this.uploadDir = this.isServerless
      ? '/tmp/uploads'
      : path.join(process.cwd(), 'public', 'uploads');
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    this.ensureDirectoriesExist();
  }

  /**
   * Ensure upload directories exist
   */
  private ensureDirectoriesExist(): void {
    const jobSheetsDir = path.join(this.uploadDir, 'jobsheets');
    const invoicesDir = path.join(this.uploadDir, 'invoices');
    const estimatesDir = path.join(this.uploadDir, 'estimates');

    [jobSheetsDir, invoicesDir, estimatesDir].forEach((dir) => {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      } catch (error) {
        // Silently fail on read-only filesystems
        console.warn(`Could not create directory ${dir}:`, error);
      }
    });
  }

  /**
   * Generate Job Sheet PDF
   */
  async generateJobSheetPDF(data: JobSheetData): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `jobsheet_${data.jobSheetNumber}_${Date.now()}.pdf`;
        const filePath = path.join(this.uploadDir, 'jobsheets', fileName);
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Header
        this.addJobSheetHeader(doc, data);

        // Customer & Device Info
        this.addJobSheetCustomerInfo(doc, data);

        // Service Details
        this.addJobSheetServiceDetails(doc, data);

        // Terms & Signature
        this.addJobSheetFooter(doc, data);

        doc.end();

        stream.on('finish', () => {
          resolve(`${this.baseUrl}/uploads/jobsheets/${fileName}`);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Invoice PDF
   */
  async generateInvoicePDF(data: InvoiceData, format: string = 'A4'): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const formatSuffix = format.toUpperCase();
        const fileName = `invoice_${data.invoiceNumber}_${formatSuffix}_${Date.now()}.pdf`;
        const filePath = path.join(this.uploadDir, 'invoices', fileName);

        // Configure page size based on format
        let docOptions: any = {};
        switch (format.toLowerCase()) {
          case 'a5':
            docOptions = { size: 'A5', margin: 30 };
            break;
          case 'thermal-2':
            docOptions = { size: [144, 720], margin: 5 }; // 2 inch width (144 points)
            break;
          case 'thermal-3':
            docOptions = { size: [216, 720], margin: 10 }; // 3 inch width (216 points)
            break;
          case 'a4':
          default:
            docOptions = { size: 'A4', margin: 50 };
            break;
        }

        const doc = new PDFDocument(docOptions);
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Header
        this.addInvoiceHeader(doc, data);

        // Customer & Service Info
        this.addInvoiceCustomerInfo(doc, data);

        // Items Table
        this.addInvoiceItemsTable(doc, data);

        // Payment Summary
        this.addInvoicePaymentSummary(doc, data);

        // Payment History
        if (data.payments && data.payments.length > 0) {
          this.addInvoicePaymentHistory(doc, data);
        }

        // Footer
        this.addInvoiceFooter(doc, data);

        doc.end();

        stream.on('finish', () => {
          resolve(`${this.baseUrl}/uploads/invoices/${fileName}`);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add Job Sheet Header
   */
  private addJobSheetHeader(doc: PDFKit.PDFDocument, data: JobSheetData): void {
    // Company Name
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(data.company.name, 50, 50, { align: 'center' });

    // Branch Info - show based on template settings
    const showContactDetails = data.template?.showContactDetails !== false;

    if (showContactDetails) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(data.branch.name, { align: 'center' })
        .text(data.branch.address, { align: 'center' })
        .text(`Phone: ${data.branch.phone} | Email: ${data.branch.email}`, {
          align: 'center',
        });

      if (data.company.gst) {
        doc.text(`GST: ${data.company.gst}`, { align: 'center' });
      }
    }

    doc.moveDown();

    // Title
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('JOB SHEET', { align: 'center' });

    doc.moveDown();

    // Job Sheet Number & Date
    const y = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`Job Sheet No: `, 50, y);
    doc.font('Helvetica').text(data.jobSheetNumber, 150, y);

    doc.font('Helvetica-Bold').text(`Service Ticket: `, 50, y + 15);
    doc.font('Helvetica').text(data.service.ticketNumber, 150, y + 15);

    doc.font('Helvetica-Bold').text(`Date: `, 350, y);
    doc
      .font('Helvetica')
      .text(format(new Date(data.service.createdAt), 'dd/MM/yyyy'), 400, y);

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();
  }

  /**
   * Add Job Sheet Customer Info
   */
  private addJobSheetCustomerInfo(
    doc: PDFKit.PDFDocument,
    data: JobSheetData
  ): void {
    const startY = doc.y;

    // Customer Details
    doc.fontSize(12).font('Helvetica-Bold').text('CUSTOMER DETAILS', 50, startY);
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold').text('Name: ', 50, doc.y);
    doc.font('Helvetica').text(data.customer.name, 120, doc.y - 12);

    doc.font('Helvetica-Bold').text('Phone: ', 50, doc.y);
    doc.font('Helvetica').text(data.customer.phone, 120, doc.y - 12);

    if (data.customer.address) {
      doc.font('Helvetica-Bold').text('Address: ', 50, doc.y);
      doc.font('Helvetica').text(data.customer.address, 120, doc.y - 12, {
        width: 200,
      });
    }

    // Device Details
    doc.moveDown();
    const deviceY = doc.y;
    doc.fontSize(12).font('Helvetica-Bold').text('DEVICE DETAILS', 50, deviceY);
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold').text('Device: ', 50, doc.y);
    doc.font('Helvetica').text(data.service.deviceModel, 120, doc.y - 12);

    if (data.service.deviceIMEI) {
      doc.font('Helvetica-Bold').text('IMEI: ', 50, doc.y);
      doc.font('Helvetica').text(data.service.deviceIMEI, 120, doc.y - 12);
    }

    if (data.service.devicePassword) {
      doc.font('Helvetica-Bold').text('Password: ', 50, doc.y);
      doc.font('Helvetica').text(data.service.devicePassword, 120, doc.y - 12);
    }

    if (data.customerDevice?.color) {
      doc.font('Helvetica-Bold').text('Color: ', 50, doc.y);
      doc.font('Helvetica').text(data.customerDevice.color, 120, doc.y - 12);
    }

    if (data.customerDevice?.accessories && data.customerDevice.accessories.length > 0) {
      doc.font('Helvetica-Bold').text('Accessories: ', 50, doc.y);
      doc
        .font('Helvetica')
        .text(data.customerDevice.accessories.join(', '), 120, doc.y - 12);
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();
  }

  /**
   * Add Job Sheet Service Details
   */
  private addJobSheetServiceDetails(
    doc: PDFKit.PDFDocument,
    data: JobSheetData
  ): void {
    doc.fontSize(12).font('Helvetica-Bold').text('SERVICE DETAILS', 50, doc.y);
    doc.moveDown(0.5);

    if (data.faults && data.faults.length > 0) {
      doc.fontSize(10).font('Helvetica-Bold').text('Faults: ', 50, doc.y);
      const faultNames = data.faults.map(f => f.name).join(', ');
      doc.font('Helvetica').text(faultNames, 120, doc.y - 12, { width: 400 });
    }

    doc.font('Helvetica-Bold').text('Issue: ', 50, doc.y);
    doc.font('Helvetica').text(data.service.issue, 120, doc.y - 12, {
      width: 400,
    });

    if (data.service.diagnosis) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Diagnosis: ', 50, doc.y);
      doc.font('Helvetica').text(data.service.diagnosis, 120, doc.y - 12, {
        width: 400,
      });
    }

    if (data.technician) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Assigned To: ', 50, doc.y);
      doc.font('Helvetica').text(data.technician.name, 120, doc.y - 12);
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Cost Details
    doc.fontSize(12).font('Helvetica-Bold').text('COST DETAILS', 50, doc.y);
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold').text('Estimated Cost: ', 50, doc.y);
    doc
      .font('Helvetica')
      .text(`₹ ${data.service.estimatedCost.toFixed(2)}`, 150, doc.y - 12);

    doc.font('Helvetica-Bold').text('Advance Payment: ', 50, doc.y);
    doc
      .font('Helvetica')
      .text(`₹ ${data.service.advancePayment.toFixed(2)}`, 150, doc.y - 12);

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  }

  /**
   * Add Job Sheet Footer
   */
  private addJobSheetFooter(doc: PDFKit.PDFDocument, data: JobSheetData): void {
    doc.moveDown(2);

    // Terms & Conditions - use custom or default
    const termsAndConditions = data.template?.termsAndConditions ||
      '1. Advance payment is non-refundable.\n' +
      '2. Device must be collected within 7 days of completion.\n' +
      '3. Company is not responsible for data loss during repair.\n' +
      '4. Warranty: 30 days for parts and service.\n' +
      '5. Additional charges may apply for parts replacement.';

    doc.fontSize(10).font('Helvetica-Bold').text('TERMS & CONDITIONS:', 50, doc.y);
    doc.fontSize(8).font('Helvetica').text(termsAndConditions, 50, doc.y + 5);

    // Signature Section - show based on template settings
    const showCustomerSignature = data.template?.showCustomerSignature !== false;
    const showAuthorizedSignature = data.template?.showAuthorizedSignature !== false;

    if (showCustomerSignature || showAuthorizedSignature) {
      doc.moveDown(2);
      const sigY = doc.y;

      if (showCustomerSignature) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text('_____________________', 50, sigY + 30);
        doc.text('Customer Signature', 50, sigY + 45);
      }

      if (showAuthorizedSignature) {
        doc.text('_____________________', 350, sigY + 30);
        doc.text('Authorized Signature', 350, sigY + 45);
      }
    }

    // Footer note - use custom footer text or default
    const footerText = data.template?.footerText ||
      'This is a computer-generated job sheet. Please verify all details.';

    doc
      .fontSize(8)
      .font('Helvetica-Oblique')
      .text(footerText, 50, 750, { align: 'center' });
  }

  /**
   * Add Invoice Header
   */
  private addInvoiceHeader(doc: PDFKit.PDFDocument, data: InvoiceData): void {
    // Company Name
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(data.company.name, 50, 50, { align: 'center' });

    // Branch Info
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(data.branch.name, { align: 'center' })
      .text(data.branch.address, { align: 'center' })
      .text(`Phone: ${data.branch.phone} | Email: ${data.branch.email}`, {
        align: 'center',
      });

    if (data.company.gst) {
      doc.text(`GST: ${data.company.gst}`, { align: 'center' });
    }

    doc.moveDown();

    // Title
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('TAX INVOICE', { align: 'center' });

    doc.moveDown();

    // Invoice Number & Date
    const y = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`Invoice No: `, 50, y);
    doc.font('Helvetica').text(data.invoiceNumber, 150, y);

    doc.font('Helvetica-Bold').text(`Service Ticket: `, 50, y + 15);
    doc.font('Helvetica').text(data.service.ticketNumber, 150, y + 15);

    doc.font('Helvetica-Bold').text(`Invoice Date: `, 350, y);
    doc
      .font('Helvetica')
      .text(format(new Date(data.invoiceDate), 'dd/MM/yyyy'), 450, y);

    doc.font('Helvetica-Bold').text(`Service Date: `, 350, y + 15);
    doc
      .font('Helvetica')
      .text(format(new Date(data.service.createdAt), 'dd/MM/yyyy'), 450, y + 15);

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();
  }

  /**
   * Add Invoice Customer Info
   */
  private addInvoiceCustomerInfo(
    doc: PDFKit.PDFDocument,
    data: InvoiceData
  ): void {
    doc.fontSize(11).font('Helvetica-Bold').text('BILL TO:', 50, doc.y);
    doc.moveDown(0.3);

    doc.fontSize(10).font('Helvetica-Bold').text(data.customer.name, 50, doc.y);
    doc.font('Helvetica').text(data.customer.phone, 50, doc.y);

    if (data.customer.address) {
      doc.text(data.customer.address, 50, doc.y, { width: 200 });
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();
  }

  /**
   * Add Invoice Items Table
   */
  private addInvoiceItemsTable(
    doc: PDFKit.PDFDocument,
    data: InvoiceData
  ): void {
    const tableTop = doc.y;
    const itemHeight = 20;

    // Table Headers
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Description', 50, tableTop)
      .text('Device', 50, tableTop + itemHeight)
      .text('Issue', 50, tableTop + itemHeight * 2);

    doc
      .font('Helvetica')
      .text(data.service.deviceModel, 200, tableTop + itemHeight)
      .text(data.service.issue, 200, tableTop + itemHeight * 2, { width: 250 });

    // Service Charge
    let currentY = tableTop + itemHeight * 3 + 10;
    doc.moveTo(50, currentY).lineTo(545, currentY).stroke();
    currentY += 10;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Item', 50, currentY)
      .text('Qty', 300, currentY)
      .text('Rate', 370, currentY)
      .text('Amount', 480, currentY);

    currentY += 5;
    doc.moveTo(50, currentY).lineTo(545, currentY).stroke();
    currentY += 10;

    const serviceCost =
      data.service.actualCost ?? data.service.estimatedCost;

    doc
      .fontSize(9)
      .font('Helvetica')
      .text('Service Charge', 50, currentY)
      .text('1', 300, currentY)
      .text(`₹${serviceCost.toFixed(2)}`, 370, currentY)
      .text(`₹${serviceCost.toFixed(2)}`, 480, currentY);

    currentY += 15;

    // Parts
    if (data.parts && data.parts.length > 0) {
      for (const part of data.parts) {
        doc
          .text(part.partName, 50, currentY)
          .text(part.quantity.toString(), 300, currentY)
          .text(`₹${part.unitPrice.toFixed(2)}`, 370, currentY)
          .text(`₹${part.totalPrice.toFixed(2)}`, 480, currentY);

        currentY += 15;
      }
    }

    currentY += 5;
    doc.moveTo(50, currentY).lineTo(545, currentY).stroke();
  }

  /**
   * Add Invoice Payment Summary
   */
  private addInvoicePaymentSummary(
    doc: PDFKit.PDFDocument,
    data: InvoiceData
  ): void {
    doc.moveDown();
    const startY = doc.y;

    // Calculate GST (assuming 18% CGST + SGST)
    const subtotal = data.totalAmount / 1.18; // Remove GST
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Subtotal:', 370, startY)
      .text(`₹${subtotal.toFixed(2)}`, 480, startY);

    doc
      .text('CGST (9%):', 370, startY + 15)
      .text(`₹${cgst.toFixed(2)}`, 480, startY + 15);

    doc
      .text('SGST (9%):', 370, startY + 30)
      .text(`₹${sgst.toFixed(2)}`, 480, startY + 30);

    doc.moveTo(370, startY + 45).lineTo(545, startY + 45).stroke();

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total Amount:', 370, startY + 50)
      .text(`₹${data.totalAmount.toFixed(2)}`, 480, startY + 50);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Paid Amount:', 370, startY + 70)
      .text(`₹${data.paidAmount.toFixed(2)}`, 480, startY + 70);

    doc
      .font('Helvetica-Bold')
      .text('Balance Due:', 370, startY + 85)
      .text(`₹${data.balanceAmount.toFixed(2)}`, 480, startY + 85);

    // Payment Status Badge
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`Status: ${data.paymentStatus}`, 370, startY + 105);

    doc.moveDown(2);
  }

  /**
   * Add Invoice Payment History
   */
  private addInvoicePaymentHistory(
    doc: PDFKit.PDFDocument,
    data: InvoiceData
  ): void {
    doc.moveDown();
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('PAYMENT HISTORY', 50, doc.y);
    doc.moveDown(0.5);

    const tableTop = doc.y;
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Date', 50, tableTop)
      .text('Amount', 200, tableTop)
      .text('Method', 300, tableTop)
      .text('Transaction ID', 400, tableTop);

    let currentY = tableTop + 15;

    if (data.payments) {
      for (const payment of data.payments) {
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(format(new Date(payment.createdAt), 'dd/MM/yyyy'), 50, currentY)
          .text(`₹${payment.amount.toFixed(2)}`, 200, currentY)
          .text(payment.paymentMethod, 300, currentY)
          .text(payment.transactionId || 'N/A', 400, currentY);

        currentY += 15;
      }
    }

    doc.moveDown();
  }

  /**
   * Add Invoice Footer
   */
  private addInvoiceFooter(doc: PDFKit.PDFDocument, data: InvoiceData): void {
    // Terms & Conditions
    doc.fontSize(8).font('Helvetica-Bold').text('Terms & Conditions:', 50, 680);
    doc.fontSize(7).font('Helvetica').text(
      'Payment is due upon receipt. Warranty: 30 days for parts and service. ' +
        'This invoice is computer-generated and requires no signature.',
      50,
      690,
      { width: 500 }
    );

    // Thank you message
    doc
      .fontSize(10)
      .font('Helvetica-BoldOblique')
      .text('Thank you for your business!', 50, 750, { align: 'center' });

    // Footer
    doc
      .fontSize(7)
      .font('Helvetica')
      .text(
        `Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`,
        50,
        770,
        { align: 'center' }
      );
  }

  /**
   * Generate Estimate PDF
   */
  async generateEstimatePDF(data: EstimateData, format: string = 'A4'): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const formatSuffix = format.toUpperCase();
        const fileName = `estimate_${data.estimateNumber}_${formatSuffix}_${Date.now()}.pdf`;
        const filePath = path.join(this.uploadDir, 'estimates', fileName);

        // Configure page size based on format
        let docOptions: any = {};
        switch (format.toLowerCase()) {
          case 'a5':
            docOptions = { size: 'A5', margin: 30 };
            break;
          case 'thermal-2':
            docOptions = { size: [144, 720], margin: 5 }; // 2 inch width (144 points)
            break;
          case 'thermal-3':
            docOptions = { size: [216, 720], margin: 10 }; // 3 inch width (216 points)
            break;
          case 'a4':
          default:
            docOptions = { size: 'A4', margin: 50 };
            break;
        }

        const doc = new PDFDocument(docOptions);
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Header
        this.addEstimateHeader(doc, data);

        // Customer Info
        this.addEstimateCustomerInfo(doc, data);

        // Items Table
        this.addEstimateItemsTable(doc, data);

        // Total Summary
        this.addEstimateTotalSummary(doc, data);

        // Footer
        this.addEstimateFooter(doc, data);

        doc.end();

        stream.on('finish', () => {
          resolve(`${this.baseUrl}/uploads/estimates/${fileName}`);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add Estimate Header
   */
  private addEstimateHeader(doc: PDFKit.PDFDocument, data: EstimateData): void {
    // Company Name
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(data.company.name, 50, 50, { align: 'center' });

    // Branch Info
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(data.branch.name, { align: 'center' })
      .text(data.branch.address, { align: 'center' })
      .text(`Phone: ${data.branch.phone} | Email: ${data.branch.email}`, {
        align: 'center',
      });

    if (data.company.gst) {
      doc.text(`GST: ${data.company.gst}`, { align: 'center' });
    }

    doc.moveDown();

    // Title
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('ESTIMATE / QUOTATION', { align: 'center' });

    doc.moveDown();

    // Estimate Number & Date
    const y = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`Estimate No: `, 50, y);
    doc.font('Helvetica').text(data.estimateNumber, 150, y);

    doc.font('Helvetica-Bold').text(`Date: `, 350, y);
    doc
      .font('Helvetica')
      .text(format(new Date(data.estimateDate), 'dd/MM/yyyy'), 400, y);

    if (data.validUntil) {
      doc.font('Helvetica-Bold').text(`Valid Until: `, 350, y + 15);
      doc
        .font('Helvetica')
        .text(format(new Date(data.validUntil), 'dd/MM/yyyy'), 430, y + 15);
    }

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();
  }

  /**
   * Add Estimate Customer Info
   */
  private addEstimateCustomerInfo(
    doc: PDFKit.PDFDocument,
    data: EstimateData
  ): void {
    const startY = doc.y;

    // Customer Details
    doc.fontSize(11).font('Helvetica-Bold').text('ESTIMATE FOR:', 50, startY);
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold').text('Name: ', 50, doc.y);
    doc.font('Helvetica').text(data.customer.name, 120, doc.y - 12);

    doc.font('Helvetica-Bold').text('Phone: ', 50, doc.y);
    doc.font('Helvetica').text(data.customer.phone, 120, doc.y - 12);

    if (data.customer.email) {
      doc.font('Helvetica-Bold').text('Email: ', 50, doc.y);
      doc.font('Helvetica').text(data.customer.email, 120, doc.y - 12);
    }

    if (data.customer.address) {
      doc.font('Helvetica-Bold').text('Address: ', 50, doc.y);
      doc.font('Helvetica').text(data.customer.address, 120, doc.y - 12, {
        width: 200,
      });
    }

    // Service Info (if available)
    if (data.service) {
      doc.moveDown();
      doc.fontSize(11).font('Helvetica-Bold').text('SERVICE DETAILS:', 50, doc.y);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').text('Ticket: ', 50, doc.y);
      doc.font('Helvetica').text(data.service.ticketNumber, 120, doc.y - 12);

      doc.font('Helvetica-Bold').text('Device: ', 50, doc.y);
      doc.font('Helvetica').text(data.service.deviceModel, 120, doc.y - 12);

      doc.font('Helvetica-Bold').text('Issue: ', 50, doc.y);
      doc.font('Helvetica').text(data.service.issue, 120, doc.y - 12, {
        width: 400,
      });
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();
  }

  /**
   * Add Estimate Items Table
   */
  private addEstimateItemsTable(
    doc: PDFKit.PDFDocument,
    data: EstimateData
  ): void {
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('ESTIMATED COSTS', 50, doc.y);
    doc.moveDown(0.5);

    // Table Headers
    const tableTop = doc.y;
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Description', 50, tableTop)
      .text('Qty', 320, tableTop)
      .text('Unit Price', 380, tableTop)
      .text('Amount', 480, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    let currentY = tableTop + 20;

    // Items
    for (const item of data.items) {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(item.description, 50, currentY, { width: 260 })
        .text(item.quantity.toString(), 320, currentY)
        .text(`₹${item.unitPrice.toFixed(2)}`, 380, currentY)
        .text(`₹${item.amount.toFixed(2)}`, 480, currentY);

      currentY += 20;
    }

    doc.moveTo(50, currentY).lineTo(545, currentY).stroke();
    doc.y = currentY + 10;
  }

  /**
   * Add Estimate Total Summary
   */
  private addEstimateTotalSummary(
    doc: PDFKit.PDFDocument,
    data: EstimateData
  ): void {
    const startY = doc.y;

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Subtotal:', 370, startY)
      .text(`₹${data.subtotal.toFixed(2)}`, 480, startY);

    if (data.taxAmount > 0) {
      const cgst = data.taxAmount / 2;
      const sgst = data.taxAmount / 2;

      doc
        .text('CGST (9%):', 370, startY + 15)
        .text(`₹${cgst.toFixed(2)}`, 480, startY + 15);

      doc
        .text('SGST (9%):', 370, startY + 30)
        .text(`₹${sgst.toFixed(2)}`, 480, startY + 30);
    }

    doc.moveTo(370, startY + 45).lineTo(545, startY + 45).stroke();

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total Estimate:', 370, startY + 50)
      .text(`₹${data.totalAmount.toFixed(2)}`, 480, startY + 50);

    doc.moveDown(2);

    if (data.notes) {
      doc.fontSize(10).font('Helvetica-Bold').text('Notes:', 50, doc.y);
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica').text(data.notes, 50, doc.y, {
        width: 495,
      });
      doc.moveDown();
    }
  }

  /**
   * Add Estimate Footer
   */
  private addEstimateFooter(doc: PDFKit.PDFDocument, data: EstimateData): void {
    // Terms & Conditions
    doc.fontSize(8).font('Helvetica-Bold').text('Terms & Conditions:', 50, 680);
    doc.fontSize(7).font('Helvetica').text(
      'This is an estimate only. Actual costs may vary. ' +
        'Estimate is valid for the specified period. ' +
        'Final invoice will be generated upon service completion.',
      50,
      690,
      { width: 500 }
    );

    // Thank you message
    doc
      .fontSize(10)
      .font('Helvetica-BoldOblique')
      .text('Thank you for considering our services!', 50, 750, { align: 'center' });

    // Footer
    doc
      .fontSize(7)
      .font('Helvetica')
      .text(
        `Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`,
        50,
        770,
        { align: 'center' }
      );
  }
}

export default new PDFGenerationService();
