import { Request, Response } from 'express';
import { CustomerService } from '../services/customerService';
import { AuthRequest } from '../types';

export class CustomerController {
  /**
   * Create a new customer
   */
  static async createCustomer(req: AuthRequest, res: Response) {
    try {
      const { companyId, role } = req.user!;
      const {
        name,
        phone,
        whatsappNumber,
        alternativeMobile,
        email,
        address,
        idProofType,
        remarks,
        branchId,
      } = req.body;

      // Validate required fields
      if (!name || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Name and phone are required',
        });
      }

      // Get ID proof document URL from S3 upload middleware
      const idProofDocumentUrl = req.body.idProofDocumentUrl;

      const customer = await CustomerService.createCustomer({
        name,
        phone,
        whatsappNumber: whatsappNumber || undefined,
        alternativeMobile: alternativeMobile || undefined,
        email: email || undefined,
        address: address || undefined,
        idProofType: idProofType || undefined,
        idProofDocumentUrl: idProofDocumentUrl || undefined,
        remarks: remarks || undefined,
        companyId,
        branchId: branchId || undefined,
      });

      return res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer,
      });
    } catch (error: any) {
      console.error('Error creating customer:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create customer',
      });
    }
  }

  /**
   * Get all customers with filters
   */
  static async getAllCustomers(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { branchId, search, page, limit } = req.query;

      const result = await CustomerService.getAllCustomers({
        companyId,
        branchId: branchId as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return res.status(200).json({
        success: true,
        data: result.customers,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch customers',
      });
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const customer = await CustomerService.getCustomerById(id, companyId);

      return res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error: any) {
      console.error('Error fetching customer:', error);
      return res.status(404).json({
        success: false,
        message: error.message || 'Customer not found',
      });
    }
  }

  /**
   * Update customer
   */
  static async updateCustomer(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;
      const {
        name,
        phone,
        whatsappNumber,
        alternativeMobile,
        email,
        address,
        idProofType,
        remarks,
        branchId,
        removeIdProof,
      } = req.body;

      // Get ID proof document URL from S3 upload middleware
      const idProofDocumentUrl = req.body.idProofDocumentUrl;

      // Prepare update data
      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber || undefined;
      if (alternativeMobile !== undefined) updateData.alternativeMobile = alternativeMobile || undefined;
      if (email !== undefined) updateData.email = email || undefined;
      if (address !== undefined) updateData.address = address || undefined;
      if (idProofType !== undefined) updateData.idProofType = idProofType || undefined;
      if (remarks !== undefined) updateData.remarks = remarks || undefined;
      if (branchId !== undefined) updateData.branchId = branchId || undefined;

      // Handle ID proof document
      if (removeIdProof === 'true' || removeIdProof === true) {
        updateData.idProofDocumentUrl = null;
      } else if (idProofDocumentUrl) {
        updateData.idProofDocumentUrl = idProofDocumentUrl;
      }

      const customer = await CustomerService.updateCustomer(
        id,
        companyId,
        updateData
      );

      return res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
        data: customer,
      });
    } catch (error: any) {
      console.error('Error updating customer:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update customer',
      });
    }
  }

  /**
   * Delete customer
   */
  static async deleteCustomer(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { id } = req.params;

      const result = await CustomerService.deleteCustomer(id, companyId);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete customer',
      });
    }
  }

  /**
   * Check phone number availability
   */
  static async checkPhoneAvailability(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { phone, customerId } = req.query;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required',
        });
      }

      const isAvailable = await CustomerService.checkPhoneAvailability(
        phone as string,
        companyId,
        customerId as string
      );

      return res.status(200).json({
        success: true,
        available: isAvailable,
      });
    } catch (error: any) {
      console.error('Error checking phone availability:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to check phone availability',
      });
    }
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(req: AuthRequest, res: Response) {
    try {
      const { companyId } = req.user!;
      const { branchId } = req.query;

      const stats = await CustomerService.getCustomerStats(
        companyId,
        branchId as string
      );

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching customer stats:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch customer statistics',
      });
    }
  }
}
