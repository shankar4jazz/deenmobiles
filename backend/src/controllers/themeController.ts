import { Request, Response } from 'express';
import { themeService } from '../services/themeService';

export const themeController = {
  /**
   * Get all themes
   * GET /api/v1/themes
   */
  async getAll(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const {
        branchId,
        isActive,
        isDefault,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const themes = await themeService.getAll({
        companyId: user.companyId,
        branchId: branchId as string | undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isDefault: isDefault === 'true' ? true : isDefault === 'false' ? false : undefined,
        search: search as string | undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      res.json(themes);
    } catch (error: any) {
      console.error('Error fetching themes:', error);
      res.status(500).json({ message: 'Failed to fetch themes', error: error.message });
    }
  },

  /**
   * Get theme by ID
   * GET /api/v1/themes/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const theme = await themeService.getById(id);
      res.json(theme);
    } catch (error: any) {
      console.error('Error fetching theme:', error);
      if (error.message === 'Theme not found') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to fetch theme', error: error.message });
      }
    }
  },

  /**
   * Get default theme
   * GET /api/v1/themes/default
   */
  async getDefault(req: Request, res: Response): Promise<any> {
    try {
      const { user } = req as any;
      const { branchId } = req.query;

      const theme = await themeService.getDefaultTheme(
        user.companyId,
        branchId as string | undefined || user.branchId
      );

      if (!theme) {
        return res.status(404).json({ message: 'No default theme found' });
      }

      return res.json(theme);
    } catch (error: any) {
      console.error('Error fetching default theme:', error);
      return res.status(500).json({ message: 'Failed to fetch default theme', error: error.message });
    }
  },

  /**
   * Create new theme
   * POST /api/v1/themes
   */
  async create(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const themeData = {
        ...req.body,
        companyId: user.companyId,
        createdBy: user.id,
      };

      const theme = await themeService.create(themeData);
      res.status(201).json(theme);
    } catch (error: any) {
      console.error('Error creating theme:', error);
      res.status(500).json({ message: 'Failed to create theme', error: error.message });
    }
  },

  /**
   * Update theme
   * PUT /api/v1/themes/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const theme = await themeService.update(id, req.body);
      res.json(theme);
    } catch (error: any) {
      console.error('Error updating theme:', error);
      if (error.message === 'Theme not found') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to update theme', error: error.message });
      }
    }
  },

  /**
   * Delete theme
   * DELETE /api/v1/themes/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await themeService.delete(id);
      res.json(result);
    } catch (error: any) {
      console.error('Error deleting theme:', error);
      if (error.message === 'Theme not found') {
        res.status(404).json({ message: error.message });
      } else if (error.message.includes('Cannot delete default theme')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to delete theme', error: error.message });
      }
    }
  },

  /**
   * Toggle theme active status
   * PATCH /api/v1/themes/:id/toggle-status
   */
  async toggleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const theme = await themeService.toggleStatus(id);
      res.json(theme);
    } catch (error: any) {
      console.error('Error toggling theme status:', error);
      if (error.message === 'Theme not found') {
        res.status(404).json({ message: error.message });
      } else if (error.message.includes('Cannot deactivate default theme')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to toggle theme status', error: error.message });
      }
    }
  },

  /**
   * Set theme as default
   * PATCH /api/v1/themes/:id/set-default
   */
  async setAsDefault(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const theme = await themeService.setAsDefault(id);
      res.json(theme);
    } catch (error: any) {
      console.error('Error setting default theme:', error);
      if (error.message === 'Theme not found') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to set default theme', error: error.message });
      }
    }
  },
};
