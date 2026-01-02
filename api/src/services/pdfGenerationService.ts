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
  website?: string | null;
}

// Copy type for job sheet generation
type JobSheetCopyType = 'customer' | 'office' | 'both';

// Tagged part (included in estimate)
interface TaggedPart {
  id?: string;
  partName: string;
  partNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  faultTag?: string;
}

// Extra spare part (requires customer approval)
interface ExtraSparePart {
  id?: string;
  partName: string;
  partNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isApproved: boolean;
  approvalMethod?: string; // PHONE_CALL | WHATSAPP | IN_PERSON | SMS
  approvalNote?: string;
  approvedAt?: Date;
}

// Accessory received with device
interface AccessoryItem {
  id?: string;
  name: string;
  received?: boolean;
}

// Damage condition noted at intake
interface DamageConditionItem {
  id?: string;
  name: string;
}

interface JobSheetData {
  jobSheetNumber: string;
  copyType?: JobSheetCopyType;
  service: {
    ticketNumber: string;
    createdAt: Date;
    deviceModel: string;
    deviceIMEI?: string;
    devicePassword?: string;
    devicePattern?: string;
    deviceCondition?: string; // "on" | "off"
    intakeNotes?: string;
    issue: string;
    diagnosis?: string;
    estimatedCost: number;
    labourCharge?: number;
    extraSpareAmount?: number;
    discount?: number;
    advancePayment: number;
    actualCost?: number;
    isWarrantyRepair?: boolean;
    warrantyReason?: string;
    isRepeatedService?: boolean;
    dataWarrantyAccepted?: boolean;
  };
  customer: {
    name: string;
    phone: string;
    address?: string;
    email?: string;
    whatsappNumber?: string;
    gstin?: string;
    idProofType?: string;
  };
  customerDevice?: {
    brandName?: string;
    modelName?: string;
    color?: string;
    imei?: string;
  };
  accessories?: AccessoryItem[];
  damageConditions?: DamageConditionItem[];
  faults?: Array<{
    id?: string;
    name: string;
  }>;
  taggedParts?: TaggedPart[];
  extraSpareParts?: ExtraSparePart[];
  branch: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  company: CompanyInfo;
  technician?: {
    id?: string;
    name: string;
  };
  createdBy?: {
    id?: string;
    name: string;
  };
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
   * Generate Job Sheet PDF with format support (A4, A5, Thermal) and copy type
   */
  async generateJobSheetPDF(data: JobSheetData, format: string = 'A4', copyType: JobSheetCopyType = 'customer'): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const formatSuffix = format.toUpperCase();
        const copySuffix = copyType.toUpperCase();
        const fileName = `jobsheet_${data.jobSheetNumber}_${formatSuffix}_${copySuffix}_${Date.now()}.pdf`;
        const filePath = path.join(this.uploadDir, 'jobsheets', fileName);

        // Configure page size based on format
        let docOptions: any = {};
        let isThermal = false;
        switch (format.toLowerCase()) {
          case 'a5':
            docOptions = { size: 'A5', margin: 25 };
            break;
          case 'thermal':
          case 'thermal-3':
            docOptions = { size: [216, 800], margin: 8 }; // 3 inch width (216 points), auto height
            isThermal = true;
            break;
          case 'thermal-2':
            docOptions = { size: [144, 800], margin: 5 }; // 2 inch width (144 points)
            isThermal = true;
            break;
          case 'a4':
          default:
            docOptions = { size: 'A4', margin: 30 };
            break;
        }

        const doc = new PDFDocument(docOptions);
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Set copy type in data for rendering
        data.copyType = copyType;

        if (isThermal) {
          // Thermal receipt format
          if (copyType === 'both') {
            this.addJobSheetThermalCustomer(doc, data, format);
            // Add page break for office copy
            doc.addPage();
            this.addJobSheetThermalOffice(doc, data, format);
          } else if (copyType === 'office') {
            this.addJobSheetThermalOffice(doc, data, format);
          } else {
            this.addJobSheetThermalCustomer(doc, data, format);
          }
        } else if (format.toLowerCase() === 'a5') {
          // A5 compact format
          if (copyType === 'both') {
            this.addJobSheetA5Customer(doc, data);
            doc.addPage();
            this.addJobSheetA5Office(doc, data);
          } else if (copyType === 'office') {
            this.addJobSheetA5Office(doc, data);
          } else {
            this.addJobSheetA5Customer(doc, data);
          }
        } else {
          // A4 format
          if (copyType === 'both') {
            // Check if content fits in 60/40 split or needs separate pages
            const needsSeparatePages = this.calculateA4ContentHeight(data) > 480; // ~60% of page

            if (needsSeparatePages) {
              // Separate pages for each copy
              this.addJobSheetA4CustomerFull(doc, data);
              doc.addPage();
              this.addJobSheetA4OfficeFull(doc, data);
            } else {
              // Combined layout (60/40 split)
              this.addJobSheetA4BothCopies(doc, data);
            }
          } else if (copyType === 'office') {
            this.addJobSheetA4OfficeFull(doc, data);
          } else {
            this.addJobSheetA4CustomerFull(doc, data);
          }
        }

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
   * Calculate estimated content height for A4 customer copy
   */
  private calculateA4ContentHeight(data: JobSheetData): number {
    let height = 0;

    // Header section
    height += 100;

    // Customer & Device details
    height += 120;

    // Accessories
    if (data.accessories && data.accessories.length > 0) {
      height += 40;
    }

    // Damage conditions
    if (data.damageConditions && data.damageConditions.length > 0) {
      height += 30 + (data.damageConditions.length * 12);
    }

    // Faults
    if (data.faults && data.faults.length > 0) {
      height += 30 + (data.faults.length * 15);
    }

    // Tagged parts
    if (data.taggedParts && data.taggedParts.length > 0) {
      height += 40 + (data.taggedParts.length * 18);
    }

    // Extra spare parts
    if (data.extraSpareParts && data.extraSpareParts.length > 0) {
      height += 40 + (data.extraSpareParts.length * 20);
    }

    // Cost summary
    height += 120;

    // Terms & Signatures
    height += 100;

    return height;
  }

  /**
   * Helper: Format approval method for display
   */
  private formatApprovalMethod(method?: string): string {
    const methods: Record<string, string> = {
      'PHONE_CALL': 'Phone',
      'WHATSAPP': 'WhatsApp',
      'IN_PERSON': 'In Person',
      'SMS': 'SMS',
      'WARRANTY_INTERNAL': 'Warranty',
    };
    return method ? (methods[method] || method) : '';
  }

  /**
   * Helper: Calculate total costs
   */
  private calculateTotals(data: JobSheetData): {
    taggedPartsTotal: number;
    extraSpareTotal: number;
    subtotal: number;
    totalAmount: number;
    balanceDue: number;
  } {
    const taggedPartsTotal = data.taggedParts?.reduce((sum, p) => sum + p.totalPrice, 0) || 0;
    const extraSpareTotal = data.extraSpareParts?.reduce((sum, p) => sum + p.totalPrice, 0) || 0;
    const labourCharge = data.service.labourCharge || 0;
    const discount = data.service.discount || 0;
    const estimatedCost = data.service.estimatedCost || 0;

    const subtotal = estimatedCost + labourCharge + extraSpareTotal;
    const totalAmount = subtotal - discount;
    const balanceDue = totalAmount - data.service.advancePayment;

    return { taggedPartsTotal, extraSpareTotal, subtotal, totalAmount, balanceDue };
  }

  /**
   * A4 Customer Copy - Full Page Layout
   */
  private addJobSheetA4CustomerFull(doc: PDFKit.PDFDocument, data: JobSheetData): void {
    const margin = 30;
    const pageWidth = 595;
    const contentWidth = pageWidth - (margin * 2);
    const totals = this.calculateTotals(data);

    let yPos = 30;

    // ===== HEADER SECTION =====
    // Company Logo & Name
    if (data.template?.showCompanyLogo !== false) {
      doc.fontSize(18).font('Helvetica-Bold')
        .text(data.company.name, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 22;

      doc.fontSize(10).font('Helvetica')
        .fillColor('#0d9488')
        .text('SERVICE CENTER', margin, yPos, { width: contentWidth, align: 'center' });
      doc.fillColor('#000000');
      yPos += 15;
    }

    // Contact Details
    if (data.template?.showContactDetails !== false) {
      doc.fontSize(9).font('Helvetica')
        .text(data.branch.address || data.company.address, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 12;
      doc.text(`Ph: ${data.branch.phone || data.company.phone}`, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 12;
      if (data.company.gst) {
        doc.text(`GST: ${data.company.gst}`, margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 12;
      }
    }

    // Title Bar
    yPos += 5;
    doc.rect(margin, yPos, contentWidth, 24).fill('#0d9488');
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff')
      .text('SERVICE JOB SHEET', margin, yPos + 6, { width: contentWidth, align: 'center' });
    doc.fillColor('#000000');
    yPos += 32;

    // Warranty Badge (if applicable)
    if (data.service.isWarrantyRepair) {
      doc.rect(margin, yPos, contentWidth, 20).fill('#fef3c7');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#92400e')
        .text('** WARRANTY REPAIR **', margin, yPos + 5, { width: contentWidth, align: 'center' });
      doc.fillColor('#000000');
      yPos += 25;
    }

    // ===== JOB INFO ROW =====
    const jobInfoY = yPos;
    doc.fontSize(8).font('Helvetica').fillColor('#666666').text('JOB NUMBER', margin, yPos);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0d9488')
      .text(data.jobSheetNumber, margin, yPos + 10);

    doc.fontSize(8).font('Helvetica').fillColor('#666666').text('TICKET ID', margin + 180, yPos);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
      .text(data.service.ticketNumber, margin + 180, yPos + 10);

    doc.fontSize(8).font('Helvetica').fillColor('#666666').text('DATE IN', margin + 350, yPos);
    doc.fontSize(10).font('Helvetica').fillColor('#000000')
      .text(format(new Date(data.service.createdAt), 'dd/MM/yyyy HH:mm'), margin + 350, yPos + 10);
    yPos += 35;

    // Divider
    doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).lineWidth(0.5).stroke('#cccccc');
    yPos += 10;

    // ===== TWO COLUMN LAYOUT: CUSTOMER & DEVICE =====
    const colWidth = (contentWidth - 20) / 2;
    const leftCol = margin;
    const rightCol = margin + colWidth + 20;
    const sectionStartY = yPos;

    // Customer Details (Left Column)
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
      .text('CUSTOMER DETAILS', leftCol, yPos);
    yPos += 15;

    doc.fontSize(8).font('Helvetica').fillColor('#666666').text('CUSTOMER NAME', leftCol, yPos);
    yPos += 10;
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text(data.customer.name, leftCol, yPos);
    yPos += 15;

    doc.fontSize(8).font('Helvetica').fillColor('#666666').text('PHONE NUMBER', leftCol, yPos);
    yPos += 10;
    doc.fontSize(10).font('Helvetica').fillColor('#000000').text(data.customer.phone, leftCol, yPos);
    yPos += 15;

    if (data.customer.address) {
      doc.fontSize(8).font('Helvetica').fillColor('#666666').text('ADDRESS', leftCol, yPos);
      yPos += 10;
      doc.fontSize(9).font('Helvetica').fillColor('#000000')
        .text(data.customer.address, leftCol, yPos, { width: colWidth });
      yPos += 25;
    }

    // Device Details (Right Column)
    let rightY = sectionStartY;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
      .text('DEVICE DETAILS', rightCol, rightY);
    rightY += 15;

    doc.fontSize(8).font('Helvetica').fillColor('#666666').text('DEVICE / MODEL', rightCol, rightY);
    rightY += 10;
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text(data.service.deviceModel, rightCol, rightY);
    rightY += 15;

    if (data.service.deviceIMEI) {
      doc.fontSize(8).font('Helvetica').fillColor('#666666').text('IMEI', rightCol, rightY);
      rightY += 10;
      doc.fontSize(10).font('Helvetica').fillColor('#000000').text(data.service.deviceIMEI, rightCol, rightY);
      rightY += 15;
    }

    if (data.service.devicePassword) {
      doc.fontSize(8).font('Helvetica').fillColor('#666666').text('PASSWORD', rightCol, rightY);
      rightY += 10;
      doc.fontSize(10).font('Helvetica').fillColor('#000000').text(data.service.devicePassword, rightCol, rightY);
      rightY += 15;
    }

    if (data.customerDevice?.color) {
      doc.fontSize(8).font('Helvetica').fillColor('#666666').text('COLOR', rightCol, rightY);
      rightY += 10;
      doc.fontSize(10).font('Helvetica').fillColor('#000000').text(data.customerDevice.color, rightCol, rightY);
      rightY += 15;
    }

    yPos = Math.max(yPos, rightY) + 10;

    // ===== ACCESSORIES (if any) =====
    if (data.accessories && data.accessories.length > 0) {
      doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).lineWidth(0.5).stroke('#cccccc');
      yPos += 10;

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333').text('ACCESSORIES RECEIVED', margin, yPos);
      yPos += 15;

      const accessoryText = data.accessories.map(a => `☑ ${a.name}`).join('   ');
      doc.fontSize(9).font('Helvetica').fillColor('#000000').text(accessoryText, margin, yPos, { width: contentWidth });
      yPos += 15;
    }

    // ===== PRE-EXISTING DAMAGE (if any) =====
    if (data.damageConditions && data.damageConditions.length > 0) {
      doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).lineWidth(0.5).stroke('#cccccc');
      yPos += 10;

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333').text('PRE-EXISTING DAMAGE', margin, yPos);
      yPos += 15;

      data.damageConditions.forEach(d => {
        doc.fontSize(9).font('Helvetica').fillColor('#000000').text(`• ${d.name}`, margin + 10, yPos);
        yPos += 12;
      });
      yPos += 5;
    }

    // ===== FAULTS / ISSUES =====
    doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).lineWidth(0.5).stroke('#cccccc');
    yPos += 10;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text('FAULTS / ISSUES', margin, yPos);
    yPos += 15;

    if (data.faults && data.faults.length > 0) {
      data.faults.forEach(f => {
        doc.fontSize(9).font('Helvetica').fillColor('#dc2626').text('●', margin + 5, yPos);
        doc.fillColor('#000000').text(f.name, margin + 20, yPos);
        yPos += 14;
      });
    }

    if (data.service.issue) {
      doc.fontSize(8).font('Helvetica').fillColor('#666666').text('Customer Complaint:', margin, yPos);
      yPos += 10;
      doc.fontSize(9).font('Helvetica').fillColor('#000000')
        .text(data.service.issue, margin + 10, yPos, { width: contentWidth - 20 });
      yPos += 20;
    }

    // ===== TAGGED PARTS =====
    if (data.taggedParts && data.taggedParts.length > 0) {
      doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).lineWidth(0.5).stroke('#cccccc');
      yPos += 10;

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text('🏷️ TAGGED PARTS (Included in Estimate)', margin, yPos);
      yPos += 15;

      // Table Header
      doc.rect(margin, yPos, contentWidth, 18).fill('#f3f4f6');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
      doc.text('#', margin + 5, yPos + 5);
      doc.text('PART NAME', margin + 25, yPos + 5);
      if (data.taggedParts.some(p => p.partNumber)) {
        doc.text('SKU', margin + 250, yPos + 5);
      }
      doc.text('QTY', margin + 350, yPos + 5);
      doc.text('AMOUNT', margin + 420, yPos + 5);
      yPos += 20;

      // Table Rows
      data.taggedParts.forEach((part, index) => {
        doc.fontSize(9).font('Helvetica').fillColor('#000000');
        doc.text(String(index + 1), margin + 5, yPos);
        doc.text(part.partName, margin + 25, yPos, { width: 200 });
        if (part.partNumber) {
          doc.fontSize(8).fillColor('#666666').text(part.partNumber, margin + 250, yPos);
        }
        doc.fontSize(9).fillColor('#000000');
        doc.text(String(part.quantity), margin + 355, yPos);
        doc.text(`Rs.${part.totalPrice.toFixed(0)}`, margin + 420, yPos);
        yPos += 16;
      });

      // Tagged Parts Total
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333')
        .text(`Tagged Parts Total: Rs.${totals.taggedPartsTotal.toFixed(0)}`, margin + 350, yPos);
      yPos += 20;
    }

    // ===== EXTRA SPARE PARTS =====
    if (data.extraSpareParts && data.extraSpareParts.length > 0) {
      doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).lineWidth(0.5).stroke('#cccccc');
      yPos += 10;

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text('EXTRA SPARE PARTS (Customer Approved)', margin, yPos);
      yPos += 15;

      // Table Header
      doc.rect(margin, yPos, contentWidth, 18).fill('#fef3c7');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#92400e');
      doc.text('#', margin + 5, yPos + 5);
      doc.text('PART NAME', margin + 25, yPos + 5);
      doc.text('QTY', margin + 280, yPos + 5);
      doc.text('AMOUNT', margin + 330, yPos + 5);
      doc.text('APPROVED', margin + 420, yPos + 5);
      yPos += 20;

      // Table Rows
      data.extraSpareParts.forEach((part, index) => {
        doc.fontSize(9).font('Helvetica').fillColor('#000000');
        doc.text(String(index + 1), margin + 5, yPos);
        doc.text(part.partName, margin + 25, yPos, { width: 230 });
        doc.text(String(part.quantity), margin + 285, yPos);
        doc.text(`Rs.${part.totalPrice.toFixed(0)}`, margin + 330, yPos);

        // Approval status with icon
        if (part.isApproved) {
          doc.fontSize(8).fillColor('#16a34a')
            .text(`[Y] ${this.formatApprovalMethod(part.approvalMethod)}`, margin + 415, yPos);
        } else {
          doc.fontSize(8).fillColor('#dc2626').text('[N] Pending', margin + 415, yPos);
        }
        doc.fillColor('#000000');
        yPos += 18;
      });

      // Extra Spare Total
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#92400e')
        .text(`Extra Spare Total: Rs.${totals.extraSpareTotal.toFixed(0)}`, margin + 330, yPos);
      doc.fillColor('#000000');
      yPos += 20;
    }

    // ===== COST SUMMARY & TERMS (Side by Side) =====
    doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).lineWidth(0.5).stroke('#cccccc');
    yPos += 10;

    const termsColWidth = contentWidth * 0.55;
    const costColWidth = contentWidth * 0.42;
    const costColX = margin + termsColWidth + 15;

    // Terms & Conditions (Left)
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333').text('TERMS & CONDITIONS', margin, yPos);
    const termsY = yPos + 15;
    const terms = data.template?.termsAndConditions ||
      '• Advance payment is strictly non-refundable.\n• Device must be collected within 7 days of service completion.\n• Company is not responsible for data loss. Please backup data.\n• Warranty: 30 days (Parts), 15 days (Labor).\n• Additional charges apply for hidden faults found during service.';

    doc.fontSize(7).font('Helvetica').fillColor('#333333')
      .text(terms, margin, termsY, { width: termsColWidth - 10 });

    // Cost Summary (Right)
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333').text('COST SUMMARY', costColX, yPos);
    let costY = yPos + 15;

    const costItems = [
      { label: 'Estimated Cost', value: data.service.estimatedCost },
      { label: 'Labour Charge', value: data.service.labourCharge || 0 },
      { label: 'Extra Spare Parts', value: totals.extraSpareTotal },
    ];

    if (data.service.discount && data.service.discount > 0) {
      costItems.push({ label: 'Discount', value: -data.service.discount });
    }

    costItems.forEach(item => {
      doc.fontSize(9).font('Helvetica').fillColor('#333333');
      doc.text(item.label, costColX, costY);
      doc.text(`Rs.${Math.abs(item.value).toFixed(2)}`, costColX + costColWidth - 80, costY, { align: 'right', width: 80 });
      costY += 14;
    });

    // Divider
    doc.moveTo(costColX, costY).lineTo(costColX + costColWidth, costY).lineWidth(0.5).stroke('#cccccc');
    costY += 8;

    // Total Amount
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333');
    doc.text('TOTAL AMOUNT', costColX, costY);
    doc.fontSize(11).fillColor('#0d9488')
      .text(`Rs.${totals.totalAmount.toFixed(2)}`, costColX + costColWidth - 80, costY, { align: 'right', width: 80 });
    costY += 16;

    // Advance & Balance
    doc.fontSize(9).font('Helvetica').fillColor('#333333');
    doc.text('Advance Paid', costColX, costY);
    doc.text(`Rs.${data.service.advancePayment.toFixed(2)}`, costColX + costColWidth - 80, costY, { align: 'right', width: 80 });
    costY += 14;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#dc2626');
    doc.text('BALANCE DUE', costColX, costY);
    doc.text(`Rs.${totals.balanceDue.toFixed(2)}`, costColX + costColWidth - 80, costY, { align: 'right', width: 80 });

    yPos = Math.max(yPos + 100, costY + 20);

    // ===== SIGNATURES =====
    doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).lineWidth(0.5).stroke('#cccccc');
    yPos += 20;

    if (data.template?.showCustomerSignature !== false) {
      doc.fontSize(8).font('Helvetica').fillColor('#666666')
        .text('_______________________________', margin, yPos);
      doc.text('CUSTOMER SIGNATURE', margin, yPos + 12);
      doc.fontSize(7).text('I agree to terms and conditions', margin, yPos + 22);
    }

    if (data.template?.showAuthorizedSignature !== false) {
      doc.fontSize(8).font('Helvetica').fillColor('#666666')
        .text('_______________________________', pageWidth - margin - 150, yPos);
      doc.text('AUTHORIZED SIGNATURE', pageWidth - margin - 150, yPos + 12);
      doc.fontSize(7).text(`For ${data.company.name}`, pageWidth - margin - 150, yPos + 22);
    }

    // ===== FOOTER =====
    const footerText = data.template?.footerText || 'Thank you for choosing our services!';
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666666')
      .text(footerText, margin, 800, { width: contentWidth, align: 'center' });

    if (data.company.website) {
      doc.text(data.company.website, margin, 812, { width: contentWidth, align: 'center' });
    }
  }

  /**
   * A4 Office Copy - Full Page Layout (No company header)
   */
  private addJobSheetA4OfficeFull(doc: PDFKit.PDFDocument, data: JobSheetData): void {
    const margin = 30;
    const pageWidth = 595;
    const contentWidth = pageWidth - (margin * 2);
    const totals = this.calculateTotals(data);

    let yPos = 30;

    // ===== HEADER - OFFICE COPY BADGE =====
    doc.rect(margin, yPos, contentWidth, 35).fill('#1f2937');
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
      .text('SERVICE JOB SHEET', margin, yPos + 8, { width: contentWidth, align: 'center' });
    doc.fontSize(10).fillColor('#9ca3af')
      .text('OFFICE COPY', margin, yPos + 22, { width: contentWidth, align: 'center' });
    doc.fillColor('#000000');
    yPos += 45;

    // Warranty Badge (if applicable)
    if (data.service.isWarrantyRepair) {
      doc.rect(margin, yPos, contentWidth, 20).fill('#fef3c7');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#92400e')
        .text('** WARRANTY REPAIR **', margin, yPos + 5, { width: contentWidth, align: 'center' });
      doc.fillColor('#000000');
      yPos += 25;
    }

    // ===== JOB INFO GRID =====
    doc.rect(margin, yPos, contentWidth, 50).fill('#f9fafb');

    const col1X = margin + 10;
    const col2X = margin + 150;
    const col3X = margin + 300;
    const col4X = margin + 430;

    doc.fontSize(7).font('Helvetica').fillColor('#666666');
    doc.text('JOB NUMBER', col1X, yPos + 8);
    doc.text('TICKET ID', col2X, yPos + 8);
    doc.text('DATE & TIME', col3X, yPos + 8);
    doc.text('TECHNICIAN', col4X, yPos + 8);

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
    doc.text(data.jobSheetNumber, col1X, yPos + 20);
    doc.text(data.service.ticketNumber, col2X, yPos + 20);
    doc.text(format(new Date(data.service.createdAt), 'dd/MM/yyyy HH:mm'), col3X, yPos + 20);
    doc.text(data.technician?.name || 'Unassigned', col4X, yPos + 20);

    doc.fontSize(7).fillColor('#666666');
    doc.text(`Branch: ${data.branch.name}`, col1X, yPos + 36);
    yPos += 60;

    // ===== TWO COLUMN: CUSTOMER & DEVICE =====
    const colWidth = (contentWidth - 20) / 2;
    const leftCol = margin;
    const rightCol = margin + colWidth + 20;

    // Customer Info Box
    doc.rect(leftCol, yPos, colWidth, 100).fill('#f9fafb');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333')
      .text('CUSTOMER INFORMATION', leftCol + 10, yPos + 8);

    let leftY = yPos + 25;
    doc.fontSize(8).font('Helvetica').fillColor('#666666').text('Name:', leftCol + 10, leftY);
    doc.font('Helvetica-Bold').fillColor('#000000').text(data.customer.name, leftCol + 60, leftY);
    leftY += 14;

    doc.font('Helvetica').fillColor('#666666').text('Phone:', leftCol + 10, leftY);
    doc.fillColor('#000000').text(data.customer.phone, leftCol + 60, leftY);

    if (data.customer.whatsappNumber && data.customer.whatsappNumber !== data.customer.phone) {
      doc.text(` | WA: ${data.customer.whatsappNumber}`, leftCol + 130, leftY);
    }
    leftY += 14;

    if (data.customer.address) {
      doc.font('Helvetica').fillColor('#666666').text('Address:', leftCol + 10, leftY);
      doc.fillColor('#000000').text(data.customer.address, leftCol + 60, leftY, { width: colWidth - 70 });
    }

    // Device Info Box
    doc.rect(rightCol, yPos, colWidth, 100).fill('#f9fafb');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333')
      .text('DEVICE INFORMATION', rightCol + 10, yPos + 8);

    let rightY = yPos + 25;
    doc.fontSize(8).font('Helvetica').fillColor('#666666').text('Model:', rightCol + 10, rightY);
    doc.font('Helvetica-Bold').fillColor('#000000').text(data.service.deviceModel, rightCol + 60, rightY);
    rightY += 14;

    if (data.service.deviceIMEI) {
      doc.font('Helvetica').fillColor('#666666').text('IMEI:', rightCol + 10, rightY);
      doc.fillColor('#000000').text(data.service.deviceIMEI, rightCol + 60, rightY);
      rightY += 14;
    }

    if (data.service.devicePassword) {
      doc.font('Helvetica').fillColor('#666666').text('PWD:', rightCol + 10, rightY);
      doc.fillColor('#000000').text(data.service.devicePassword, rightCol + 60, rightY);

      if (data.customerDevice?.color) {
        doc.fillColor('#666666').text('Color:', rightCol + 130, rightY);
        doc.fillColor('#000000').text(data.customerDevice.color, rightCol + 170, rightY);
      }
    }

    yPos += 110;

    // ===== ACCESSORIES & DAMAGE =====
    if ((data.accessories && data.accessories.length > 0) || (data.damageConditions && data.damageConditions.length > 0)) {
      doc.rect(margin, yPos, contentWidth, 35).fill('#f9fafb');

      if (data.accessories && data.accessories.length > 0) {
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333').text('Accessories:', margin + 10, yPos + 8);
        doc.font('Helvetica').fillColor('#000000')
          .text(data.accessories.map(a => `☑ ${a.name}`).join('  '), margin + 80, yPos + 8, { width: 200 });
      }

      if (data.damageConditions && data.damageConditions.length > 0) {
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333').text('Pre-damage:', margin + 10, yPos + 22);
        doc.font('Helvetica').fillColor('#dc2626')
          .text(data.damageConditions.map(d => d.name).join(', '), margin + 80, yPos + 22, { width: 430 });
      }

      yPos += 40;
    }

    // ===== FAULTS =====
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333').text('FAULTS / SERVICE REQUIRED', margin, yPos);
    yPos += 15;

    if (data.faults && data.faults.length > 0) {
      const faultsText = data.faults.map(f => `● ${f.name}`).join('   ');
      doc.fontSize(9).font('Helvetica').fillColor('#000000').text(faultsText, margin, yPos, { width: contentWidth });
      yPos += 20;
    }

    // ===== PARTS BREAKDOWN =====
    doc.rect(margin, yPos, contentWidth, 20).fill('#e5e7eb');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333')
      .text('PARTS BREAKDOWN', margin + 10, yPos + 5);
    yPos += 25;

    // Tagged Parts Table
    if (data.taggedParts && data.taggedParts.length > 0) {
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#666666').text('TAGGED PARTS', margin, yPos);
      yPos += 12;

      data.taggedParts.forEach((part, index) => {
        doc.fontSize(8).font('Helvetica').fillColor('#000000');
        doc.text(`${index + 1}. ${part.partName}`, margin + 10, yPos);
        if (part.partNumber) {
          doc.fontSize(7).fillColor('#666666').text(`[${part.partNumber}]`, margin + 200, yPos);
        }
        doc.fontSize(8).fillColor('#000000');
        doc.text(`×${part.quantity}`, margin + 300, yPos);
        doc.text(`Rs.${part.totalPrice.toFixed(0)}`, margin + 380, yPos);
        yPos += 14;
      });

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333')
        .text(`Subtotal: Rs.${totals.taggedPartsTotal.toFixed(0)}`, margin + 380, yPos);
      yPos += 18;
    }

    // Extra Spare Parts Table
    if (data.extraSpareParts && data.extraSpareParts.length > 0) {
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#92400e').text('EXTRA SPARE PARTS', margin, yPos);
      yPos += 12;

      data.extraSpareParts.forEach((part, index) => {
        doc.fontSize(8).font('Helvetica').fillColor('#000000');
        doc.text(`${index + 1}. ${part.partName}`, margin + 10, yPos);
        doc.text(`×${part.quantity}`, margin + 280, yPos);
        doc.text(`Rs.${part.totalPrice.toFixed(0)}`, margin + 340, yPos);

        const approvalText = part.isApproved ? `[Y] ${this.formatApprovalMethod(part.approvalMethod)}` : '[N] Pending';
        doc.fontSize(7).fillColor(part.isApproved ? '#16a34a' : '#dc2626').text(approvalText, margin + 420, yPos);
        yPos += 14;
      });

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#92400e')
        .text(`Subtotal: Rs.${totals.extraSpareTotal.toFixed(0)}`, margin + 380, yPos);
      doc.fillColor('#000000');
      yPos += 20;
    }

    // ===== FINANCIAL SUMMARY BOX =====
    doc.rect(margin, yPos, contentWidth, 90).fill('#f9fafb');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333')
      .text('FINANCIAL SUMMARY', margin + 10, yPos + 8);

    const finY = yPos + 25;
    const finCol1 = margin + 10;
    const finCol2 = margin + 300;

    // Left column
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text(`Estimated Cost:`, finCol1, finY);
    doc.text(`Labour Charge:`, finCol1, finY + 14);
    doc.text(`Extra Spare Parts:`, finCol1, finY + 28);
    doc.text(`Discount:`, finCol1, finY + 42);

    doc.fillColor('#000000');
    doc.text(`Rs.${data.service.estimatedCost.toFixed(2)}`, finCol1 + 100, finY);
    doc.text(`Rs.${(data.service.labourCharge || 0).toFixed(2)}`, finCol1 + 100, finY + 14);
    doc.text(`Rs.${totals.extraSpareTotal.toFixed(2)}`, finCol1 + 100, finY + 28);
    doc.text(`-Rs.${(data.service.discount || 0).toFixed(2)}`, finCol1 + 100, finY + 42);

    // Right column (totals)
    doc.fontSize(10).font('Helvetica-Bold');
    doc.fillColor('#333333').text('TOTAL:', finCol2, finY);
    doc.fillColor('#0d9488').text(`Rs.${totals.totalAmount.toFixed(2)}`, finCol2 + 100, finY);

    doc.fontSize(9).font('Helvetica').fillColor('#333333');
    doc.text('Advance:', finCol2, finY + 20);
    doc.text(`Rs.${data.service.advancePayment.toFixed(2)}`, finCol2 + 100, finY + 20);

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#dc2626');
    doc.text('BALANCE:', finCol2, finY + 40);
    doc.text(`Rs.${totals.balanceDue.toFixed(2)}`, finCol2 + 100, finY + 40);

    yPos += 100;

    // ===== CONDENSED TERMS & SIGNATURES =====
    doc.fontSize(7).font('Helvetica').fillColor('#666666')
      .text('Terms: Non-refundable advance | Collect within 7 days | 30 days parts warranty | Not liable for data loss', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 20;

    // Signatures
    if (data.template?.showCustomerSignature !== false) {
      doc.fontSize(8).font('Helvetica').fillColor('#666666')
        .text('___________________', margin + 50, yPos);
      doc.text('Customer Signature', margin + 50, yPos + 12);
    }

    if (data.template?.showAuthorizedSignature !== false) {
      doc.text('___________________', pageWidth - margin - 150, yPos);
      doc.text('Authorized Signature', pageWidth - margin - 150, yPos + 12);
    }
  }

  /**
   * A4 Both Copies - 60/40 Split Layout
   */
  private addJobSheetA4BothCopies(doc: PDFKit.PDFDocument, data: JobSheetData): void {
    const margin = 25;
    const pageWidth = 595;
    const pageHeight = 842;
    const contentWidth = pageWidth - (margin * 2);
    const totals = this.calculateTotals(data);

    // Customer Copy takes ~60% (505pt), Office Copy takes ~40% (337pt)
    const customerSectionHeight = Math.floor(pageHeight * 0.58);
    const officeSectionStart = customerSectionHeight + 15;

    // ========== CUSTOMER COPY (TOP 60%) ==========
    let yPos = 20;

    // Company Header (condensed)
    if (data.template?.showCompanyLogo !== false) {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
        .text(data.company.name, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 16;
      doc.fontSize(8).fillColor('#0d9488').text('SERVICE CENTER', margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 10;
    }

    if (data.template?.showContactDetails !== false) {
      doc.fontSize(7).font('Helvetica').fillColor('#666666')
        .text(`${data.branch.address} | ${data.branch.phone}`, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 12;
    }

    // Title
    doc.rect(margin, yPos, contentWidth, 18).fill('#0d9488');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
      .text('SERVICE JOB SHEET - CUSTOMER COPY', margin, yPos + 4, { width: contentWidth, align: 'center' });
    yPos += 22;

    // Warranty Badge
    if (data.service.isWarrantyRepair) {
      doc.rect(margin, yPos, contentWidth, 14).fill('#fef3c7');
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#92400e')
        .text('** WARRANTY REPAIR **', margin, yPos + 3, { width: contentWidth, align: 'center' });
      yPos += 16;
    }

    // Job Info Row
    doc.fontSize(7).font('Helvetica').fillColor('#666666');
    doc.text('JOB#', margin, yPos);
    doc.text('TICKET', margin + 130, yPos);
    doc.text('DATE', margin + 260, yPos);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#0d9488').text(data.jobSheetNumber, margin + 30, yPos);
    doc.fillColor('#000000');
    doc.text(data.service.ticketNumber, margin + 170, yPos);
    doc.text(format(new Date(data.service.createdAt), 'dd/MM/yyyy'), margin + 295, yPos);
    yPos += 14;

    // Divider
    doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).lineWidth(0.3).stroke('#cccccc');
    yPos += 6;

    // Customer & Device (Two columns, condensed)
    const colWidth = (contentWidth - 15) / 2;

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333').text('CUSTOMER', margin, yPos);
    doc.text('DEVICE', margin + colWidth + 15, yPos);
    yPos += 12;

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000').text(data.customer.name, margin, yPos);
    doc.text(data.service.deviceModel, margin + colWidth + 15, yPos);
    yPos += 10;

    doc.fontSize(7).font('Helvetica').fillColor('#666666');
    doc.text(`Ph: ${data.customer.phone}`, margin, yPos);

    let deviceInfo = [];
    if (data.service.deviceIMEI) deviceInfo.push(`IMEI: ${data.service.deviceIMEI}`);
    if (data.service.devicePassword) deviceInfo.push(`PWD: ${data.service.devicePassword}`);
    if (data.customerDevice?.color) deviceInfo.push(data.customerDevice.color);
    doc.text(deviceInfo.join(' | '), margin + colWidth + 15, yPos, { width: colWidth });
    yPos += 10;

    if (data.customer.address) {
      doc.text(data.customer.address, margin, yPos, { width: colWidth });
      yPos += 10;
    }

    // Accessories (if any)
    if (data.accessories && data.accessories.length > 0) {
      doc.fontSize(7).fillColor('#666666')
        .text(`Accessories: ${data.accessories.map(a => a.name).join(', ')}`, margin + colWidth + 15, yPos, { width: colWidth });
      yPos += 10;
    }
    yPos += 4;

    // Faults
    doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).lineWidth(0.3).stroke('#cccccc');
    yPos += 6;

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333').text('FAULTS', margin, yPos);
    yPos += 10;

    if (data.faults && data.faults.length > 0) {
      const faultText = data.faults.map(f => `● ${f.name}`).join('  ');
      doc.fontSize(7).font('Helvetica').fillColor('#000000').text(faultText, margin, yPos, { width: contentWidth });
      yPos += 12;
    }

    // Tagged Parts (condensed table)
    if (data.taggedParts && data.taggedParts.length > 0) {
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#333333').text('🏷️ TAGGED PARTS', margin, yPos);
      yPos += 10;

      data.taggedParts.forEach((part, idx) => {
        doc.fontSize(7).font('Helvetica').fillColor('#000000');
        const partText = part.partNumber ? `${part.partName} [${part.partNumber}]` : part.partName;
        doc.text(`${idx + 1}. ${partText}`, margin, yPos);
        doc.text(`×${part.quantity}`, margin + 280, yPos);
        doc.text(`Rs.${part.totalPrice.toFixed(0)}`, margin + 320, yPos);
        yPos += 10;
      });
      yPos += 4;
    }

    // Extra Spare Parts (condensed table)
    if (data.extraSpareParts && data.extraSpareParts.length > 0) {
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#92400e').text('EXTRA SPARE', margin, yPos);
      yPos += 10;

      data.extraSpareParts.forEach((part, idx) => {
        doc.fontSize(7).font('Helvetica').fillColor('#000000');
        doc.text(`${idx + 1}. ${part.partName}`, margin, yPos);
        doc.text(`Rs.${part.totalPrice.toFixed(0)}`, margin + 280, yPos);
        const approval = part.isApproved ? `[Y] ${this.formatApprovalMethod(part.approvalMethod)}` : '[N]';
        doc.fontSize(6).fillColor(part.isApproved ? '#16a34a' : '#dc2626').text(approval, margin + 330, yPos);
        yPos += 10;
      });
      yPos += 4;
    }

    // Cost Summary Box
    doc.rect(margin, yPos, contentWidth, 50).fill('#f9fafb');

    const costRow1Y = yPos + 6;
    doc.fontSize(7).font('Helvetica').fillColor('#666666');
    doc.text(`Est: Rs.${data.service.estimatedCost.toFixed(0)}`, margin + 5, costRow1Y);
    doc.text(`Labour: Rs.${(data.service.labourCharge || 0).toFixed(0)}`, margin + 90, costRow1Y);
    doc.text(`Extra: Rs.${totals.extraSpareTotal.toFixed(0)}`, margin + 180, costRow1Y);
    doc.text(`Disc: -Rs.${(data.service.discount || 0).toFixed(0)}`, margin + 260, costRow1Y);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333');
    doc.text('TOTAL:', margin + 350, costRow1Y);
    doc.fillColor('#0d9488').text(`Rs.${totals.totalAmount.toFixed(0)}`, margin + 400, costRow1Y);

    const costRow2Y = yPos + 22;
    doc.fontSize(7).font('Helvetica').fillColor('#666666');
    doc.text(`Advance: Rs.${data.service.advancePayment.toFixed(0)}`, margin + 5, costRow2Y);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#dc2626');
    doc.text('BALANCE DUE:', margin + 300, costRow2Y);
    doc.text(`Rs.${totals.balanceDue.toFixed(0)}`, margin + 400, costRow2Y);

    // Terms (condensed)
    const termsY = yPos + 38;
    doc.fontSize(5).font('Helvetica').fillColor('#666666')
      .text('Terms: Non-refundable advance | 7 days collect | 30d warranty | No data liability', margin + 5, termsY);

    yPos += 55;

    // Signatures
    doc.fontSize(6).font('Helvetica').fillColor('#666666');
    doc.text('________________', margin + 20, yPos);
    doc.text('________________', margin + 350, yPos);
    doc.text('Customer Sign', margin + 20, yPos + 8);
    doc.text('Authorized Sign', margin + 350, yPos + 8);

    // ========== CUT LINE ==========
    const cutLineY = officeSectionStart - 10;
    doc.save();
    doc.lineWidth(0.5).dash(5, { space: 3 });
    doc.moveTo(margin, cutLineY).lineTo(pageWidth - margin, cutLineY).stroke('#999999');
    doc.restore();

    doc.fontSize(6).font('Helvetica').fillColor('#999999')
      .text('✂ CUT HERE', pageWidth / 2 - 20, cutLineY - 8);

    // ========== OFFICE COPY (BOTTOM 40%) ==========
    yPos = officeSectionStart;

    // Office Copy Header
    doc.rect(margin, yPos, contentWidth, 22).fill('#1f2937');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
      .text('SERVICE JOB SHEET - OFFICE COPY', margin, yPos + 3, { width: contentWidth, align: 'center' });
    doc.fontSize(7).fillColor('#9ca3af')
      .text(`Job#: ${data.jobSheetNumber} | Ticket: ${data.service.ticketNumber} | ${format(new Date(data.service.createdAt), 'dd/MM/yy HH:mm')}`, margin, yPos + 13, { width: contentWidth, align: 'center' });
    yPos += 26;

    // Customer & Device Info (single row)
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#333333');
    doc.text('CUSTOMER:', margin, yPos);
    doc.font('Helvetica').fillColor('#000000').text(`${data.customer.name} | ${data.customer.phone}`, margin + 60, yPos);

    doc.font('Helvetica-Bold').fillColor('#333333').text('DEVICE:', margin + 280, yPos);
    doc.font('Helvetica').fillColor('#000000').text(data.service.deviceModel, margin + 320, yPos);
    yPos += 12;

    // Device details
    doc.fontSize(6).font('Helvetica').fillColor('#666666');
    let officeDeviceInfo = [];
    if (data.service.deviceIMEI) officeDeviceInfo.push(`IMEI: ${data.service.deviceIMEI}`);
    if (data.service.devicePassword) officeDeviceInfo.push(`PWD: ${data.service.devicePassword}`);
    if (data.customerDevice?.color) officeDeviceInfo.push(`Color: ${data.customerDevice.color}`);
    if (data.technician) officeDeviceInfo.push(`Tech: ${data.technician.name}`);
    doc.text(officeDeviceInfo.join(' | '), margin, yPos, { width: contentWidth });
    yPos += 10;

    // Faults (single line)
    if (data.faults && data.faults.length > 0) {
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#333333').text('FAULTS:', margin, yPos);
      doc.font('Helvetica').fillColor('#000000')
        .text(data.faults.map(f => f.name).join(', '), margin + 50, yPos, { width: contentWidth - 50 });
      yPos += 12;
    }

    // Parts summary
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#333333').text('PARTS:', margin, yPos);

    let partsText = '';
    if (data.taggedParts && data.taggedParts.length > 0) {
      partsText += `Tagged: ${data.taggedParts.map(p => `${p.partName} Rs.${p.totalPrice.toFixed(0)}`).join(', ')}`;
    }
    if (data.extraSpareParts && data.extraSpareParts.length > 0) {
      if (partsText) partsText += ' | ';
      partsText += `Extra: ${data.extraSpareParts.map(p => `${p.partName} Rs.${p.totalPrice.toFixed(0)}`).join(', ')}`;
    }
    if (partsText) {
      doc.fontSize(6).font('Helvetica').fillColor('#000000').text(partsText, margin + 45, yPos, { width: contentWidth - 45 });
    }
    yPos += 14;

    // Financial Summary (condensed box)
    doc.rect(margin, yPos, contentWidth, 35).fill('#f3f4f6');

    const offFinY = yPos + 5;
    doc.fontSize(7).font('Helvetica').fillColor('#666666');
    doc.text(`Est: Rs.${data.service.estimatedCost.toFixed(0)}`, margin + 5, offFinY);
    doc.text(`Labour: Rs.${(data.service.labourCharge || 0).toFixed(0)}`, margin + 80, offFinY);
    doc.text(`Extra: Rs.${totals.extraSpareTotal.toFixed(0)}`, margin + 160, offFinY);
    doc.text(`Disc: -Rs.${(data.service.discount || 0).toFixed(0)}`, margin + 240, offFinY);

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
    doc.text(`TOTAL: Rs.${totals.totalAmount.toFixed(0)}`, margin + 330, offFinY);

    const offFinY2 = yPos + 18;
    doc.fontSize(7).font('Helvetica').fillColor('#666666');
    doc.text(`Advance: Rs.${data.service.advancePayment.toFixed(0)}`, margin + 5, offFinY2);

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#dc2626');
    doc.text(`BALANCE: Rs.${totals.balanceDue.toFixed(0)}`, margin + 330, offFinY2);

    yPos += 40;

    // Signatures
    doc.fontSize(6).font('Helvetica').fillColor('#666666');
    doc.text('____________', margin + 50, yPos);
    doc.text('____________', margin + 350, yPos);
    doc.text('Cust Sign', margin + 50, yPos + 8);
    doc.text('Auth Sign', margin + 350, yPos + 8);

    yPos += 20;

    // Terms
    doc.fontSize(5).font('Helvetica').fillColor('#666666')
      .text('Terms: Non-refundable advance | Collect within 7 days | 30 days warranty | Not liable for data loss', margin, yPos, { width: contentWidth, align: 'center' });
  }

  /**
   * Generate Job Sheet in A5 compact format
   */
  private addJobSheetA5(doc: PDFKit.PDFDocument, data: JobSheetData): void {
    const margin = 25;
    const pageWidth = 420; // A5 width in points
    const contentWidth = pageWidth - (margin * 2);

    // Company Logo & Header
    let yPos = 25;
    if (data.template?.showCompanyLogo && data.company.logo) {
      try {
        doc.image(data.company.logo, margin, yPos, { width: 40 });
        doc.fontSize(14).font('Helvetica-Bold').text(data.company.name, margin + 50, yPos + 5);
        yPos += 20;
      } catch {
        doc.fontSize(14).font('Helvetica-Bold').text(data.company.name, margin, yPos, { width: contentWidth, align: 'center' });
      }
    } else {
      doc.fontSize(14).font('Helvetica-Bold').text(data.company.name, margin, yPos, { width: contentWidth, align: 'center' });
    }
    yPos += 18;

    // Branch Info
    if (data.template?.showContactDetails !== false) {
      doc.fontSize(7).font('Helvetica')
        .text(`${data.branch.name} | ${data.branch.phone}`, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 10;
      if (data.company.gst) {
        doc.text(`GST: ${data.company.gst}`, margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 10;
      }
    }

    // Title
    yPos += 5;
    doc.fontSize(12).font('Helvetica-Bold').text('JOB SHEET', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 18;

    // Divider
    doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).stroke();
    yPos += 8;

    // Job Sheet Info Row
    doc.fontSize(8).font('Helvetica-Bold').text(`JS#: ${data.jobSheetNumber}`, margin, yPos);
    doc.text(`Date: ${format(new Date(data.service.createdAt), 'dd/MM/yy')}`, margin + 180, yPos);
    yPos += 12;
    doc.text(`Ticket: ${data.service.ticketNumber}`, margin, yPos);
    yPos += 15;

    // Divider
    doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).stroke();
    yPos += 8;

    // Customer Details
    doc.fontSize(9).font('Helvetica-Bold').text('CUSTOMER', margin, yPos);
    yPos += 12;
    doc.fontSize(8).font('Helvetica')
      .text(`${data.customer.name} | ${data.customer.phone}`, margin, yPos);
    yPos += 15;

    // Device Details
    doc.fontSize(9).font('Helvetica-Bold').text('DEVICE', margin, yPos);
    yPos += 12;
    doc.fontSize(8).font('Helvetica').text(data.service.deviceModel, margin, yPos);
    yPos += 10;
    if (data.service.deviceIMEI) {
      doc.text(`IMEI: ${data.service.deviceIMEI}`, margin, yPos);
      yPos += 10;
    }
    if (data.service.devicePassword) {
      doc.text(`Password: ${data.service.devicePassword}`, margin, yPos);
      yPos += 10;
    }
    if (data.customerDevice?.color) {
      doc.text(`Color: ${data.customerDevice.color}`, margin, yPos);
      yPos += 10;
    }
    yPos += 5;

    // Faults & Issue
    doc.fontSize(9).font('Helvetica-Bold').text('SERVICE DETAILS', margin, yPos);
    yPos += 12;
    if (data.faults && data.faults.length > 0) {
      doc.fontSize(8).font('Helvetica').text(`Faults: ${data.faults.map(f => f.name).join(', ')}`, margin, yPos, { width: contentWidth });
      yPos += 12;
    }
    doc.text(`Issue: ${data.service.issue}`, margin, yPos, { width: contentWidth });
    yPos += 15;

    // Cost Details
    doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).stroke();
    yPos += 8;
    doc.fontSize(9).font('Helvetica-Bold').text('COST', margin, yPos);
    yPos += 12;
    doc.fontSize(8).font('Helvetica')
      .text(`Estimated: Rs.${data.service.estimatedCost.toFixed(0)}`, margin, yPos)
      .text(`Advance: Rs.${data.service.advancePayment.toFixed(0)}`, margin + 120, yPos);
    yPos += 15;

    // Terms (condensed)
    doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).stroke();
    yPos += 8;
    doc.fontSize(6).font('Helvetica')
      .text('Terms: 1. Advance non-refundable 2. Collect in 7 days 3. No data loss liability 4. 30 days warranty', margin, yPos, { width: contentWidth });
    yPos += 20;

    // Signatures
    if (data.template?.showCustomerSignature !== false || data.template?.showAuthorizedSignature !== false) {
      yPos += 10;
      doc.fontSize(7).font('Helvetica')
        .text('________________', margin, yPos)
        .text('________________', margin + 180, yPos);
      yPos += 10;
      doc.text('Customer Sign', margin, yPos)
        .text('Authorized Sign', margin + 180, yPos);
    }

    // Footer
    yPos += 20;
    const footerText = data.template?.footerText || 'Thank you for your business!';
    doc.fontSize(6).font('Helvetica-Oblique').text(footerText, margin, yPos, { width: contentWidth, align: 'center' });
  }

  /**
   * A5 Customer Copy - Full Page
   */
  private addJobSheetA5Customer(doc: PDFKit.PDFDocument, data: JobSheetData): void {
    const margin = 20;
    const pageWidth = 420;
    const contentWidth = pageWidth - (margin * 2);
    const totals = this.calculateTotals(data);

    let yPos = 20;

    // Company Header
    if (data.template?.showCompanyLogo !== false) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
        .text(data.company.name, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 14;
      doc.fontSize(7).fillColor('#0d9488').text('SERVICE CENTER', margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 10;
    }

    if (data.template?.showContactDetails !== false) {
      doc.fontSize(6).font('Helvetica').fillColor('#666666')
        .text(`${data.branch.address} | ${data.branch.phone}`, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 10;
    }

    // Title Bar
    doc.rect(margin, yPos, contentWidth, 16).fill('#0d9488');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
      .text('SERVICE JOB SHEET', margin, yPos + 4, { width: contentWidth, align: 'center' });
    yPos += 20;

    // Warranty Badge
    if (data.service.isWarrantyRepair) {
      doc.rect(margin, yPos, contentWidth, 12).fill('#fef3c7');
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#92400e')
        .text('** WARRANTY REPAIR **', margin, yPos + 3, { width: contentWidth, align: 'center' });
      yPos += 14;
    }

    // Job Info
    doc.fontSize(6).font('Helvetica').fillColor('#666666');
    doc.text('JOB#', margin, yPos);
    doc.text('TICKET', margin + 100, yPos);
    doc.text('DATE', margin + 200, yPos);

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#0d9488').text(data.jobSheetNumber, margin + 25, yPos);
    doc.fillColor('#000000');
    doc.text(data.service.ticketNumber, margin + 135, yPos);
    doc.text(format(new Date(data.service.createdAt), 'dd/MM/yy'), margin + 230, yPos);
    yPos += 12;

    doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).lineWidth(0.3).stroke('#cccccc');
    yPos += 6;

    // Customer & Device
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#333333').text('CUSTOMER', margin, yPos);
    doc.text('DEVICE', margin + 190, yPos);
    yPos += 10;

    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000').text(data.customer.name, margin, yPos);
    doc.text(data.service.deviceModel, margin + 190, yPos);
    yPos += 10;

    doc.fontSize(6).font('Helvetica').fillColor('#666666');
    doc.text(`Ph: ${data.customer.phone}`, margin, yPos);

    let deviceInfo = [];
    if (data.service.deviceIMEI) deviceInfo.push(`IMEI: ${data.service.deviceIMEI}`);
    if (data.service.devicePassword) deviceInfo.push(`PWD: ${data.service.devicePassword}`);
    doc.text(deviceInfo.join(' | '), margin + 190, yPos);
    yPos += 10;

    if (data.customer.address) {
      doc.text(data.customer.address, margin, yPos, { width: 170 });
      yPos += 10;
    }

    // Faults
    doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).lineWidth(0.3).stroke('#cccccc');
    yPos += 6;

    doc.fontSize(7).font('Helvetica-Bold').fillColor('#333333').text('FAULTS', margin, yPos);
    yPos += 10;

    if (data.faults && data.faults.length > 0) {
      doc.fontSize(6).font('Helvetica').fillColor('#000000')
        .text(data.faults.map(f => `● ${f.name}`).join('  '), margin, yPos, { width: contentWidth });
      yPos += 10;
    }

    // Tagged Parts
    if (data.taggedParts && data.taggedParts.length > 0) {
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#333333').text('🏷️ TAGGED PARTS', margin, yPos);
      yPos += 8;

      data.taggedParts.forEach((part, idx) => {
        doc.fontSize(6).font('Helvetica').fillColor('#000000');
        doc.text(`${idx + 1}. ${part.partName}`, margin, yPos);
        doc.text(`Rs.${part.totalPrice.toFixed(0)}`, margin + 250, yPos);
        yPos += 8;
      });
    }

    // Extra Spare Parts
    if (data.extraSpareParts && data.extraSpareParts.length > 0) {
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#92400e').text('EXTRA SPARE', margin, yPos);
      yPos += 8;

      data.extraSpareParts.forEach((part, idx) => {
        doc.fontSize(6).font('Helvetica').fillColor('#000000');
        doc.text(`${idx + 1}. ${part.partName}`, margin, yPos);
        doc.text(`Rs.${part.totalPrice.toFixed(0)}`, margin + 220, yPos);
        doc.fontSize(5).fillColor(part.isApproved ? '#16a34a' : '#dc2626')
          .text(part.isApproved ? '[Y]' : '[N]', margin + 270, yPos);
        yPos += 8;
      });
    }

    // Cost Box
    doc.rect(margin, yPos, contentWidth, 40).fill('#f9fafb');

    doc.fontSize(6).font('Helvetica').fillColor('#666666');
    doc.text(`Est: Rs.${data.service.estimatedCost.toFixed(0)}`, margin + 5, yPos + 5);
    doc.text(`Labour: Rs.${(data.service.labourCharge || 0).toFixed(0)}`, margin + 80, yPos + 5);
    doc.text(`Extra: Rs.${totals.extraSpareTotal.toFixed(0)}`, margin + 160, yPos + 5);
    doc.text(`Disc: -Rs.${(data.service.discount || 0).toFixed(0)}`, margin + 240, yPos + 5);

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
    doc.text('TOTAL:', margin + 5, yPos + 18);
    doc.fillColor('#0d9488').text(`Rs.${totals.totalAmount.toFixed(0)}`, margin + 50, yPos + 18);

    doc.fontSize(6).fillColor('#666666').text(`Advance: Rs.${data.service.advancePayment.toFixed(0)}`, margin + 120, yPos + 18);

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#dc2626');
    doc.text('BALANCE:', margin + 200, yPos + 18);
    doc.text(`Rs.${totals.balanceDue.toFixed(0)}`, margin + 260, yPos + 18);

    // Terms
    doc.fontSize(5).font('Helvetica').fillColor('#666666')
      .text('Terms: Non-refundable advance | 7 days collect | 30d warranty', margin + 5, yPos + 32);

    yPos += 45;

    // Signatures
    doc.fontSize(5).font('Helvetica').fillColor('#666666');
    doc.text('____________', margin + 30, yPos);
    doc.text('____________', margin + 250, yPos);
    doc.text('Customer Sign', margin + 30, yPos + 8);
    doc.text('Authorized Sign', margin + 250, yPos + 8);

    // Footer
    yPos += 20;
    doc.fontSize(5).font('Helvetica-Oblique').fillColor('#666666')
      .text('Thank you for choosing our services!', margin, yPos, { width: contentWidth, align: 'center' });
  }

  /**
   * A5 Office Copy - Full Page (No company header)
   */
  private addJobSheetA5Office(doc: PDFKit.PDFDocument, data: JobSheetData): void {
    const margin = 20;
    const pageWidth = 420;
    const contentWidth = pageWidth - (margin * 2);
    const totals = this.calculateTotals(data);

    let yPos = 20;

    // Office Copy Header
    doc.rect(margin, yPos, contentWidth, 22).fill('#1f2937');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
      .text('SERVICE JOB SHEET', margin, yPos + 3, { width: contentWidth, align: 'center' });
    doc.fontSize(7).fillColor('#9ca3af')
      .text('OFFICE COPY', margin, yPos + 13, { width: contentWidth, align: 'center' });
    yPos += 26;

    // Job Info
    doc.rect(margin, yPos, contentWidth, 30).fill('#f9fafb');
    doc.fontSize(6).font('Helvetica').fillColor('#666666');
    doc.text('JOB#', margin + 5, yPos + 5);
    doc.text('TICKET', margin + 100, yPos + 5);
    doc.text('DATE', margin + 200, yPos + 5);
    doc.text('TECH', margin + 280, yPos + 5);

    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
    doc.text(data.jobSheetNumber, margin + 5, yPos + 15);
    doc.text(data.service.ticketNumber, margin + 100, yPos + 15);
    doc.text(format(new Date(data.service.createdAt), 'dd/MM/yy HH:mm'), margin + 200, yPos + 15);
    doc.text(data.technician?.name || '-', margin + 280, yPos + 15);
    yPos += 35;

    // Customer & Device
    doc.fontSize(6).font('Helvetica-Bold').fillColor('#333333');
    doc.text('CUSTOMER:', margin, yPos);
    doc.font('Helvetica').fillColor('#000000')
      .text(`${data.customer.name} | ${data.customer.phone}`, margin + 60, yPos);
    yPos += 10;

    doc.font('Helvetica-Bold').fillColor('#333333').text('DEVICE:', margin, yPos);
    doc.font('Helvetica').fillColor('#000000').text(data.service.deviceModel, margin + 50, yPos);

    let deviceDetails = [];
    if (data.service.deviceIMEI) deviceDetails.push(`IMEI: ${data.service.deviceIMEI}`);
    if (data.service.devicePassword) deviceDetails.push(`PWD: ${data.service.devicePassword}`);
    doc.text(deviceDetails.join(' | '), margin + 180, yPos);
    yPos += 12;

    // Faults
    if (data.faults && data.faults.length > 0) {
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#333333').text('FAULTS:', margin, yPos);
      doc.font('Helvetica').fillColor('#000000')
        .text(data.faults.map(f => f.name).join(', '), margin + 50, yPos, { width: 300 });
      yPos += 12;
    }

    // Parts
    doc.fontSize(6).font('Helvetica-Bold').fillColor('#333333').text('PARTS:', margin, yPos);

    let partsInfo = [];
    if (data.taggedParts && data.taggedParts.length > 0) {
      partsInfo.push(`Tagged: ${data.taggedParts.map(p => `${p.partName} Rs.${p.totalPrice.toFixed(0)}`).join(', ')}`);
    }
    if (data.extraSpareParts && data.extraSpareParts.length > 0) {
      partsInfo.push(`Extra: ${data.extraSpareParts.map(p => `${p.partName} Rs.${p.totalPrice.toFixed(0)}`).join(', ')}`);
    }
    doc.fontSize(5).font('Helvetica').fillColor('#000000')
      .text(partsInfo.join(' | '), margin + 45, yPos, { width: 320 });
    yPos += 14;

    // Financial Box
    doc.rect(margin, yPos, contentWidth, 35).fill('#f3f4f6');

    doc.fontSize(6).font('Helvetica').fillColor('#666666');
    doc.text(`Est: Rs.${data.service.estimatedCost.toFixed(0)}`, margin + 5, yPos + 5);
    doc.text(`Labour: Rs.${(data.service.labourCharge || 0).toFixed(0)}`, margin + 70, yPos + 5);
    doc.text(`Extra: Rs.${totals.extraSpareTotal.toFixed(0)}`, margin + 140, yPos + 5);
    doc.text(`Disc: -Rs.${(data.service.discount || 0).toFixed(0)}`, margin + 210, yPos + 5);

    doc.fontSize(7).font('Helvetica-Bold').fillColor('#333333');
    doc.text(`TOTAL: Rs.${totals.totalAmount.toFixed(0)}`, margin + 280, yPos + 5);

    doc.fontSize(6).fillColor('#666666');
    doc.text(`Advance: Rs.${data.service.advancePayment.toFixed(0)}`, margin + 5, yPos + 20);

    doc.fontSize(7).font('Helvetica-Bold').fillColor('#dc2626');
    doc.text(`BALANCE: Rs.${totals.balanceDue.toFixed(0)}`, margin + 280, yPos + 20);

    yPos += 40;

    // Signatures
    doc.fontSize(5).font('Helvetica').fillColor('#666666');
    doc.text('________', margin + 50, yPos);
    doc.text('________', margin + 250, yPos);
    doc.text('Cust Sign', margin + 50, yPos + 8);
    doc.text('Auth Sign', margin + 250, yPos + 8);

    yPos += 18;

    // Terms
    doc.fontSize(5).font('Helvetica').fillColor('#666666')
      .text('Terms: Non-refundable advance | 7 days collect | 30 days warranty | No data liability', margin, yPos, { width: contentWidth, align: 'center' });
  }

  /**
   * Thermal Customer Copy (80mm or 58mm)
   */
  private addJobSheetThermalCustomer(doc: PDFKit.PDFDocument, data: JobSheetData, pageFormat: string): void {
    const is2Inch = pageFormat.toLowerCase() === 'thermal-2';
    const margin = is2Inch ? 5 : 8;
    const pageWidth = is2Inch ? 144 : 216;
    const contentWidth = pageWidth - (margin * 2);
    const totals = this.calculateTotals(data);

    let yPos = 10;

    // Company Header
    doc.fontSize(is2Inch ? 8 : 10).font('Helvetica-Bold').fillColor('#000000')
      .text(data.company.name, margin, yPos, { width: contentWidth, align: 'center' });
    yPos += is2Inch ? 10 : 12;

    if (data.template?.showContactDetails !== false) {
      doc.fontSize(is2Inch ? 5 : 6).font('Helvetica').fillColor('#666666')
        .text(data.branch.address || '', margin, yPos, { width: contentWidth, align: 'center' });
      yPos += is2Inch ? 6 : 8;
      doc.text(data.branch.phone, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += is2Inch ? 6 : 8;
    }

    // Dashed line
    doc.fontSize(5).fillColor('#999999').text('- '.repeat(is2Inch ? 18 : 28), margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 8;

    // Title
    doc.fontSize(is2Inch ? 8 : 9).font('Helvetica-Bold').fillColor('#000000')
      .text('JOB SHEET', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += is2Inch ? 10 : 12;

    // Job Number
    doc.fontSize(is2Inch ? 6 : 7).font('Helvetica-Bold')
      .text(`#${data.jobSheetNumber}`, margin, yPos, { width: contentWidth, align: 'center' });
    yPos += is2Inch ? 8 : 10;

    // Date & Ticket
    doc.fontSize(is2Inch ? 5 : 6).font('Helvetica').fillColor('#666666')
      .text(`Date: ${format(new Date(data.service.createdAt), 'dd/MM/yy HH:mm')}`, margin, yPos, { width: contentWidth, align: 'center' });
    yPos += is2Inch ? 6 : 8;
    doc.text(`Ticket: ${data.service.ticketNumber}`, margin, yPos, { width: contentWidth, align: 'center' });
    yPos += is2Inch ? 8 : 10;

    // Dashed line
    doc.fontSize(5).fillColor('#999999').text('- '.repeat(is2Inch ? 18 : 28), margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 8;

    // Customer
    doc.fontSize(is2Inch ? 6 : 7).font('Helvetica-Bold').fillColor('#000000').text('CUSTOMER', margin, yPos);
    yPos += is2Inch ? 8 : 10;
    doc.fontSize(is2Inch ? 5 : 6).font('Helvetica').text(data.customer.name, margin, yPos);
    yPos += is2Inch ? 6 : 8;
    doc.text(data.customer.phone, margin, yPos);
    yPos += is2Inch ? 8 : 10;

    // Device
    doc.fontSize(is2Inch ? 6 : 7).font('Helvetica-Bold').text('DEVICE', margin, yPos);
    yPos += is2Inch ? 8 : 10;
    doc.fontSize(is2Inch ? 5 : 6).font('Helvetica').text(data.service.deviceModel, margin, yPos);
    yPos += is2Inch ? 6 : 8;
    if (data.service.deviceIMEI) {
      doc.text(`IMEI: ${data.service.deviceIMEI}`, margin, yPos);
      yPos += is2Inch ? 6 : 8;
    }
    if (data.service.devicePassword) {
      doc.text(`PWD: ${data.service.devicePassword}`, margin, yPos);
      yPos += is2Inch ? 6 : 8;
    }
    yPos += 4;

    // Faults
    if (data.faults && data.faults.length > 0) {
      doc.fontSize(is2Inch ? 6 : 7).font('Helvetica-Bold').text('FAULTS', margin, yPos);
      yPos += is2Inch ? 8 : 10;
      doc.fontSize(is2Inch ? 5 : 6).font('Helvetica')
        .text(data.faults.map(f => f.name).join(', '), margin, yPos, { width: contentWidth });
      yPos += is2Inch ? 8 : 10;
    }

    // Tagged Parts
    if (data.taggedParts && data.taggedParts.length > 0) {
      doc.fontSize(is2Inch ? 5 : 6).font('Helvetica-Bold').text('TAGGED PARTS', margin, yPos);
      yPos += is2Inch ? 6 : 8;
      data.taggedParts.forEach(part => {
        doc.fontSize(is2Inch ? 4 : 5).font('Helvetica');
        doc.text(part.partName, margin, yPos);
        doc.text(`Rs.${part.totalPrice.toFixed(0)}`, margin + (is2Inch ? 90 : 140), yPos);
        yPos += is2Inch ? 6 : 7;
      });
      yPos += 4;
    }

    // Extra Spare Parts
    if (data.extraSpareParts && data.extraSpareParts.length > 0) {
      doc.fontSize(is2Inch ? 5 : 6).font('Helvetica-Bold').fillColor('#92400e').text('EXTRA SPARE', margin, yPos);
      doc.fillColor('#000000');
      yPos += is2Inch ? 6 : 8;
      data.extraSpareParts.forEach(part => {
        doc.fontSize(is2Inch ? 4 : 5).font('Helvetica');
        doc.text(part.partName, margin, yPos);
        doc.text(`Rs.${part.totalPrice.toFixed(0)}`, margin + (is2Inch ? 70 : 110), yPos);
        doc.text(part.isApproved ? '[Y]' : '[N]', margin + (is2Inch ? 100 : 150), yPos);
        yPos += is2Inch ? 6 : 7;
      });
      yPos += 4;
    }

    // Dashed line
    doc.fontSize(5).fillColor('#999999').text('- '.repeat(is2Inch ? 18 : 28), margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 8;

    // Cost Summary
    doc.fontSize(is2Inch ? 5 : 6).font('Helvetica').fillColor('#666666');
    doc.text(`Est: Rs.${data.service.estimatedCost.toFixed(0)}`, margin, yPos);
    doc.text(`Labour: Rs.${(data.service.labourCharge || 0).toFixed(0)}`, margin + (is2Inch ? 55 : 80), yPos);
    yPos += is2Inch ? 6 : 8;
    doc.text(`Extra: Rs.${totals.extraSpareTotal.toFixed(0)}`, margin, yPos);
    doc.text(`Disc: -Rs.${(data.service.discount || 0).toFixed(0)}`, margin + (is2Inch ? 55 : 80), yPos);
    yPos += is2Inch ? 8 : 10;

    // Total
    doc.fontSize(is2Inch ? 7 : 8).font('Helvetica-Bold').fillColor('#000000')
      .text(`TOTAL: Rs.${totals.totalAmount.toFixed(0)}`, margin, yPos, { width: contentWidth, align: 'center' });
    yPos += is2Inch ? 8 : 10;

    doc.fontSize(is2Inch ? 5 : 6).font('Helvetica').fillColor('#666666')
      .text(`Advance: Rs.${data.service.advancePayment.toFixed(0)}`, margin, yPos, { width: contentWidth, align: 'center' });
    yPos += is2Inch ? 6 : 8;

    doc.fontSize(is2Inch ? 7 : 8).font('Helvetica-Bold').fillColor('#dc2626')
      .text(`BALANCE: Rs.${totals.balanceDue.toFixed(0)}`, margin, yPos, { width: contentWidth, align: 'center' });
    yPos += is2Inch ? 10 : 12;

    // Dashed line
    doc.fontSize(5).fillColor('#999999').text('- '.repeat(is2Inch ? 18 : 28), margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 8;

    // Terms
    doc.fontSize(is2Inch ? 4 : 5).font('Helvetica').fillColor('#666666')
      .text('Non-refundable advance', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += is2Inch ? 5 : 6;
    doc.text('Collect in 7 days | 30d warranty', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += is2Inch ? 8 : 10;

    // Signature
    doc.fontSize(is2Inch ? 5 : 6).fillColor('#666666')
      .text('Sign: ____________', margin, yPos);
    yPos += is2Inch ? 12 : 15;

    // Footer
    doc.fontSize(is2Inch ? 4 : 5).font('Helvetica-Oblique')
      .text('Thank you!', margin, yPos, { width: contentWidth, align: 'center' });
  }

  /**
   * Thermal Office Copy (80mm or 58mm) - No company header
   */
  private addJobSheetThermalOffice(doc: PDFKit.PDFDocument, data: JobSheetData, pageFormat: string): void {
    const is2Inch = pageFormat.toLowerCase() === 'thermal-2';
    const margin = is2Inch ? 5 : 8;
    const pageWidth = is2Inch ? 144 : 216;
    const contentWidth = pageWidth - (margin * 2);
    const totals = this.calculateTotals(data);

    let yPos = 10;

    // Office Header
    doc.fontSize(is2Inch ? 8 : 9).font('Helvetica-Bold').fillColor('#000000')
      .text('JOB SHEET', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += is2Inch ? 8 : 10;
    doc.fontSize(is2Inch ? 6 : 7).fillColor('#666666')
      .text('OFFICE COPY', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += is2Inch ? 8 : 10;

    // Dashed line
    doc.fontSize(5).fillColor('#999999').text('- '.repeat(is2Inch ? 18 : 28), margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 8;

    // Job Info
    doc.fontSize(is2Inch ? 5 : 6).font('Helvetica-Bold').fillColor('#000000');
    doc.text(`JOB#: ${data.jobSheetNumber}`, margin, yPos);
    yPos += is2Inch ? 6 : 8;
    doc.text(`TICKET: ${data.service.ticketNumber}`, margin, yPos);
    yPos += is2Inch ? 6 : 8;
    doc.font('Helvetica').fillColor('#666666')
      .text(`Date: ${format(new Date(data.service.createdAt), 'dd/MM/yy HH:mm')}`, margin, yPos);
    yPos += is2Inch ? 6 : 8;
    if (data.technician) {
      doc.text(`Tech: ${data.technician.name}`, margin, yPos);
      yPos += is2Inch ? 6 : 8;
    }
    yPos += 4;

    // Dashed line
    doc.fontSize(5).fillColor('#999999').text('- '.repeat(is2Inch ? 18 : 28), margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 8;

    // Customer
    doc.fontSize(is2Inch ? 6 : 7).font('Helvetica-Bold').fillColor('#000000').text('CUSTOMER', margin, yPos);
    yPos += is2Inch ? 8 : 10;
    doc.fontSize(is2Inch ? 5 : 6).font('Helvetica').text(data.customer.name, margin, yPos);
    yPos += is2Inch ? 6 : 8;
    doc.text(data.customer.phone, margin, yPos);
    yPos += is2Inch ? 8 : 10;

    // Device
    doc.fontSize(is2Inch ? 6 : 7).font('Helvetica-Bold').text('DEVICE', margin, yPos);
    yPos += is2Inch ? 8 : 10;
    doc.fontSize(is2Inch ? 5 : 6).font('Helvetica').text(data.service.deviceModel, margin, yPos);
    yPos += is2Inch ? 6 : 8;
    if (data.service.deviceIMEI) {
      doc.text(`IMEI: ${data.service.deviceIMEI}`, margin, yPos);
      yPos += is2Inch ? 6 : 8;
    }
    if (data.service.devicePassword) {
      doc.text(`PWD: ${data.service.devicePassword}`, margin, yPos);
      yPos += is2Inch ? 6 : 8;
    }
    yPos += 4;

    // Faults
    if (data.faults && data.faults.length > 0) {
      doc.fontSize(is2Inch ? 5 : 6).font('Helvetica-Bold').text('FAULTS', margin, yPos);
      yPos += is2Inch ? 6 : 8;
      doc.font('Helvetica').text(data.faults.map(f => f.name).join(', '), margin, yPos, { width: contentWidth });
      yPos += is2Inch ? 8 : 10;
    }

    // Parts Summary
    doc.fontSize(is2Inch ? 5 : 6).font('Helvetica-Bold').text('PARTS', margin, yPos);
    yPos += is2Inch ? 6 : 8;

    if (data.taggedParts && data.taggedParts.length > 0) {
      doc.fontSize(is2Inch ? 4 : 5).font('Helvetica');
      doc.text(`Tagged: Rs.${totals.taggedPartsTotal.toFixed(0)}`, margin, yPos);
      yPos += is2Inch ? 5 : 6;
    }
    if (data.extraSpareParts && data.extraSpareParts.length > 0) {
      doc.text(`Extra: Rs.${totals.extraSpareTotal.toFixed(0)}`, margin, yPos);
      yPos += is2Inch ? 5 : 6;
    }
    yPos += 4;

    // Dashed line
    doc.fontSize(5).fillColor('#999999').text('- '.repeat(is2Inch ? 18 : 28), margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 8;

    // Cost Summary
    doc.fontSize(is2Inch ? 6 : 7).font('Helvetica-Bold').fillColor('#000000');
    doc.text(`TOTAL: Rs.${totals.totalAmount.toFixed(0)}`, margin, yPos);
    yPos += is2Inch ? 8 : 10;

    doc.fontSize(is2Inch ? 5 : 6).font('Helvetica').fillColor('#666666');
    doc.text(`Adv: Rs.${data.service.advancePayment.toFixed(0)}`, margin, yPos);
    yPos += is2Inch ? 6 : 8;

    doc.fontSize(is2Inch ? 6 : 7).font('Helvetica-Bold').fillColor('#dc2626');
    doc.text(`BAL: Rs.${totals.balanceDue.toFixed(0)}`, margin, yPos);
    yPos += is2Inch ? 10 : 12;

    // Dashed line
    doc.fontSize(5).fillColor('#999999').text('- '.repeat(is2Inch ? 18 : 28), margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 8;

    // Signature
    doc.fontSize(is2Inch ? 5 : 6).fillColor('#666666')
      .text('Sign: ________', margin, yPos);
  }

  /**
   * Generate Job Sheet in Thermal receipt format (3-inch or 2-inch)
   */
  private addJobSheetThermal(doc: PDFKit.PDFDocument, data: JobSheetData, pageFormat: string): void {
    const is2Inch = pageFormat.toLowerCase() === 'thermal-2';
    const margin = is2Inch ? 5 : 8;
    const pageWidth = is2Inch ? 144 : 216;
    const contentWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;

    let yPos = 10;

    // Company Name (centered)
    doc.fontSize(is2Inch ? 8 : 10).font('Helvetica-Bold')
      .text(data.company.name, margin, yPos, { width: contentWidth, align: 'center' });
    yPos += is2Inch ? 12 : 14;

    // Branch & Contact
    if (data.template?.showContactDetails !== false) {
      doc.fontSize(is2Inch ? 5 : 6).font('Helvetica')
        .text(data.branch.name, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 8;
      doc.text(data.branch.phone, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 8;
    }

    // Dashed line
    doc.fontSize(6).text('- '.repeat(is2Inch ? 20 : 30), margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 10;

    // Title
    doc.fontSize(is2Inch ? 8 : 9).font('Helvetica-Bold')
      .text('JOB SHEET', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 12;

    // Job Sheet Number
    doc.fontSize(is2Inch ? 6 : 7).font('Helvetica-Bold')
      .text(`#${data.jobSheetNumber}`, margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 10;

    // Date & Ticket
    doc.fontSize(is2Inch ? 5 : 6).font('Helvetica')
      .text(`Date: ${format(new Date(data.service.createdAt), 'dd/MM/yy HH:mm')}`, margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 8;
    doc.text(`Ticket: ${data.service.ticketNumber}`, margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 10;

    // Dashed line
    doc.text('- '.repeat(is2Inch ? 20 : 30), margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 10;

    // Customer
    doc.fontSize(is2Inch ? 6 : 7).font('Helvetica-Bold').text('CUSTOMER', margin, yPos);
    yPos += 10;
    doc.fontSize(is2Inch ? 5 : 6).font('Helvetica')
      .text(data.customer.name, margin, yPos);
    yPos += 8;
    doc.text(data.customer.phone, margin, yPos);
    yPos += 10;

    // Device
    doc.fontSize(is2Inch ? 6 : 7).font('Helvetica-Bold').text('DEVICE', margin, yPos);
    yPos += 10;
    doc.fontSize(is2Inch ? 5 : 6).font('Helvetica')
      .text(data.service.deviceModel, margin, yPos);
    yPos += 8;
    if (data.service.deviceIMEI) {
      doc.text(`IMEI: ${data.service.deviceIMEI}`, margin, yPos);
      yPos += 8;
    }
    if (data.service.devicePassword) {
      doc.text(`Pass: ${data.service.devicePassword}`, margin, yPos);
      yPos += 8;
    }
    yPos += 5;

    // Faults
    if (data.faults && data.faults.length > 0) {
      doc.fontSize(is2Inch ? 6 : 7).font('Helvetica-Bold').text('FAULTS', margin, yPos);
      yPos += 10;
      doc.fontSize(is2Inch ? 5 : 6).font('Helvetica')
        .text(data.faults.map(f => f.name).join(', '), margin, yPos, { width: contentWidth });
      yPos += 12;
    }

    // Dashed line
    doc.fontSize(6).text('- '.repeat(is2Inch ? 20 : 30), margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 10;

    // Cost
    doc.fontSize(is2Inch ? 6 : 7).font('Helvetica-Bold')
      .text(`Est: Rs.${data.service.estimatedCost.toFixed(0)}`, margin, yPos);
    doc.text(`Adv: Rs.${data.service.advancePayment.toFixed(0)}`, margin + (is2Inch ? 60 : 100), yPos);
    yPos += 12;

    // Balance
    const balance = data.service.estimatedCost - data.service.advancePayment;
    doc.fontSize(is2Inch ? 7 : 8).font('Helvetica-Bold')
      .text(`Balance: Rs.${balance.toFixed(0)}`, margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 15;

    // Dashed line
    doc.fontSize(6).font('Helvetica').text('- '.repeat(is2Inch ? 20 : 30), margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 10;

    // Terms (very condensed)
    doc.fontSize(is2Inch ? 4 : 5).font('Helvetica')
      .text('Terms: Advance non-refundable.', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 6;
    doc.text('Collect in 7 days. 30 days warranty.', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 10;

    // Signature line
    if (data.template?.showCustomerSignature !== false) {
      yPos += 5;
      doc.fontSize(is2Inch ? 5 : 6).text('Sign: ____________', margin, yPos);
      yPos += 15;
    }

    // Footer
    doc.fontSize(is2Inch ? 4 : 5).font('Helvetica-Oblique')
      .text('Thank you!', margin, yPos, { width: contentWidth, align: 'center' });
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

    if (data.accessories && data.accessories.length > 0) {
      doc.font('Helvetica-Bold').text('Accessories: ', 50, doc.y);
      doc
        .font('Helvetica')
        .text(data.accessories.map(a => a.name).join(', '), 120, doc.y - 12);
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
      .text(`Rs. ${data.service.estimatedCost.toFixed(2)}`, 150, doc.y - 12);

    doc.font('Helvetica-Bold').text('Advance Payment: ', 50, doc.y);
    doc
      .font('Helvetica')
      .text(`Rs. ${data.service.advancePayment.toFixed(2)}`, 150, doc.y - 12);

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
      .text(`Rs.${serviceCost.toFixed(2)}`, 370, currentY)
      .text(`Rs.${serviceCost.toFixed(2)}`, 480, currentY);

    currentY += 15;

    // Parts
    if (data.parts && data.parts.length > 0) {
      for (const part of data.parts) {
        doc
          .text(part.partName, 50, currentY)
          .text(part.quantity.toString(), 300, currentY)
          .text(`Rs.${part.unitPrice.toFixed(2)}`, 370, currentY)
          .text(`Rs.${part.totalPrice.toFixed(2)}`, 480, currentY);

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
      .text(`Rs.${subtotal.toFixed(2)}`, 480, startY);

    doc
      .text('CGST (9%):', 370, startY + 15)
      .text(`Rs.${cgst.toFixed(2)}`, 480, startY + 15);

    doc
      .text('SGST (9%):', 370, startY + 30)
      .text(`Rs.${sgst.toFixed(2)}`, 480, startY + 30);

    doc.moveTo(370, startY + 45).lineTo(545, startY + 45).stroke();

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total Amount:', 370, startY + 50)
      .text(`Rs.${data.totalAmount.toFixed(2)}`, 480, startY + 50);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Paid Amount:', 370, startY + 70)
      .text(`Rs.${data.paidAmount.toFixed(2)}`, 480, startY + 70);

    doc
      .font('Helvetica-Bold')
      .text('Balance Due:', 370, startY + 85)
      .text(`Rs.${data.balanceAmount.toFixed(2)}`, 480, startY + 85);

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
          .text(`Rs.${payment.amount.toFixed(2)}`, 200, currentY)
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
        .text(`Rs.${item.unitPrice.toFixed(2)}`, 380, currentY)
        .text(`Rs.${item.amount.toFixed(2)}`, 480, currentY);

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
      .text(`Rs.${data.subtotal.toFixed(2)}`, 480, startY);

    if (data.taxAmount > 0) {
      const cgst = data.taxAmount / 2;
      const sgst = data.taxAmount / 2;

      doc
        .text('CGST (9%):', 370, startY + 15)
        .text(`Rs.${cgst.toFixed(2)}`, 480, startY + 15);

      doc
        .text('SGST (9%):', 370, startY + 30)
        .text(`Rs.${sgst.toFixed(2)}`, 480, startY + 30);
    }

    doc.moveTo(370, startY + 45).lineTo(545, startY + 45).stroke();

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total Estimate:', 370, startY + 50)
      .text(`Rs.${data.totalAmount.toFixed(2)}`, 480, startY + 50);

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
