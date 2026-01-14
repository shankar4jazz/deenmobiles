import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// B2C Large threshold (Rs. 2.5 Lakhs)
const B2C_LARGE_THRESHOLD = 250000;

interface GSTR1Filters {
  companyId: string;
  branchId?: string;
  month: number;
  year: number;
}

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

interface GSTR1Summary {
  totalTaxableValue: number;
  totalIGST: number;
  totalCGST: number;
  totalSGST: number;
  totalCess: number;
  totalTax: number;
  totalInvoices: number;
  b2bCount: number;
  b2cLargeCount: number;
  b2cSmallCount: number;
}

export class GSTR1Service {
  /**
   * Get month date range
   */
  private getMonthRange(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  /**
   * Get seller state code (from branch or company)
   */
  private async getSellerStateCode(companyId: string, branchId?: string): Promise<string> {
    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { stateCode: true, company: { select: { stateCode: true } } },
      });
      return branch?.stateCode || branch?.company?.stateCode || '';
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { stateCode: true },
    });
    return company?.stateCode || '';
  }

  /**
   * B2B Invoices - Invoices to registered dealers (with GSTIN)
   */
  async getB2BInvoices(filters: GSTR1Filters): Promise<B2BRecord[]> {
    const { startDate, endDate } = this.getMonthRange(filters.month, filters.year);

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: filters.companyId,
        ...(filters.branchId && { branchId: filters.branchId }),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        customer: {
          gstin: { not: null },
        },
      },
      include: {
        customer: {
          select: { gstin: true, stateCode: true, name: true },
        },
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const records: B2BRecord[] = [];

    for (const invoice of invoices) {
      if (!invoice.customer?.gstin) continue;

      // Group items by GST rate
      const rateGroups: Record<number, { taxableValue: number; igst: number; cgst: number; sgst: number; cess: number }> = {};

      for (const item of invoice.items) {
        const rate = item.gstRate || 0;
        if (!rateGroups[rate]) {
          rateGroups[rate] = { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 };
        }
        rateGroups[rate].taxableValue += item.taxableValue || item.amount;
        rateGroups[rate].igst += item.igstAmount || 0;
        rateGroups[rate].cgst += item.cgstAmount || 0;
        rateGroups[rate].sgst += item.sgstAmount || 0;
        rateGroups[rate].cess += item.cessAmount || 0;
      }

      // Create a record for each rate
      for (const [rateStr, amounts] of Object.entries(rateGroups)) {
        records.push({
          gstin: invoice.customer.gstin,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.createdAt,
          invoiceValue: invoice.totalAmount,
          placeOfSupply: invoice.placeOfSupply || invoice.customer.stateCode || '',
          reverseCharge: invoice.reverseCharge,
          invoiceType: 'R', // Regular
          rate: parseFloat(rateStr),
          taxableValue: amounts.taxableValue,
          igstAmount: amounts.igst,
          cgstAmount: amounts.cgst,
          sgstAmount: amounts.sgst,
          cessAmount: amounts.cess,
        });
      }
    }

    return records;
  }

  /**
   * B2C Large - Inter-state sales > 2.5L to unregistered customers
   */
  async getB2CLargeInvoices(filters: GSTR1Filters): Promise<B2CLargeRecord[]> {
    const { startDate, endDate } = this.getMonthRange(filters.month, filters.year);
    const sellerStateCode = await this.getSellerStateCode(filters.companyId, filters.branchId);

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: filters.companyId,
        ...(filters.branchId && { branchId: filters.branchId }),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        totalAmount: { gte: B2C_LARGE_THRESHOLD },
        OR: [
          { customer: { gstin: null } },
          { customerId: null },
        ],
      },
      include: {
        customer: {
          select: { gstin: true, stateCode: true },
        },
        items: true,
      },
    });

    // Group by place of supply and rate
    const groupedRecords: Record<string, B2CLargeRecord> = {};

    for (const invoice of invoices) {
      const customerState = invoice.placeOfSupply || invoice.customer?.stateCode || '';

      // Only inter-state (different state from seller)
      if (customerState === sellerStateCode || !customerState) continue;

      for (const item of invoice.items) {
        const rate = item.gstRate || 0;
        const key = `${customerState}-${rate}`;

        if (!groupedRecords[key]) {
          groupedRecords[key] = {
            placeOfSupply: customerState,
            rate,
            taxableValue: 0,
            igstAmount: 0,
            cessAmount: 0,
          };
        }

        groupedRecords[key].taxableValue += item.taxableValue || item.amount;
        groupedRecords[key].igstAmount += item.igstAmount || 0;
        groupedRecords[key].cessAmount += item.cessAmount || 0;
      }
    }

    return Object.values(groupedRecords);
  }

  /**
   * B2C Small - Other B2C sales (intra-state or inter-state <= 2.5L)
   */
  async getB2CSmallInvoices(filters: GSTR1Filters): Promise<B2CSmallRecord[]> {
    const { startDate, endDate } = this.getMonthRange(filters.month, filters.year);
    const sellerStateCode = await this.getSellerStateCode(filters.companyId, filters.branchId);

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: filters.companyId,
        ...(filters.branchId && { branchId: filters.branchId }),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          { customer: { gstin: null } },
          { customerId: null },
        ],
      },
      include: {
        customer: {
          select: { gstin: true, stateCode: true },
        },
        items: true,
      },
    });

    // Group by type (OE), place of supply, and rate
    const groupedRecords: Record<string, B2CSmallRecord> = {};

    for (const invoice of invoices) {
      const customerState = invoice.placeOfSupply || invoice.customer?.stateCode || sellerStateCode;
      const isInterState = customerState !== sellerStateCode;

      // Exclude B2C Large (inter-state > 2.5L)
      if (isInterState && invoice.totalAmount >= B2C_LARGE_THRESHOLD) continue;

      for (const item of invoice.items) {
        const rate = item.gstRate || 0;
        const key = `OE-${customerState}-${rate}`;

        if (!groupedRecords[key]) {
          groupedRecords[key] = {
            type: 'OE', // Outward supply to end consumer
            placeOfSupply: customerState,
            rate,
            taxableValue: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            cessAmount: 0,
          };
        }

        groupedRecords[key].taxableValue += item.taxableValue || item.amount;
        groupedRecords[key].cgstAmount += item.cgstAmount || 0;
        groupedRecords[key].sgstAmount += item.sgstAmount || 0;
        groupedRecords[key].igstAmount += item.igstAmount || 0;
        groupedRecords[key].cessAmount += item.cessAmount || 0;
      }
    }

    return Object.values(groupedRecords);
  }

  /**
   * HSN Summary - Group invoice items by HSN code
   */
  async getHSNSummary(filters: GSTR1Filters): Promise<HSNSummaryRecord[]> {
    const { startDate, endDate } = this.getMonthRange(filters.month, filters.year);

    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          companyId: filters.companyId,
          ...(filters.branchId && { branchId: filters.branchId }),
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        invoice: {
          select: { id: true },
        },
      },
    });

    // Group by HSN code
    const hsnGroups: Record<string, HSNSummaryRecord> = {};

    for (const item of invoiceItems) {
      const hsnCode = item.hsnCode || 'N/A';

      if (!hsnGroups[hsnCode]) {
        hsnGroups[hsnCode] = {
          hsnCode,
          description: item.description,
          uqc: 'NOS', // Numbers (default for services)
          totalQuantity: 0,
          totalValue: 0,
          taxableValue: 0,
          igstAmount: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          cessAmount: 0,
        };
      }

      hsnGroups[hsnCode].totalQuantity += item.quantity;
      hsnGroups[hsnCode].totalValue += item.amount;
      hsnGroups[hsnCode].taxableValue += item.taxableValue || item.amount;
      hsnGroups[hsnCode].igstAmount += item.igstAmount || 0;
      hsnGroups[hsnCode].cgstAmount += item.cgstAmount || 0;
      hsnGroups[hsnCode].sgstAmount += item.sgstAmount || 0;
      hsnGroups[hsnCode].cessAmount += item.cessAmount || 0;
    }

    return Object.values(hsnGroups).sort((a, b) => b.taxableValue - a.taxableValue);
  }

  /**
   * Document Summary - Invoice series tracking
   */
  async getDocumentSummary(filters: GSTR1Filters): Promise<DocumentSummaryRecord[]> {
    const { startDate, endDate } = this.getMonthRange(filters.month, filters.year);

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: filters.companyId,
        ...(filters.branchId && { branchId: filters.branchId }),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        invoiceNumber: true,
      },
      orderBy: { invoiceNumber: 'asc' },
    });

    if (invoices.length === 0) {
      return [];
    }

    // Extract invoice numbers and find range
    const invoiceNumbers = invoices.map(i => i.invoiceNumber);

    return [{
      documentType: 'Invoices for outward supply',
      fromNumber: invoiceNumbers[0],
      toNumber: invoiceNumbers[invoiceNumbers.length - 1],
      totalCount: invoiceNumbers.length,
      cancelledCount: 0, // Would need a cancelled status field
      netIssued: invoiceNumbers.length,
    }];
  }

  /**
   * Get full GSTR1 report with all sections
   */
  async getFullGSTR1Report(filters: GSTR1Filters) {
    const [b2b, b2cLarge, b2cSmall, hsnSummary, documentSummary] = await Promise.all([
      this.getB2BInvoices(filters),
      this.getB2CLargeInvoices(filters),
      this.getB2CSmallInvoices(filters),
      this.getHSNSummary(filters),
      this.getDocumentSummary(filters),
    ]);

    // Calculate summary totals
    const calculateTotals = (records: any[]): { taxable: number; igst: number; cgst: number; sgst: number; cess: number } => {
      return records.reduce((acc, r) => ({
        taxable: acc.taxable + (r.taxableValue || 0),
        igst: acc.igst + (r.igstAmount || 0),
        cgst: acc.cgst + (r.cgstAmount || 0),
        sgst: acc.sgst + (r.sgstAmount || 0),
        cess: acc.cess + (r.cessAmount || 0),
      }), { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 });
    };

    const b2bTotals = calculateTotals(b2b);
    const b2cLargeTotals = calculateTotals(b2cLarge);
    const b2cSmallTotals = calculateTotals(b2cSmall);

    const summary: GSTR1Summary = {
      totalTaxableValue: b2bTotals.taxable + b2cLargeTotals.taxable + b2cSmallTotals.taxable,
      totalIGST: b2bTotals.igst + b2cLargeTotals.igst + b2cSmallTotals.igst,
      totalCGST: b2bTotals.cgst + b2cLargeTotals.cgst + b2cSmallTotals.cgst,
      totalSGST: b2bTotals.sgst + b2cLargeTotals.sgst + b2cSmallTotals.sgst,
      totalCess: b2bTotals.cess + b2cLargeTotals.cess + b2cSmallTotals.cess,
      totalTax: 0,
      totalInvoices: documentSummary[0]?.totalCount || 0,
      b2bCount: b2b.length,
      b2cLargeCount: b2cLarge.length,
      b2cSmallCount: b2cSmall.length,
    };
    summary.totalTax = summary.totalIGST + summary.totalCGST + summary.totalSGST + summary.totalCess;

    return {
      period: `${filters.month.toString().padStart(2, '0')}-${filters.year}`,
      b2b,
      b2cLarge,
      b2cSmall,
      hsnSummary,
      documentSummary,
      summary,
    };
  }
}

export default new GSTR1Service();
