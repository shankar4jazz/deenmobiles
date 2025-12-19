import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { PaymentStatus, DocumentType } from '@prisma/client';
import pdfGenerationService from './pdfGenerationService';
import { DocumentNumberService } from './documentNumberService';

interface GenerateInvoiceFromServiceData {
  serviceId: string;
  userId: string;
}

interface CreateInvoiceData {
  serviceId?: string;
  customerId?: string;
  branchId?: string;
  items?: InvoiceItemData[];
  totalAmount?: number;
  paidAmount?: number;
  notes?: string;
  userId: string;
  companyId: string;
}

interface InvoiceItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface RecordPaymentData {
  invoiceId: string;
  amount: number;
  paymentMethodId: string;
  transactionId?: string;
  notes?: string;
  userId: string;
}

interface InvoiceFilters {
  companyId: string;
  branchId?: string;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

export class InvoiceService {
  /**
   * Generate unique invoice number using configurable format from settings
   * Format is configurable via Settings → Document Numbers → Invoice
   */
  private static async generateInvoiceNumber(branchId: string, companyId: string): Promise<string> {
    try {
      // Use DocumentNumberService to generate invoice number based on company settings
      const invoiceNumber = await DocumentNumberService.generateNumber(
        companyId,
        DocumentType.INVOICE,
        branchId
      );

      return invoiceNumber;
    } catch (error) {
      Logger.error('Error generating invoice number:', error);
      throw error;
    }
  }

  /**
   * Generate invoice from service
   */
  static async generateInvoiceFromService(
    data: GenerateInvoiceFromServiceData
  ): Promise<any> {
    try {
      const { serviceId, userId } = data;

      // Check if service exists
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          customer: true,
          customerDevice: true,
          faults: {
            include: {
              fault: true,
            },
          },
          assignedTo: {
            select: { name: true },
          },
          branch: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              email: true,
            },
          },
          company: {
            select: {
              name: true,
              address: true,
              phone: true,
              email: true,
              logo: true,
            },
          },
          partsUsed: {
            include: {
              part: {
                select: {
                  name: true,
                },
              },
              item: {
                select: {
                  itemName: true,
                },
              },
            },
          },
          paymentEntries: {
            include: {
              paymentMethod: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      // Check if invoice already exists
      const existingInvoice = await prisma.invoice.findUnique({
        where: { serviceId },
      });

      if (existingInvoice) {
        throw new AppError(400, 'Invoice already exists for this service');
      }

      // Calculate amounts
      const totalAmount = service.actualCost ?? service.estimatedCost;
      const paidAmount = service.advancePayment;
      const balanceAmount = totalAmount - paidAmount;

      // Determine payment status
      let paymentStatus: PaymentStatus;
      if (balanceAmount <= 0) {
        paymentStatus = PaymentStatus.PAID;
      } else if (paidAmount > 0) {
        paymentStatus = PaymentStatus.PARTIAL;
      } else {
        paymentStatus = PaymentStatus.PENDING;
      }

      // Generate invoice number using configurable format from settings
      const invoiceNumber = await this.generateInvoiceNumber(service.branchId, service.companyId);

      // Prepare data for PDF generation
      const pdfData = {
        invoiceNumber,
        invoiceDate: new Date(),
        service: {
          ticketNumber: service.ticketNumber,
          createdAt: service.createdAt,
          deviceModel: service.deviceModel,
          issue: service.damageCondition,
          diagnosis: service.diagnosis || undefined,
          actualCost: service.actualCost || undefined,
          estimatedCost: service.estimatedCost,
          advancePayment: service.advancePayment,
          completedAt: service.completedAt || undefined,
        },
        customer: {
          name: service.customer.name,
          phone: service.customer.phone,
          address: service.customer.address || undefined,
          email: service.customer.email || undefined,
        },
        branch: service.branch,
        company: service.company,
        parts: service.partsUsed.map((sp: any) => ({
          partName: sp.item?.itemName || sp.part?.name || 'Unknown Part',
          quantity: sp.quantity,
          unitPrice: sp.unitPrice,
          totalPrice: sp.totalPrice,
        })),
        payments: service.paymentEntries.map((pe: any) => ({
          amount: pe.amount,
          paymentMethod: pe.paymentMethod?.name || 'Unknown',
          transactionId: pe.transactionId || undefined,
          createdAt: pe.paymentDate,
        })),
        totalAmount,
        paidAmount,
        balanceAmount,
        paymentStatus,
      };

      // Generate PDF
      const pdfUrl = await pdfGenerationService.generateInvoicePDF(pdfData);

      // Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          serviceId,
          totalAmount,
          paidAmount,
          balanceAmount,
          paymentStatus,
          companyId: service.companyId,
          pdfUrl,
        },
        include: {
          service: {
            select: {
              ticketNumber: true,
              deviceModel: true,
              customer: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      // Create payment records from payment entries
      if (service.paymentEntries && service.paymentEntries.length > 0) {
        for (const pe of service.paymentEntries) {
          await prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: pe.amount,
              paymentMethodId: pe.paymentMethodId,
              transactionId: pe.transactionId,
              notes: pe.notes,
              createdAt: pe.paymentDate,
            },
          });
        }
      }

      Logger.info(`Invoice ${invoiceNumber} generated for service ${service.ticketNumber}`);

      return invoice;
    } catch (error) {
      Logger.error('Error generating invoice from service:', error);
      throw error;
    }
  }

  /**
   * Create standalone invoice or service-linked invoice
   */
  static async createInvoice(data: CreateInvoiceData): Promise<any> {
    try {
      const {
        serviceId,
        customerId,
        branchId,
        items,
        totalAmount,
        paidAmount = 0,
        notes,
        userId,
        companyId,
      } = data;

      // Validate: either serviceId or (customerId AND branchId) must be provided
      if (!serviceId && (!customerId || !branchId)) {
        throw new AppError(
          400,
          'Either serviceId or both customerId and branchId must be provided'
        );
      }

      let effectiveBranchId = branchId;
      let effectiveCustomerId = customerId;
      let finalTotalAmount = totalAmount;

      // If service provided, fetch service details
      if (serviceId) {
        const service = await prisma.service.findUnique({
          where: { id: serviceId },
          include: {
            customer: true,
            branch: true,
          },
        });

        if (!service) {
          throw new AppError(404, 'Service not found');
        }

        // Check if invoice already exists for this service
        const existingInvoice = await prisma.invoice.findUnique({
          where: { serviceId },
        });

        if (existingInvoice) {
          throw new AppError(400, 'Invoice already exists for this service');
        }

        effectiveBranchId = service.branchId;
        effectiveCustomerId = service.customerId;
        finalTotalAmount = totalAmount ?? service.actualCost ?? service.estimatedCost;
      } else {
        // Standalone invoice - verify customer and branch exist
        const [customer, branch] = await Promise.all([
          prisma.customer.findUnique({ where: { id: customerId! } }),
          prisma.branch.findUnique({ where: { id: branchId! } }),
        ]);

        if (!customer) {
          throw new AppError(404, 'Customer not found');
        }

        if (!branch) {
          throw new AppError(404, 'Branch not found');
        }

        // For standalone invoices, totalAmount is required
        if (!totalAmount) {
          throw new AppError(400, 'Total amount is required for standalone invoices');
        }

        // For standalone invoices, items are required
        if (!items || items.length === 0) {
          throw new AppError(400, 'At least one item is required for standalone invoices');
        }

        finalTotalAmount = totalAmount;
      }

      // Calculate amounts
      const balanceAmount = finalTotalAmount! - paidAmount;

      // Determine payment status
      let paymentStatus: PaymentStatus;
      if (balanceAmount <= 0) {
        paymentStatus = PaymentStatus.PAID;
      } else if (paidAmount > 0) {
        paymentStatus = PaymentStatus.PARTIAL;
      } else {
        paymentStatus = PaymentStatus.PENDING;
      }

      // Generate invoice number using configurable format from settings
      const invoiceNumber = await this.generateInvoiceNumber(effectiveBranchId!, companyId);

      // Create invoice with items in transaction
      const invoice = await prisma.$transaction(async (tx) => {
        // Create invoice
        const newInvoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            serviceId,
            customerId: effectiveCustomerId,
            branchId: effectiveBranchId,
            totalAmount: finalTotalAmount!,
            paidAmount,
            balanceAmount,
            paymentStatus,
            companyId,
            notes,
          },
          include: {
            service: {
              select: {
                ticketNumber: true,
                deviceModel: true,
                customer: {
                  select: {
                    name: true,
                    phone: true,
                  },
                },
              },
            },
            customer: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        });

        // Create invoice items if provided
        if (items && items.length > 0) {
          await tx.invoiceItem.createMany({
            data: items.map((item) => ({
              invoiceId: newInvoice.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })),
          });
        }

        return newInvoice;
      });

      Logger.info(`Invoice ${invoiceNumber} created`, {
        invoiceId: invoice.id,
        standalone: !serviceId,
      });

      return invoice;
    } catch (error) {
      Logger.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(invoiceId: string, companyId: string): Promise<any> {
    try {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          companyId,
        },
        include: {
          service: {
            include: {
              customer: true,
              customerDevice: true,
              faults: {
                include: {
                  fault: true,
                },
              },
              assignedTo: {
                select: { name: true },
              },
              branch: true,
              company: true,
              partsUsed: {
                include: {
                  part: {
                    select: {
                      name: true,
                      partNumber: true,
                    },
                  },
                  item: {
                    select: {
                      itemName: true,
                      itemCode: true,
                    },
                  },
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              address: true,
            },
          },
          items: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          payments: {
            include: {
              paymentMethod: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!invoice) {
        throw new AppError(404, 'Invoice not found');
      }

      return invoice;
    } catch (error) {
      Logger.error('Error fetching invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoice by service ID
   */
  static async getInvoiceByServiceId(serviceId: string, companyId: string): Promise<any> {
    try {
      const invoice = await prisma.invoice.findFirst({
        where: {
          serviceId,
          companyId,
        },
        include: {
          service: {
            select: {
              ticketNumber: true,
              deviceModel: true,
              customer: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      // Return null if no invoice found (not an error - invoice may not exist yet)
      return invoice;
    } catch (error) {
      Logger.error('Error fetching invoice by service ID:', error);
      throw error;
    }
  }

  /**
   * Get invoices with filters and pagination
   */
  static async getInvoices(filters: InvoiceFilters): Promise<any> {
    try {
      const {
        companyId,
        branchId,
        paymentStatus,
        startDate,
        endDate,
        searchTerm,
        page = 1,
        limit = 20,
      } = filters;

      const where: any = {
        companyId,
      };

      // Branch filter
      if (branchId) {
        where.service = {
          branchId,
        };
      }

      // Payment status filter
      if (paymentStatus) {
        where.paymentStatus = paymentStatus;
      }

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Search filter (invoice number, service ticket, customer name)
      if (searchTerm) {
        where.OR = [
          { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } },
          {
            service: {
              ticketNumber: { contains: searchTerm, mode: 'insensitive' },
            },
          },
          {
            service: {
              customer: {
                name: { contains: searchTerm, mode: 'insensitive' },
              },
            },
          },
        ];
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: {
            service: {
              select: {
                ticketNumber: true,
                deviceModel: true,
                createdAt: true,
                customer: {
                  select: {
                    name: true,
                    phone: true,
                  },
                },
                branch: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.invoice.count({ where }),
      ]);

      return {
        data: invoices,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Update invoice
   */
  static async updateInvoice(
    invoiceId: string,
    data: { totalAmount?: number; paidAmount?: number },
    companyId: string
  ): Promise<any> {
    try {
      // Get existing invoice
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          companyId,
        },
      });

      if (!existingInvoice) {
        throw new AppError(404, 'Invoice not found');
      }

      const totalAmount = data.totalAmount ?? existingInvoice.totalAmount;
      const paidAmount = data.paidAmount ?? existingInvoice.paidAmount;
      const balanceAmount = totalAmount - paidAmount;

      // Determine payment status
      let paymentStatus: PaymentStatus;
      if (balanceAmount <= 0) {
        paymentStatus = PaymentStatus.PAID;
      } else if (paidAmount > 0) {
        paymentStatus = PaymentStatus.PARTIAL;
      } else {
        paymentStatus = PaymentStatus.PENDING;
      }

      const invoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          totalAmount,
          paidAmount,
          balanceAmount,
          paymentStatus,
        },
        include: {
          service: {
            select: {
              ticketNumber: true,
              deviceModel: true,
              customer: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      Logger.info(`Invoice ${invoice.invoiceNumber} updated`);

      return invoice;
    } catch (error) {
      Logger.error('Error updating invoice:', error);
      throw error;
    }
  }

  /**
   * Delete invoice (with payments)
   */
  static async deleteInvoice(invoiceId: string, companyId: string): Promise<void> {
    try {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          companyId,
        },
      });

      if (!invoice) {
        throw new AppError(404, 'Invoice not found');
      }

      // Delete all payments first
      await prisma.payment.deleteMany({
        where: { invoiceId },
      });

      // Delete invoice
      await prisma.invoice.delete({
        where: { id: invoiceId },
      });

      Logger.info(`Invoice ${invoice.invoiceNumber} deleted with payments`);
    } catch (error) {
      Logger.error('Error deleting invoice:', error);
      throw error;
    }
  }

  /**
   * Sync invoice from service - recalculates totals from current service data
   */
  static async syncFromService(invoiceId: string, companyId: string): Promise<any> {
    try {
      // Get invoice with service
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          companyId,
        },
        include: {
          service: true,
        },
      });

      if (!invoice) {
        throw new AppError(404, 'Invoice not found');
      }

      if (!invoice.serviceId || !invoice.service) {
        throw new AppError(400, 'No service linked to this invoice');
      }

      const service = invoice.service;

      // Calculate new total from service
      const newTotalAmount = service.actualCost ?? service.estimatedCost;

      // Sum all existing payments on this invoice
      const payments = await prisma.payment.aggregate({
        where: { invoiceId },
        _sum: { amount: true },
      });
      const paidAmount = payments._sum.amount || 0;
      const balanceAmount = newTotalAmount - paidAmount;

      // Determine payment status
      let paymentStatus: PaymentStatus;
      if (balanceAmount <= 0) {
        paymentStatus = PaymentStatus.PAID;
      } else if (paidAmount > 0) {
        paymentStatus = PaymentStatus.PARTIAL;
      } else {
        paymentStatus = PaymentStatus.PENDING;
      }

      // Update invoice
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          totalAmount: newTotalAmount,
          paidAmount,
          balanceAmount,
          paymentStatus,
        },
        include: {
          service: {
            select: {
              ticketNumber: true,
              deviceModel: true,
              customer: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
          payments: {
            include: {
              paymentMethod: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      Logger.info(`Invoice ${invoice.invoiceNumber} synced from service. New total: ${newTotalAmount}, Paid: ${paidAmount}, Balance: ${balanceAmount}`);

      return updatedInvoice;
    } catch (error) {
      Logger.error('Error syncing invoice from service:', error);
      throw error;
    }
  }

  /**
   * Record payment for invoice
   */
  static async recordPayment(data: RecordPaymentData): Promise<any> {
    try {
      const { invoiceId, amount, paymentMethodId, transactionId, notes, userId } = data;

      // Get invoice
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new AppError(404, 'Invoice not found');
      }

      // Validate amount
      if (amount <= 0) {
        throw new AppError(400, 'Payment amount must be greater than zero');
      }

      if (amount > invoice.balanceAmount) {
        throw new AppError(400, 'Payment amount exceeds balance amount');
      }

      // Verify payment method exists
      const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId },
      });

      if (!paymentMethod) {
        throw new AppError(404, 'Payment method not found');
      }

      // Create payment record and update invoice in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create payment
        const payment = await tx.payment.create({
          data: {
            invoiceId,
            amount,
            paymentMethodId,
            transactionId,
            notes,
          },
          include: {
            paymentMethod: {
              select: {
                name: true,
              },
            },
          },
        });

        // Update invoice amounts
        const newPaidAmount = invoice.paidAmount + amount;
        const newBalanceAmount = invoice.totalAmount - newPaidAmount;

        // Determine new payment status
        let newPaymentStatus: PaymentStatus;
        if (newBalanceAmount <= 0) {
          newPaymentStatus = PaymentStatus.PAID;
        } else if (newPaidAmount > 0) {
          newPaymentStatus = PaymentStatus.PARTIAL;
        } else {
          newPaymentStatus = PaymentStatus.PENDING;
        }

        const updatedInvoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            paymentStatus: newPaymentStatus,
          },
          include: {
            service: {
              select: {
                ticketNumber: true,
                customer: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        return { payment, invoice: updatedInvoice };
      });

      Logger.info(`Payment of ${amount} recorded for invoice ${invoice.invoiceNumber}`);

      return result;
    } catch (error) {
      Logger.error('Error recording payment:', error);
      throw error;
    }
  }

  /**
   * Regenerate invoice PDF
   */
  static async regenerateInvoicePDF(invoiceId: string, companyId: string, format: string = 'A4'): Promise<any> {
    try {
      // Get invoice with full details
      const invoice = await this.getInvoiceById(invoiceId, companyId);

      if (!invoice) {
        throw new AppError(404, 'Invoice not found');
      }

      const service = invoice.service;

      // Prepare data for PDF generation
      const pdfData = {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.createdAt,
        service: {
          ticketNumber: service.ticketNumber,
          createdAt: service.createdAt,
          deviceModel: service.deviceModel,
          issue: service.damageCondition,
          diagnosis: service.diagnosis || undefined,
          actualCost: service.actualCost || undefined,
          estimatedCost: service.estimatedCost,
          advancePayment: service.advancePayment,
          completedAt: service.completedAt || undefined,
        },
        customer: {
          name: service.customer.name,
          phone: service.customer.phone,
          address: service.customer.address || undefined,
          email: service.customer.email || undefined,
        },
        branch: service.branch,
        company: service.company,
        parts: service.partsUsed.map((sp: any) => ({
          partName: sp.item?.itemName || sp.part?.name || 'Unknown Part',
          quantity: sp.quantity,
          unitPrice: sp.unitPrice,
          totalPrice: sp.totalPrice,
        })),
        payments: invoice.payments.map((p: any) => ({
          amount: p.amount,
          paymentMethod: p.paymentMethod?.name || 'Unknown',
          transactionId: p.transactionId || undefined,
          createdAt: p.createdAt,
        })),
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        balanceAmount: invoice.balanceAmount,
        paymentStatus: invoice.paymentStatus,
      };

      // Generate new PDF with specified format
      const pdfUrl = await pdfGenerationService.generateInvoicePDF(pdfData, format);

      // Update invoice with new PDF URL only for A4 (default format)
      if (format.toLowerCase() === 'a4') {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { pdfUrl },
        });
      }

      Logger.info(`Invoice PDF regenerated for ${invoice.invoiceNumber} in ${format} format`);

      return { pdfUrl };
    } catch (error) {
      Logger.error('Error regenerating invoice PDF:', error);
      throw error;
    }
  }
}

export default InvoiceService;
