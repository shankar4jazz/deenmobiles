import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';
import { DocumentType, SequenceResetFrequency } from '@prisma/client';

interface DocumentNumberFormat {
  id: string;
  documentType: DocumentType;
  prefix: string;
  separator: string;
  sequenceResetFrequency: SequenceResetFrequency;
  sequenceLength: number;
  includeBranch: boolean;
  branchFormat: string;
  includeYear: boolean;
  yearFormat: string;
  includeMonth: boolean;
  includeDay: boolean;
  companyId: string;
}

interface CreateFormatData {
  documentType: DocumentType;
  prefix?: string;
  separator?: string;
  sequenceResetFrequency?: SequenceResetFrequency;
  sequenceLength?: number;
  includeBranch?: boolean;
  branchFormat?: string;
  includeYear?: boolean;
  yearFormat?: string;
  includeMonth?: boolean;
  includeDay?: boolean;
}

interface UpdateFormatData {
  prefix?: string;
  separator?: string;
  sequenceResetFrequency?: SequenceResetFrequency;
  sequenceLength?: number;
  includeBranch?: boolean;
  branchFormat?: string;
  includeYear?: boolean;
  yearFormat?: string;
  includeMonth?: boolean;
  includeDay?: boolean;
}

export class DocumentNumberService {
  /**
   * Get document number format for a company and document type
   */
  static async getFormat(
    companyId: string,
    documentType: DocumentType
  ): Promise<DocumentNumberFormat | null> {
    return prisma.documentNumberFormat.findUnique({
      where: {
        companyId_documentType: {
          companyId,
          documentType,
        },
      },
    });
  }

  /**
   * Get all formats for a company
   */
  static async getAllFormats(companyId: string) {
    return prisma.documentNumberFormat.findMany({
      where: { companyId },
      orderBy: { documentType: 'asc' },
    });
  }

  /**
   * Create or update a document number format
   */
  static async upsertFormat(
    companyId: string,
    data: CreateFormatData
  ): Promise<DocumentNumberFormat> {
    const { documentType, ...formatData } = data;

    return prisma.documentNumberFormat.upsert({
      where: {
        companyId_documentType: {
          companyId,
          documentType,
        },
      },
      create: {
        companyId,
        documentType,
        ...formatData,
      },
      update: formatData,
    });
  }

  /**
   * Update an existing format
   */
  static async updateFormat(
    companyId: string,
    documentType: DocumentType,
    data: UpdateFormatData
  ): Promise<DocumentNumberFormat> {
    const existingFormat = await this.getFormat(companyId, documentType);

    if (!existingFormat) {
      throw new AppError(404, 'Document number format not found');
    }

    return prisma.documentNumberFormat.update({
      where: {
        companyId_documentType: {
          companyId,
          documentType,
        },
      },
      data,
    });
  }

  /**
   * Generate the period key based on reset frequency
   */
  private static getPeriodKey(frequency: SequenceResetFrequency): string | null {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    switch (frequency) {
      case SequenceResetFrequency.NEVER:
        return null;
      case SequenceResetFrequency.YEARLY:
        return `${year}`;
      case SequenceResetFrequency.MONTHLY:
        return `${year}-${month}`;
      case SequenceResetFrequency.DAILY:
        return `${year}-${month}-${day}`;
      default:
        return null;
    }
  }

  /**
   * Get next sequence number atomically
   */
  private static async getNextSequence(
    formatId: string,
    branchId: string | null,
    periodKey: string | null
  ): Promise<number> {
    // Use a transaction with serializable isolation for atomic increment
    const result = await prisma.$transaction(async (tx) => {
      // Try to find existing sequence using findFirst for proper null handling
      const existing = await tx.documentSequence.findFirst({
        where: {
          formatId,
          branchId: branchId || null,
          periodKey: periodKey || null,
        },
      });

      if (existing) {
        // Increment existing sequence
        const updated = await tx.documentSequence.update({
          where: { id: existing.id },
          data: { currentSequence: existing.currentSequence + 1 },
        });
        return updated.currentSequence;
      } else {
        // Create new sequence starting at 1
        const created = await tx.documentSequence.create({
          data: {
            formatId,
            branchId: branchId || null,
            periodKey: periodKey || null,
            currentSequence: 1,
          },
        });
        return created.currentSequence;
      }
    });

    return result;
  }

  /**
   * Generate a document number
   */
  static async generateNumber(
    companyId: string,
    documentType: DocumentType,
    branchId: string
  ): Promise<string> {
    try {
      Logger.info(`Generating ${documentType} number for company ${companyId}, branch ${branchId}`);

      // Get or create format with defaults
      let format = await this.getFormat(companyId, documentType);

      if (!format) {
        Logger.info(`No format found for ${documentType}, creating default`);
        // Create default format based on document type
        const defaultPrefix = documentType === DocumentType.JOB_SHEET ? 'JS' :
                              documentType === DocumentType.INVOICE ? 'INV' :
                              documentType === DocumentType.ESTIMATE ? 'EST' : 'TKT';

        format = await this.upsertFormat(companyId, {
          documentType,
          prefix: defaultPrefix,
          separator: '-',
          sequenceResetFrequency: SequenceResetFrequency.YEARLY,
          sequenceLength: 3,
          includeBranch: true,
          branchFormat: 'CODE',
          includeYear: true,
          yearFormat: 'FULL',
          includeMonth: false,
          includeDay: false,
        });
        Logger.info(`Created default format with id ${format.id}`);
      }

      // Get branch info if needed
      let branchPart = '';
      if (format.includeBranch) {
        const branch = await prisma.branch.findUnique({
          where: { id: branchId },
          select: { code: true, id: true },
        });

        if (!branch) {
          throw new AppError(404, 'Branch not found');
        }

        branchPart = format.branchFormat === 'CODE' ? branch.code : branch.id.slice(-4);
      }

      // Build date parts
      const now = new Date();
      const year = format.yearFormat === 'FULL'
        ? now.getFullYear().toString()
        : now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');

      // Get period key for sequence
      const periodKey = this.getPeriodKey(format.sequenceResetFrequency);

      // Get next sequence number
      const sequence = await this.getNextSequence(
        format.id,
        format.includeBranch ? branchId : null,
        periodKey
      );

      // Pad sequence number
      const sequencePart = sequence.toString().padStart(format.sequenceLength, '0');

      // Build the document number
      const parts: string[] = [format.prefix];

      if (format.includeBranch && branchPart) {
        parts.push(branchPart);
      }

      if (format.includeYear) {
        parts.push(year);
      }

      if (format.includeMonth) {
        parts.push(month);
      }

      if (format.includeDay) {
        parts.push(day);
      }

      parts.push(sequencePart);

      const documentNumber = parts.join(format.separator);

      Logger.info(`Generated ${documentType} number: ${documentNumber}`);
      return documentNumber;
    } catch (error) {
      Logger.error(`Error generating document number for ${documentType}:`, error);
      throw error;
    }
  }

  /**
   * Preview what a format would look like
   */
  static previewFormat(
    format: UpdateFormatData & { prefix?: string; separator?: string },
    branchCode: string = 'DS1'
  ): string {
    const prefix = format.prefix || 'JS';
    const separator = format.separator || '-';
    const sequenceLength = format.sequenceLength || 3;
    const includeBranch = format.includeBranch ?? true;
    const includeYear = format.includeYear ?? true;
    const yearFormat = format.yearFormat || 'FULL';
    const includeMonth = format.includeMonth ?? false;
    const includeDay = format.includeDay ?? false;

    const now = new Date();
    const year = yearFormat === 'FULL'
      ? now.getFullYear().toString()
      : now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    const parts: string[] = [prefix];

    if (includeBranch) {
      parts.push(branchCode);
    }

    if (includeYear) {
      parts.push(year);
    }

    if (includeMonth) {
      parts.push(month);
    }

    if (includeDay) {
      parts.push(day);
    }

    parts.push('1'.padStart(sequenceLength, '0'));

    return parts.join(separator);
  }

  /**
   * Reset sequence for a specific format and period
   * Useful for manual reset or testing
   */
  static async resetSequence(
    formatId: string,
    branchId: string | null,
    periodKey: string | null
  ): Promise<void> {
    await prisma.documentSequence.updateMany({
      where: {
        formatId,
        branchId: branchId || null,
        periodKey: periodKey || null,
      },
      data: {
        currentSequence: 0,
      },
    });
  }

  /**
   * Get current sequence info for a format
   */
  static async getSequenceInfo(
    companyId: string,
    documentType: DocumentType,
    branchId: string
  ) {
    const format = await this.getFormat(companyId, documentType);

    if (!format) {
      return null;
    }

    const periodKey = this.getPeriodKey(format.sequenceResetFrequency);

    // Use findFirst for proper null handling
    const sequence = await prisma.documentSequence.findFirst({
      where: {
        formatId: format.id,
        branchId: format.includeBranch ? branchId : null,
        periodKey: periodKey || null,
      },
    });

    return {
      format,
      currentSequence: sequence?.currentSequence || 0,
      periodKey,
    };
  }
}

export default DocumentNumberService;
