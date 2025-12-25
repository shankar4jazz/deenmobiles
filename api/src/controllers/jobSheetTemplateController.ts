import { Request, Response } from 'express';
import { jobSheetTemplateService } from '../services/jobSheetTemplateService';

export const jobSheetTemplateController = {
  /**
   * Get all job sheet templates
   * GET /api/v1/job-sheet-templates
   */
  async getAll(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const {
        branchId,
        categoryId,
        isActive,
        isDefault,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const templates = await jobSheetTemplateService.getAll({
        companyId: user.companyId,
        branchId: branchId as string | undefined,
        categoryId: categoryId as string | undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isDefault: isDefault === 'true' ? true : isDefault === 'false' ? false : undefined,
        search: search as string | undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      res.json(templates);
    } catch (error: any) {
      console.error('Error fetching job sheet templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates', error: error.message });
    }
  },

  /**
   * Get template by ID
   * GET /api/v1/job-sheet-templates/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await jobSheetTemplateService.getById(id);
      res.json(template);
    } catch (error: any) {
      console.error('Error fetching job sheet template:', error);
      if (error.message === 'Job sheet template not found') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to fetch template', error: error.message });
      }
    }
  },

  /**
   * Get default template
   * GET /api/v1/job-sheet-templates/default
   */
  async getDefault(req: Request, res: Response): Promise<any> {
    try {
      const { user } = req as any;
      const { branchId } = req.query;

      const template = await jobSheetTemplateService.getDefaultTemplate(
        user.companyId,
        branchId as string | undefined || user.branchId
      );

      if (!template) {
        return res.status(404).json({ message: 'No default template found' });
      }

      return res.json(template);
    } catch (error: any) {
      console.error('Error fetching default job sheet template:', error);
      return res.status(500).json({ message: 'Failed to fetch default template', error: error.message });
    }
  },

  /**
   * Create new template
   * POST /api/v1/job-sheet-templates
   */
  async create(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const templateData = {
        ...req.body,
        companyId: user.companyId,
        createdBy: user.id,
      };

      const template = await jobSheetTemplateService.create(templateData);
      res.status(201).json(template);
    } catch (error: any) {
      console.error('Error creating job sheet template:', error);
      if (error.message.includes('category not found') || error.message.includes('Category does not belong')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to create template', error: error.message });
      }
    }
  },

  /**
   * Update template
   * PUT /api/v1/job-sheet-templates/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await jobSheetTemplateService.update(id, req.body);
      res.json(template);
    } catch (error: any) {
      console.error('Error updating job sheet template:', error);
      if (error.message === 'Job sheet template not found') {
        res.status(404).json({ message: error.message });
      } else if (error.message.includes('category not found') || error.message.includes('Category does not belong')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to update template', error: error.message });
      }
    }
  },

  /**
   * Delete template
   * DELETE /api/v1/job-sheet-templates/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await jobSheetTemplateService.delete(id);
      res.json(result);
    } catch (error: any) {
      console.error('Error deleting job sheet template:', error);
      if (error.message === 'Job sheet template not found') {
        res.status(404).json({ message: error.message });
      } else if (error.message === 'Cannot delete template that is being used by job sheets') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to delete template', error: error.message });
      }
    }
  },

  /**
   * Toggle template status
   * PATCH /api/v1/job-sheet-templates/:id/toggle-status
   */
  async toggleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await jobSheetTemplateService.toggleStatus(id);
      res.json(template);
    } catch (error: any) {
      console.error('Error toggling job sheet template status:', error);
      if (error.message === 'Job sheet template not found') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to toggle template status', error: error.message });
      }
    }
  },

  /**
   * Set template as default
   * PATCH /api/v1/job-sheet-templates/:id/set-default
   */
  async setAsDefault(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await jobSheetTemplateService.setAsDefault(id);
      res.json(template);
    } catch (error: any) {
      console.error('Error setting job sheet template as default:', error);
      if (error.message === 'Job sheet template not found') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to set template as default', error: error.message });
      }
    }
  },
};
