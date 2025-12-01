import prisma from '../config/database';
import { PointsType, NotificationType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';

interface CreateLevelData {
  companyId: string;
  name: string;
  code: string;
  minPoints: number;
  maxPoints?: number | null;
  pointsMultiplier?: number;
  incentivePercent?: number;
  badgeColor?: string;
  description?: string;
  sortOrder?: number;
}

interface UpdateLevelData {
  name?: string;
  minPoints?: number;
  maxPoints?: number | null;
  pointsMultiplier?: number;
  incentivePercent?: number;
  badgeColor?: string;
  description?: string;
  sortOrder?: number;
}

export class LevelService {
  /**
   * Create a new technician level
   */
  static async createLevel(data: CreateLevelData) {
    try {
      // Check if code already exists for this company
      const existingLevel = await prisma.technicianLevel.findFirst({
        where: {
          companyId: data.companyId,
          code: data.code,
        },
      });

      if (existingLevel) {
        throw new AppError(400, 'Level code already exists');
      }

      const level = await prisma.technicianLevel.create({
        data: {
          companyId: data.companyId,
          name: data.name,
          code: data.code.toUpperCase(),
          minPoints: data.minPoints,
          maxPoints: data.maxPoints ?? null,
          pointsMultiplier: data.pointsMultiplier ?? 1.0,
          incentivePercent: data.incentivePercent ?? 0,
          badgeColor: data.badgeColor,
          description: data.description,
          sortOrder: data.sortOrder ?? 0,
        },
      });

      Logger.info('Technician level created', { levelId: level.id, code: level.code });

      return level;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating level', { error });
      throw new AppError(500, 'Failed to create technician level');
    }
  }

  /**
   * Get all levels for a company
   */
  static async getLevels(companyId: string) {
    try {
      const levels = await prisma.technicianLevel.findMany({
        where: { companyId },
        include: {
          _count: {
            select: { technicians: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      return levels.map((level) => ({
        ...level,
        technicianCount: level._count.technicians,
      }));
    } catch (error) {
      Logger.error('Error fetching levels', { error, companyId });
      throw new AppError(500, 'Failed to fetch levels');
    }
  }

  /**
   * Get level by ID
   */
  static async getLevelById(levelId: string, companyId: string) {
    try {
      const level = await prisma.technicianLevel.findFirst({
        where: { id: levelId, companyId },
        include: {
          technicians: {
            include: {
              user: {
                select: { id: true, name: true, email: true, profileImage: true },
              },
            },
            take: 10,
          },
          _count: {
            select: { technicians: true },
          },
        },
      });

      if (!level) {
        throw new AppError(404, 'Level not found');
      }

      return {
        ...level,
        technicianCount: level._count.technicians,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching level', { error, levelId });
      throw new AppError(500, 'Failed to fetch level');
    }
  }

  /**
   * Update level
   */
  static async updateLevel(levelId: string, companyId: string, data: UpdateLevelData) {
    try {
      const existing = await prisma.technicianLevel.findFirst({
        where: { id: levelId, companyId },
      });

      if (!existing) {
        throw new AppError(404, 'Level not found');
      }

      const level = await prisma.technicianLevel.update({
        where: { id: levelId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.minPoints !== undefined && { minPoints: data.minPoints }),
          ...(data.maxPoints !== undefined && { maxPoints: data.maxPoints }),
          ...(data.pointsMultiplier !== undefined && { pointsMultiplier: data.pointsMultiplier }),
          ...(data.incentivePercent !== undefined && { incentivePercent: data.incentivePercent }),
          ...(data.badgeColor !== undefined && { badgeColor: data.badgeColor }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        },
      });

      Logger.info('Technician level updated', { levelId });

      return level;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating level', { error, levelId });
      throw new AppError(500, 'Failed to update level');
    }
  }

  /**
   * Delete level
   */
  static async deleteLevel(levelId: string, companyId: string) {
    try {
      const level = await prisma.technicianLevel.findFirst({
        where: { id: levelId, companyId },
        include: {
          _count: {
            select: { technicians: true },
          },
        },
      });

      if (!level) {
        throw new AppError(404, 'Level not found');
      }

      if (level._count.technicians > 0) {
        throw new AppError(
          400,
          `Cannot delete level with ${level._count.technicians} technicians. Reassign technicians first.`
        );
      }

      await prisma.technicianLevel.delete({
        where: { id: levelId },
      });

      Logger.info('Technician level deleted', { levelId });

      return { message: 'Level deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deleting level', { error, levelId });
      throw new AppError(500, 'Failed to delete level');
    }
  }

  /**
   * Get promotion candidates (technicians eligible for promotion)
   */
  static async getPromotionCandidates(companyId: string) {
    try {
      const profiles = await prisma.technicianProfile.findMany({
        where: { companyId },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, profileImage: true },
          },
          currentLevel: true,
          branch: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      const candidates = [];

      for (const profile of profiles) {
        // Find the level they should be at based on points
        const appropriateLevel = await prisma.technicianLevel.findFirst({
          where: {
            companyId,
            minPoints: { lte: profile.totalPoints },
            OR: [
              { maxPoints: { gte: profile.totalPoints } },
              { maxPoints: null },
            ],
          },
          orderBy: { minPoints: 'desc' },
        });

        // Check if they're at a lower level than they should be
        if (
          appropriateLevel &&
          (!profile.currentLevel ||
            appropriateLevel.minPoints > profile.currentLevel.minPoints)
        ) {
          candidates.push({
            profile,
            currentLevel: profile.currentLevel,
            eligibleLevel: appropriateLevel,
            totalPoints: profile.totalPoints,
            pointsAboveThreshold: profile.totalPoints - appropriateLevel.minPoints,
          });
        }
      }

      return candidates.sort((a, b) => b.pointsAboveThreshold - a.pointsAboveThreshold);
    } catch (error) {
      Logger.error('Error fetching promotion candidates', { error, companyId });
      throw new AppError(500, 'Failed to fetch promotion candidates');
    }
  }

  /**
   * Promote technician to next level
   */
  static async promoteTechnician(
    technicianUserId: string,
    companyId: string,
    toLevelId: string,
    promotedBy: string,
    notes?: string
  ) {
    try {
      const profile = await prisma.technicianProfile.findFirst({
        where: { userId: technicianUserId, companyId },
        include: { currentLevel: true, user: true },
      });

      if (!profile) {
        throw new AppError(404, 'Technician profile not found');
      }

      const toLevel = await prisma.technicianLevel.findFirst({
        where: { id: toLevelId, companyId },
      });

      if (!toLevel) {
        throw new AppError(404, 'Target level not found');
      }

      // Verify points requirement
      if (profile.totalPoints < toLevel.minPoints) {
        throw new AppError(
          400,
          `Technician has ${profile.totalPoints} points but ${toLevel.minPoints} required for ${toLevel.name}`
        );
      }

      // Create promotion record
      const promotion = await prisma.technicianPromotion.create({
        data: {
          technicianProfileId: profile.id,
          fromLevelId: profile.currentLevelId,
          toLevelId: toLevel.id,
          pointsAtPromotion: profile.totalPoints,
          promotedBy,
          notes,
        },
      });

      // Update profile level
      await prisma.technicianProfile.update({
        where: { id: profile.id },
        data: {
          currentLevelId: toLevel.id,
          levelPromotedAt: new Date(),
        },
      });

      // Award promotion bonus points
      const bonusPoints = Math.floor(toLevel.minPoints * 0.05); // 5% of level threshold as bonus
      if (bonusPoints > 0) {
        await prisma.technicianPointsHistory.create({
          data: {
            technicianProfileId: profile.id,
            points: bonusPoints,
            type: PointsType.PROMOTION_BONUS,
            description: `Promotion to ${toLevel.name} bonus`,
            basePoints: bonusPoints,
            bonusMultiplier: 1.0,
          },
        });

        await prisma.technicianProfile.update({
          where: { id: profile.id },
          data: { totalPoints: profile.totalPoints + bonusPoints },
        });
      }

      // Send notification to technician
      await prisma.technicianNotification.create({
        data: {
          userId: profile.userId,
          type: NotificationType.LEVEL_PROMOTION,
          title: 'Congratulations on Your Promotion!',
          message: `You have been promoted to ${toLevel.name}! ${bonusPoints > 0 ? `You earned ${bonusPoints} bonus points.` : ''}`,
          data: {
            fromLevel: profile.currentLevel?.name,
            toLevel: toLevel.name,
            bonusPoints,
          },
        },
      });

      Logger.info('Technician promoted', {
        profileId: profile.id,
        fromLevel: profile.currentLevel?.name,
        toLevel: toLevel.name,
      });

      return {
        promotion,
        toLevel,
        bonusPoints,
        technician: profile.user,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error promoting technician', { error, technicianUserId });
      throw new AppError(500, 'Failed to promote technician');
    }
  }

  /**
   * Get promotion history for technician
   */
  static async getPromotionHistory(technicianUserId: string, companyId: string) {
    try {
      const profile = await prisma.technicianProfile.findFirst({
        where: { userId: technicianUserId, companyId },
      });

      if (!profile) {
        throw new AppError(404, 'Technician profile not found');
      }

      const promotions = await prisma.technicianPromotion.findMany({
        where: { technicianProfileId: profile.id },
        include: {
          fromLevel: true,
          toLevel: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return promotions;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching promotion history', { error, technicianUserId });
      throw new AppError(500, 'Failed to fetch promotion history');
    }
  }

  /**
   * Initialize default levels for a company
   */
  static async initializeDefaultLevels(companyId: string) {
    try {
      // Check if levels already exist
      const existingLevels = await prisma.technicianLevel.count({
        where: { companyId },
      });

      if (existingLevels > 0) {
        Logger.info('Levels already exist for company', { companyId });
        return { message: 'Levels already initialized' };
      }

      const defaultLevels = [
        {
          name: 'Trainee',
          code: 'TRAINEE',
          minPoints: 0,
          maxPoints: 4999,
          pointsMultiplier: 0.8,
          incentivePercent: 0,
          badgeColor: '#9CA3AF',
          sortOrder: 1,
        },
        {
          name: 'Junior Technician',
          code: 'JUNIOR',
          minPoints: 5000,
          maxPoints: 14999,
          pointsMultiplier: 1.0,
          incentivePercent: 2,
          badgeColor: '#10B981',
          sortOrder: 2,
        },
        {
          name: 'Technician',
          code: 'TECHNICIAN',
          minPoints: 15000,
          maxPoints: 49999,
          pointsMultiplier: 1.1,
          incentivePercent: 3,
          badgeColor: '#3B82F6',
          sortOrder: 3,
        },
        {
          name: 'Senior Technician',
          code: 'SENIOR',
          minPoints: 50000,
          maxPoints: 99999,
          pointsMultiplier: 1.2,
          incentivePercent: 5,
          badgeColor: '#8B5CF6',
          sortOrder: 4,
        },
        {
          name: 'Expert Technician',
          code: 'EXPERT',
          minPoints: 100000,
          maxPoints: 199999,
          pointsMultiplier: 1.5,
          incentivePercent: 8,
          badgeColor: '#F59E0B',
          sortOrder: 5,
        },
        {
          name: 'Master Technician',
          code: 'MASTER',
          minPoints: 200000,
          maxPoints: null,
          pointsMultiplier: 2.0,
          incentivePercent: 10,
          badgeColor: '#EF4444',
          sortOrder: 6,
        },
      ];

      await prisma.technicianLevel.createMany({
        data: defaultLevels.map((level) => ({
          ...level,
          companyId,
        })),
      });

      Logger.info('Default levels initialized', { companyId });

      return { message: 'Default levels created', count: defaultLevels.length };
    } catch (error) {
      Logger.error('Error initializing default levels', { error, companyId });
      throw new AppError(500, 'Failed to initialize default levels');
    }
  }
}
