import { Request, Response } from 'express';
import { jobSheetTemplateCategoryService } from '../services/jobSheetTemplateCategoryService';

export const jobSheetTemplateCategoryController = {
  /**
   * Get all job sheet template categories
   * GET /api/v1/job-sheet-template-categories
   */
  async getAll(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const {
        isActive,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const categories = await jobSheetTemplateCategoryService.getAll({
        companyId: user.companyId,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search as string | undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      res.json(categories);
    } catch (error: any) {
      console.error('Error fetching job sheet template categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
    }
  },

  /**
   * Get category by ID
   * GET /api/v1/job-sheet-template-categories/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await jobSheetTemplateCategoryService.getById(id);
      res.json(category);
    } catch (error: any) {
      console.error('Error fetching job sheet template category:', error);
      if (error.message === 'Job sheet template category not found') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to fetch category', error: error.message });
      }
    }
  },

  /**
   * Create new category
   * POST /api/v1/job-sheet-template-categories
   */
  async create(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const categoryData = {
        ...req.body,
        companyId: user.companyId,
      };

      const category = await jobSheetTemplateCategoryService.create(categoryData);
      res.status(201).json(category);
    } catch (error: any) {
      console.error('Error creating job sheet template category:', error);
      if (error.message === 'A category with this name already exists') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to create category', error: error.message });
      }
    }
  },

  /**
   * Update category
   * PUT /api/v1/job-sheet-template-categories/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await jobSheetTemplateCategoryService.update(id, req.body);
      res.json(category);
    } catch (error: any) {
      console.error('Error updating job sheet template category:', error);
      if (error.message === 'Job sheet template category not found') {
        res.status(404).json({ message: error.message });
      } else if (error.message === 'A category with this name already exists') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to update category', error: error.message });
      }
    }
  },

  /**
   * Delete category
   * DELETE /api/v1/job-sheet-template-categories/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await jobSheetTemplateCategoryService.delete(id);
      res.json(result);
    } catch (error: any) {
      console.error('Error deleting job sheet template category:', error);
      if (error.message === 'Job sheet template category not found') {
        res.status(404).json({ message: error.message });
      } else if (error.message === 'Cannot delete category that has templates assigned to it') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to delete category', error: error.message });
      }
    }
  },

  /**
   * Toggle category status
   * PATCH /api/v1/job-sheet-template-categories/:id/toggle-status
   */
  async toggleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await jobSheetTemplateCategoryService.toggleStatus(id);
      res.json(category);
    } catch (error: any) {
      console.error('Error toggling job sheet template category status:', error);
      if (error.message === 'Job sheet template category not found') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to toggle category status', error: error.message });
      }
    }
  },
};
