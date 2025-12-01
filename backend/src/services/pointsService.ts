import prisma from '../config/database';
import { PointsType, ServiceStatus, NotificationType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';

interface PointsBreakdownItem {
  type: PointsType;
  points: number;
  basePoints: number;
  description: string;
}

interface PointsCalculationResult {
  totalPoints: number;
  breakdown: PointsBreakdownItem[];
}

interface AwardPointsData {
  technicianProfileId: string;
  points: number;
  type: PointsType;
  description: string;
  serviceId?: string;
  basePoints: number;
  bonusMultiplier?: number;
}

export class PointsService {
  /**
   * Calculate points for a completed service
   */
  static async calculateServicePoints(
    serviceId: string,
    technicianUserId: string,
    rating?: number
  ): Promise<PointsCalculationResult> {
    try {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          serviceCategory: true,
          assignedTo: {
            include: {
              technicianProfile: {
                include: { currentLevel: true },
              },
            },
          },
        },
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      const profile = service.assignedTo?.technicianProfile;
      if (!profile) {
        throw new AppError(404, 'Technician profile not found');
      }

      const breakdown: PointsBreakdownItem[] = [];
      const levelMultiplier = profile.currentLevel?.pointsMultiplier || 1.0;

      // Base points from service category
      const basePoints = service.serviceCategory?.technicianPoints || 100;
      const categoryPoints = Math.floor(basePoints * levelMultiplier);

      breakdown.push({
        type: PointsType.SERVICE_COMPLETED,
        points: categoryPoints,
        basePoints,
        description: `${service.serviceCategory?.name || 'Service'} completed`,
      });

      // Rating bonus
      if (rating === 5) {
        const ratingBonus = Math.floor(50 * levelMultiplier);
        breakdown.push({
          type: PointsType.RATING_BONUS,
          points: ratingBonus,
          basePoints: 50,
          description: '5-star rating bonus',
        });
      } else if (rating === 4) {
        const ratingBonus = Math.floor(20 * levelMultiplier);
        breakdown.push({
          type: PointsType.RATING_BONUS,
          points: ratingBonus,
          basePoints: 20,
          description: '4-star rating bonus',
        });
      }

      // Speed bonus (if completed 20% faster than technician's average)
      if (profile.avgCompletionHours && service.completedAt && service.createdAt) {
        const completionHours =
          (service.completedAt.getTime() - service.createdAt.getTime()) / (1000 * 60 * 60);
        if (completionHours < profile.avgCompletionHours * 0.8) {
          const speedBonus = Math.floor(25 * levelMultiplier);
          breakdown.push({
            type: PointsType.SPEED_BONUS,
            points: speedBonus,
            basePoints: 25,
            description: 'Fast completion bonus',
          });
        }
      }

      const totalPoints = breakdown.reduce((sum, item) => sum + item.points, 0);

      return { totalPoints, breakdown };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error calculating service points', { error, serviceId });
      throw new AppError(500, 'Failed to calculate points');
    }
  }

  /**
   * Award points to technician
   */
  static async awardPoints(data: AwardPointsData) {
    try {
      const profile = await prisma.technicianProfile.findUnique({
        where: { id: data.technicianProfileId },
        include: { user: true, currentLevel: true },
      });

      if (!profile) {
        throw new AppError(404, 'Technician profile not found');
      }

      // Create points history entry
      const pointsHistory = await prisma.technicianPointsHistory.create({
        data: {
          technicianProfileId: data.technicianProfileId,
          points: data.points,
          type: data.type,
          description: data.description,
          serviceId: data.serviceId,
          basePoints: data.basePoints,
          bonusMultiplier: data.bonusMultiplier || 1.0,
        },
      });

      // Update total points
      const newTotalPoints = profile.totalPoints + data.points;
      await prisma.technicianProfile.update({
        where: { id: data.technicianProfileId },
        data: { totalPoints: newTotalPoints },
      });

      // Check for level promotion
      const nextLevel = await prisma.technicianLevel.findFirst({
        where: {
          companyId: profile.companyId,
          minPoints: { lte: newTotalPoints },
          OR: [
            { maxPoints: { gte: newTotalPoints } },
            { maxPoints: null },
          ],
        },
        orderBy: { minPoints: 'desc' },
      });

      if (nextLevel && nextLevel.id !== profile.currentLevelId) {
        // Technician is eligible for promotion - create notification for admin
        await prisma.technicianNotification.create({
          data: {
            userId: profile.userId,
            type: NotificationType.LEVEL_PROMOTION,
            title: 'Level Promotion Available!',
            message: `Congratulations! You are now eligible for promotion to ${nextLevel.name}.`,
            data: {
              currentLevel: profile.currentLevel?.name,
              newLevel: nextLevel.name,
              totalPoints: newTotalPoints,
            },
          },
        });

        Logger.info('Technician eligible for promotion', {
          profileId: data.technicianProfileId,
          newLevel: nextLevel.name,
        });
      }

      // Create points earned notification
      await prisma.technicianNotification.create({
        data: {
          userId: profile.userId,
          type: NotificationType.POINTS_EARNED,
          title: 'Points Earned!',
          message: `You earned ${data.points} points for ${data.description}`,
          data: {
            points: data.points,
            type: data.type,
            serviceId: data.serviceId,
          },
        },
      });

      Logger.info('Points awarded', {
        profileId: data.technicianProfileId,
        points: data.points,
        type: data.type,
      });

      return {
        pointsHistory,
        newTotalPoints,
        eligibleForPromotion: nextLevel && nextLevel.id !== profile.currentLevelId,
        nextLevel,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error awarding points', { error });
      throw new AppError(500, 'Failed to award points');
    }
  }

  /**
   * Award points when service is completed
   */
  static async onServiceCompleted(serviceId: string, rating?: number) {
    try {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          assignedTo: {
            include: {
              technicianProfile: true,
            },
          },
        },
      });

      if (!service || !service.assignedTo?.technicianProfile) {
        Logger.warn('No technician profile found for service completion', { serviceId });
        return null;
      }

      const profile = service.assignedTo.technicianProfile;

      // Calculate points
      const { totalPoints, breakdown } = await this.calculateServicePoints(
        serviceId,
        service.assignedToId!,
        rating
      );

      // Award each type of points
      for (const item of breakdown) {
        await this.awardPoints({
          technicianProfileId: profile.id,
          points: item.points,
          type: item.type,
          description: item.description,
          serviceId,
          basePoints: item.basePoints,
          bonusMultiplier: profile.currentLevel?.pointsMultiplier || 1.0,
        });
      }

      // Update performance metrics
      const servicesCompleted = profile.totalServicesCompleted + 1;
      const newRevenue = parseFloat(profile.totalRevenue.toString()) + (service.actualCost || service.estimatedCost);

      // Calculate new average completion time
      let avgCompletionHours = profile.avgCompletionHours;
      if (service.completedAt && service.createdAt) {
        const completionHours =
          (service.completedAt.getTime() - service.createdAt.getTime()) / (1000 * 60 * 60);
        if (avgCompletionHours) {
          avgCompletionHours =
            (avgCompletionHours * profile.totalServicesCompleted + completionHours) / servicesCompleted;
        } else {
          avgCompletionHours = completionHours;
        }
      }

      await prisma.technicianProfile.update({
        where: { id: profile.id },
        data: {
          totalServicesCompleted: servicesCompleted,
          totalRevenue: newRevenue,
          avgCompletionHours,
        },
      });

      Logger.info('Service completion points awarded', {
        serviceId,
        totalPoints,
        profileId: profile.id,
      });

      return { totalPoints, breakdown };
    } catch (error) {
      Logger.error('Error processing service completion points', { error, serviceId });
      // Don't throw - this shouldn't block service completion
      return null;
    }
  }

  /**
   * Award delivery points when service is delivered
   */
  static async onServiceDelivered(serviceId: string) {
    try {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          assignedTo: {
            include: {
              technicianProfile: { include: { currentLevel: true } },
            },
          },
        },
      });

      if (!service || !service.assignedTo?.technicianProfile) {
        return null;
      }

      const profile = service.assignedTo.technicianProfile;
      const levelMultiplier = profile.currentLevel?.pointsMultiplier || 1.0;
      const deliveryPoints = Math.floor(20 * levelMultiplier);

      await this.awardPoints({
        technicianProfileId: profile.id,
        points: deliveryPoints,
        type: PointsType.SERVICE_DELIVERED,
        description: 'Service delivered to customer',
        serviceId,
        basePoints: 20,
        bonusMultiplier: levelMultiplier,
      });

      return { points: deliveryPoints };
    } catch (error) {
      Logger.error('Error processing delivery points', { error, serviceId });
      return null;
    }
  }

  /**
   * Manual points adjustment by admin
   */
  static async adjustPoints(
    technicianUserId: string,
    companyId: string,
    points: number,
    reason: string,
    adjustedBy: string
  ) {
    try {
      const profile = await prisma.technicianProfile.findFirst({
        where: { userId: technicianUserId, companyId },
      });

      if (!profile) {
        throw new AppError(404, 'Technician profile not found');
      }

      return this.awardPoints({
        technicianProfileId: profile.id,
        points,
        type: PointsType.MANUAL_ADJUSTMENT,
        description: `Manual adjustment by admin: ${reason}`,
        basePoints: Math.abs(points),
        bonusMultiplier: 1.0,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error adjusting points', { error, technicianUserId });
      throw new AppError(500, 'Failed to adjust points');
    }
  }

  /**
   * Get points history for technician
   */
  static async getPointsHistory(
    technicianUserId: string,
    companyId: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const profile = await prisma.technicianProfile.findFirst({
        where: { userId: technicianUserId, companyId },
      });

      if (!profile) {
        throw new AppError(404, 'Technician profile not found');
      }

      const skip = (page - 1) * limit;

      const [history, total] = await Promise.all([
        prisma.technicianPointsHistory.findMany({
          where: { technicianProfileId: profile.id },
          include: {
            service: {
              select: { ticketNumber: true, deviceModel: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.technicianPointsHistory.count({
          where: { technicianProfileId: profile.id },
        }),
      ]);

      return {
        history,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching points history', { error, technicianUserId });
      throw new AppError(500, 'Failed to fetch points history');
    }
  }

  /**
   * Get points summary (monthly breakdown)
   */
  static async getPointsSummary(technicianUserId: string, companyId: string) {
    try {
      const profile = await prisma.technicianProfile.findFirst({
        where: { userId: technicianUserId, companyId },
      });

      if (!profile) {
        throw new AppError(404, 'Technician profile not found');
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const [monthlyPoints, weeklyPoints, pointsByType] = await Promise.all([
        prisma.technicianPointsHistory.aggregate({
          where: {
            technicianProfileId: profile.id,
            createdAt: { gte: startOfMonth },
            points: { gt: 0 },
          },
          _sum: { points: true },
        }),
        prisma.technicianPointsHistory.aggregate({
          where: {
            technicianProfileId: profile.id,
            createdAt: { gte: startOfWeek },
            points: { gt: 0 },
          },
          _sum: { points: true },
        }),
        prisma.technicianPointsHistory.groupBy({
          by: ['type'],
          where: {
            technicianProfileId: profile.id,
            createdAt: { gte: startOfMonth },
          },
          _sum: { points: true },
        }),
      ]);

      return {
        totalPoints: profile.totalPoints,
        monthlyPoints: monthlyPoints._sum.points || 0,
        weeklyPoints: weeklyPoints._sum.points || 0,
        pointsByType: pointsByType.map((p) => ({
          type: p.type,
          points: p._sum.points || 0,
        })),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching points summary', { error, technicianUserId });
      throw new AppError(500, 'Failed to fetch points summary');
    }
  }

  /**
   * Award penalty points
   */
  static async awardPenalty(
    technicianUserId: string,
    companyId: string,
    penaltyType: 'LATE' | 'REWORK',
    serviceId: string,
    reason?: string
  ) {
    try {
      const profile = await prisma.technicianProfile.findFirst({
        where: { userId: technicianUserId, companyId },
      });

      if (!profile) {
        throw new AppError(404, 'Technician profile not found');
      }

      const pointsType = penaltyType === 'LATE' ? PointsType.PENALTY_LATE : PointsType.PENALTY_REWORK;
      const penaltyPoints = penaltyType === 'LATE' ? -20 : -50;
      const description = penaltyType === 'LATE'
        ? `Late completion penalty${reason ? `: ${reason}` : ''}`
        : `Rework penalty${reason ? `: ${reason}` : ''}`;

      return this.awardPoints({
        technicianProfileId: profile.id,
        points: penaltyPoints,
        type: pointsType,
        description,
        serviceId,
        basePoints: Math.abs(penaltyPoints),
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error awarding penalty', { error, technicianUserId });
      throw new AppError(500, 'Failed to award penalty');
    }
  }
}
