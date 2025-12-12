import { Response } from 'express';
import { DocumentNumberService } from '../services/documentNumberService';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { DocumentType } from '@prisma/client';

export class DocumentNumberController {
  /**
   * GET /api/v1/document-numbers
   * Get all document number formats for the company
   */
  static getAllFormats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;

    const formats = await DocumentNumberService.getAllFormats(companyId);

    return ApiResponse.success(res, formats, 'Document number formats retrieved successfully');
  });

  /**
   * GET /api/v1/document-numbers/:documentType
   * Get a specific document number format
   */
  static getFormat = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { documentType } = req.params;

    const format = await DocumentNumberService.getFormat(
      companyId,
      documentType as DocumentType
    );

    if (!format) {
      return ApiResponse.success(res, null, 'No custom format found, using defaults');
    }

    return ApiResponse.success(res, format, 'Document number format retrieved successfully');
  });

  /**
   * PUT /api/v1/document-numbers/:documentType
   * Create or update a document number format
   */
  static upsertFormat = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const { documentType } = req.params;
    const data = req.body;

    const format = await DocumentNumberService.upsertFormat(companyId, {
      documentType: documentType as DocumentType,
      ...data,
    });

    return ApiResponse.success(res, format, 'Document number format updated successfully');
  });

  /**
   * POST /api/v1/document-numbers/preview
   * Preview what a format would look like
   */
  static previewFormat = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { format, branchCode } = req.body;

    const preview = DocumentNumberService.previewFormat(format, branchCode);

    return ApiResponse.success(res, { preview }, 'Format preview generated successfully');
  });

  /**
   * GET /api/v1/document-numbers/:documentType/sequence
   * Get current sequence info for a document type
   */
  static getSequenceInfo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const companyId = req.user!.companyId;
    const branchId = req.user!.branchId;
    const { documentType } = req.params;

    if (!branchId) {
      return ApiResponse.error(res, 'Branch ID is required', 400);
    }

    const info = await DocumentNumberService.getSequenceInfo(
      companyId,
      documentType as DocumentType,
      branchId
    );

    return ApiResponse.success(res, info, 'Sequence info retrieved successfully');
  });
}
