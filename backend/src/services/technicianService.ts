import prisma from '../config/database';
import { ServiceStatus, UserRole } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';

interface CreateTechnicianProfileData {
  userId: string;
  companyId: string;
  branchId: string;
  maxConcurrentJobs?: number;
  skillIds?: string[]; // Service category IDs
}

interface UpdateTechnicianProfileData {
  isAvailable?: boolean;
  maxConcurrentJobs?: number;
}

interface TechnicianFilters {
  companyId: string;
  branchId?: string;
  isAvailable?: boolean;
  levelId?: string;
  categoryId?: string; // Filter by skill
  search?: string;
}

interface TechniciansForAssignmentFilters {
  companyId: string;
  branchId: string;
  categoryId?: string;
  available?: boolean;
  sortBy?: 'workload' | 'rating' | 'points';
}

export class TechnicianService {
  /**
   * Create technician profile for a user
   */
  static async createProfile(data: CreateTechnicianProfileData) {
    try {
      // Check if user exists and is a technician
      const user = await prisma.user.findFirst({
        where: {
          id: data.userId,
          companyId: data.companyId,
          role: UserRole.TECHNICIAN,
        },
      });

      if (!user) {
        throw new AppError(404, 'User not found or is not a technician');
      }

      // Check if profile already exists
      const existingProfile = await prisma.technicianProfile.findUnique({
        where: { userId: data.userId },
      });

      if (existingProfile) {
        throw new AppError(400, 'Technician profile already exists');
      }

      // Get the starting level (Trainee)
      const startingLevel = await prisma.technicianLevel.findFirst({
        where: {
          companyId: data.companyId,
          code: 'TRAINEE',
        },
      });

      // Create profile
      const profile = await prisma.technicianProfile.create({
        data: {
          userId: data.userId,
          companyId: data.companyId,
          branchId: data.branchId,
          currentLevelId: startingLevel?.id ?? null,
          maxConcurrentJobs: data.maxConcurrentJobs ?? 5,
          totalPoints: 0,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
          currentLevel: true,
          branch: { select: { id: true, name: true, code: true } },
        },
      });

      // Add skills if provided
      if (data.skillIds && data.skillIds.length > 0) {
        await prisma.technicianSkill.createMany({
          data: data.skillIds.map((faultId) => ({
            technicianProfileId: profile.id,
            faultId: faultId,
            proficiencyLevel: 1,
          })),
        });
      }

      Logger.info('Technician profile created', { profileId: profile.id, userId: data.userId });

      return profile;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error creating technician profile', { error });
      throw new AppError(500, 'Failed to create technician profile');
    }
  }

  /**
   * Get technician profile by user ID
   */
  static async getProfileByUserId(userId: string, companyId: string) {
    try {
      const profile = await prisma.technicianProfile.findFirst({
        where: {
          userId,
          companyId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, profileImage: true },
          },
          currentLevel: true,
          branch: { select: { id: true, name: true, code: true } },
          skills: {
            include: {
              fault: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });

      if (!profile) {
        throw new AppError(404, 'Technician profile not found');
      }

      // Get pending/in-progress services count
      const pendingServices = await prisma.service.count({
        where: {
          assignedToId: userId,
          status: { in: [ServiceStatus.PENDING, ServiceStatus.IN_PROGRESS, ServiceStatus.WAITING_PARTS] },
        },
      });

      // Get next level info
      let nextLevel = null;
      let pointsToNextLevel = null;
      if (profile.currentLevel && profile.currentLevel.maxPoints) {
        nextLevel = await prisma.technicianLevel.findFirst({
          where: {
            companyId,
            minPoints: { gt: profile.currentLevel.minPoints },
          },
          orderBy: { minPoints: 'asc' },
        });

        if (nextLevel) {
          pointsToNextLevel = nextLevel.minPoints - profile.totalPoints;
        }
      }

      return {
        ...profile,
        pendingServicesCount: pendingServices,
        nextLevel,
        pointsToNextLevel: pointsToNextLevel && pointsToNextLevel > 0 ? pointsToNextLevel : 0,
        progressPercent: profile.currentLevel?.maxPoints
          ? Math.min(
              100,
              ((profile.totalPoints - profile.currentLevel.minPoints) /
                (profile.currentLevel.maxPoints - profile.currentLevel.minPoints)) *
                100
            )
          : 100,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching technician profile', { error, userId });
      throw new AppError(500, 'Failed to fetch technician profile');
    }
  }

  /**
   * Update technician profile
   */
  static async updateProfile(userId: string, companyId: string, data: UpdateTechnicianProfileData) {
    try {
      const profile = await prisma.technicianProfile.findFirst({
        where: { userId, companyId },
      });

      if (!profile) {
        throw new AppError(404, 'Technician profile not found');
      }

      const updated = await prisma.technicianProfile.update({
        where: { id: profile.id },
        data: {
          ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
          ...(data.maxConcurrentJobs !== undefined && { maxConcurrentJobs: data.maxConcurrentJobs }),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
          currentLevel: true,
          branch: { select: { id: true, name: true, code: true } },
        },
      });

      Logger.info('Technician profile updated', { profileId: profile.id });

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating technician profile', { error, userId });
      throw new AppError(500, 'Failed to update technician profile');
    }
  }

  /**
   * Get all technicians with filters and pagination
   */
  static async getAllTechnicians(
    filters: TechnicianFilters,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: any = {
        companyId: filters.companyId,
      };

      if (filters.branchId) {
        where.branchId = filters.branchId;
      }

      if (filters.isAvailable !== undefined) {
        where.isAvailable = filters.isAvailable;
      }

      if (filters.levelId) {
        where.currentLevelId = filters.levelId;
      }

      if (filters.categoryId) {
        where.skills = {
          some: { faultId: filters.categoryId },
        };
      }

      if (filters.search) {
        where.user = {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
            { phone: { contains: filters.search, mode: 'insensitive' } },
          ],
        };
      }

      const [technicians, total] = await Promise.all([
        prisma.technicianProfile.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true, profileImage: true, isActive: true },
            },
            currentLevel: true,
            branch: { select: { id: true, name: true, code: true } },
            skills: {
              include: {
                fault: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { totalPoints: 'desc' },
        }),
        prisma.technicianProfile.count({ where }),
      ]);

      // Get pending services count for each technician
      const techniciansWithWorkload = await Promise.all(
        technicians.map(async (tech) => {
          const pendingCount = await prisma.service.count({
            where: {
              assignedToId: tech.userId,
              status: { in: [ServiceStatus.PENDING, ServiceStatus.IN_PROGRESS, ServiceStatus.WAITING_PARTS] },
            },
          });

          return {
            ...tech,
            pendingServicesCount: pendingCount,
          };
        })
      );

      return {
        technicians: techniciansWithWorkload,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching technicians', { error });
      throw new AppError(500, 'Failed to fetch technicians');
    }
  }

  /**
   * Get technicians available for assignment (optimized for assignment modal)
   */
  static async getTechniciansForAssignment(filters: TechniciansForAssignmentFilters) {
    try {
      const where: any = {
        companyId: filters.companyId,
        branchId: filters.branchId,
        user: {
          isActive: true,
        },
      };

      if (filters.available) {
        where.isAvailable = true;
      }

      if (filters.categoryId) {
        where.skills = {
          some: { faultId: filters.categoryId },
        };
      }

      const technicians = await prisma.technicianProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, profileImage: true },
          },
          currentLevel: true,
          skills: {
            include: {
              fault: { select: { id: true, name: true } },
            },
          },
        },
      });

      // Get workload and calculate scores for each technician
      const techniciansWithDetails = await Promise.all(
        technicians.map(async (tech) => {
          const [pendingCount, inProgressCount] = await Promise.all([
            prisma.service.count({
              where: {
                assignedToId: tech.userId,
                status: ServiceStatus.PENDING,
              },
            }),
            prisma.service.count({
              where: {
                assignedToId: tech.userId,
                status: ServiceStatus.IN_PROGRESS,
              },
            }),
          ]);

          const totalWorkload = pendingCount + inProgressCount;
          const workloadScore = tech.maxConcurrentJobs > 0
            ? (totalWorkload / tech.maxConcurrentJobs) * 100
            : 100;

          return {
            id: tech.user.id,
            name: tech.user.name,
            email: tech.user.email,
            phone: tech.user.phone,
            profileImage: tech.user.profileImage,
            profile: {
              totalPoints: tech.totalPoints,
              currentLevel: tech.currentLevel,
              averageRating: tech.averageRating,
              totalServicesCompleted: tech.totalServicesCompleted,
              isAvailable: tech.isAvailable,
              maxConcurrentJobs: tech.maxConcurrentJobs,
            },
            skills: tech.skills.map((s) => ({
              faultId: s.faultId,
              faultName: s.fault.name,
              proficiencyLevel: s.proficiencyLevel,
            })),
            pendingServicesCount: pendingCount,
            inProgressCount: inProgressCount,
            totalWorkload,
            workloadPercent: Math.round(workloadScore),
            canAcceptMore: totalWorkload < tech.maxConcurrentJobs,
          };
        })
      );

      // Sort based on filter
      let sorted = techniciansWithDetails;
      switch (filters.sortBy) {
        case 'workload':
          sorted = techniciansWithDetails.sort((a, b) => a.totalWorkload - b.totalWorkload);
          break;
        case 'rating':
          sorted = techniciansWithDetails.sort((a, b) => (b.profile.averageRating || 0) - (a.profile.averageRating || 0));
          break;
        case 'points':
          sorted = techniciansWithDetails.sort((a, b) => b.profile.totalPoints - a.profile.totalPoints);
          break;
        default:
          sorted = techniciansWithDetails.sort((a, b) => a.totalWorkload - b.totalWorkload);
      }

      return sorted;
    } catch (error) {
      Logger.error('Error fetching technicians for assignment', { error });
      throw new AppError(500, 'Failed to fetch technicians for assignment');
    }
  }

  /**
   * Add skill to technician
   */
  static async addSkill(
    userId: string,
    companyId: string,
    faultId: string,
    proficiencyLevel: number = 1
  ) {
    try {
      const profile = await prisma.technicianProfile.findFirst({
        where: { userId, companyId },
      });

      if (!profile) {
        throw new AppError(404, 'Technician profile not found');
      }

      // Check if skill already exists
      const existingSkill = await prisma.technicianSkill.findFirst({
        where: {
          technicianProfileId: profile.id,
          faultId,
        },
      });

      if (existingSkill) {
        throw new AppError(400, 'Skill already exists for this technician');
      }

      // Verify fault exists
      const fault = await prisma.fault.findFirst({
        where: { id: faultId, companyId },
      });

      if (!fault) {
        throw new AppError(404, 'Fault not found');
      }

      const skill = await prisma.technicianSkill.create({
        data: {
          technicianProfileId: profile.id,
          faultId,
          proficiencyLevel: Math.min(5, Math.max(1, proficiencyLevel)),
        },
        include: {
          fault: { select: { id: true, name: true, code: true } },
        },
      });

      Logger.info('Skill added to technician', { profileId: profile.id, skillId: skill.id });

      return skill;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error adding skill', { error, userId });
      throw new AppError(500, 'Failed to add skill');
    }
  }

  /**
   * Update skill proficiency
   */
  static async updateSkill(
    skillId: string,
    companyId: string,
    data: { proficiencyLevel?: number; isVerified?: boolean; verifiedBy?: string }
  ) {
    try {
      const skill = await prisma.technicianSkill.findFirst({
        where: {
          id: skillId,
          technicianProfile: { companyId },
        },
      });

      if (!skill) {
        throw new AppError(404, 'Skill not found');
      }

      const updated = await prisma.technicianSkill.update({
        where: { id: skillId },
        data: {
          ...(data.proficiencyLevel !== undefined && {
            proficiencyLevel: Math.min(5, Math.max(1, data.proficiencyLevel)),
          }),
          ...(data.isVerified !== undefined && {
            isVerified: data.isVerified,
            verifiedAt: data.isVerified ? new Date() : null,
            verifiedBy: data.isVerified ? data.verifiedBy : null,
          }),
        },
        include: {
          fault: { select: { id: true, name: true, code: true } },
        },
      });

      Logger.info('Skill updated', { skillId });

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error updating skill', { error, skillId });
      throw new AppError(500, 'Failed to update skill');
    }
  }

  /**
   * Remove skill from technician
   */
  static async removeSkill(skillId: string, companyId: string) {
    try {
      const skill = await prisma.technicianSkill.findFirst({
        where: {
          id: skillId,
          technicianProfile: { companyId },
        },
      });

      if (!skill) {
        throw new AppError(404, 'Skill not found');
      }

      await prisma.technicianSkill.delete({
        where: { id: skillId },
      });

      Logger.info('Skill removed', { skillId });

      return { message: 'Skill removed successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error removing skill', { error, skillId });
      throw new AppError(500, 'Failed to remove skill');
    }
  }

  /**
   * Get technician stats for dashboard
   */
  static async getTechnicianStats(userId: string, companyId: string) {
    try {
      const profile = await prisma.technicianProfile.findFirst({
        where: { userId, companyId },
        include: {
          currentLevel: true,
        },
      });

      if (!profile) {
        throw new AppError(404, 'Technician profile not found');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Get today's stats
      const [todayAssigned, todayCompleted] = await Promise.all([
        prisma.service.count({
          where: {
            assignedToId: userId,
            updatedAt: { gte: today },
          },
        }),
        prisma.service.count({
          where: {
            assignedToId: userId,
            status: ServiceStatus.COMPLETED,
            completedAt: { gte: today },
          },
        }),
      ]);

      // Get pending services
      const pendingServices = await prisma.service.count({
        where: {
          assignedToId: userId,
          status: { in: [ServiceStatus.PENDING, ServiceStatus.IN_PROGRESS, ServiceStatus.WAITING_PARTS] },
        },
      });

      // Get this month's stats
      const monthlyPointsHistory = await prisma.technicianPointsHistory.aggregate({
        where: {
          technicianProfileId: profile.id,
          createdAt: { gte: startOfMonth },
          points: { gt: 0 },
        },
        _sum: { points: true },
      });

      const monthlyCompleted = await prisma.service.count({
        where: {
          assignedToId: userId,
          status: ServiceStatus.COMPLETED,
          completedAt: { gte: startOfMonth },
        },
      });

      // Get next level info
      let nextLevel = null;
      let pointsToNextLevel = null;
      let progressPercent = 100;

      if (profile.currentLevel?.maxPoints) {
        nextLevel = await prisma.technicianLevel.findFirst({
          where: {
            companyId,
            minPoints: { gt: profile.currentLevel.minPoints },
          },
          orderBy: { minPoints: 'asc' },
        });

        if (nextLevel) {
          pointsToNextLevel = nextLevel.minPoints - profile.totalPoints;
          progressPercent = Math.min(
            100,
            ((profile.totalPoints - profile.currentLevel.minPoints) /
              (profile.currentLevel.maxPoints - profile.currentLevel.minPoints)) *
              100
          );
        }
      }

      return {
        profile: {
          totalPoints: profile.totalPoints,
          currentLevel: profile.currentLevel,
          nextLevel,
          pointsToNextLevel: pointsToNextLevel && pointsToNextLevel > 0 ? pointsToNextLevel : 0,
          progressPercent: Math.round(progressPercent),
        },
        today: {
          assigned: todayAssigned,
          completed: todayCompleted,
          pending: pendingServices,
        },
        thisMonth: {
          servicesCompleted: monthlyCompleted,
          totalPoints: monthlyPointsHistory._sum.points || 0,
          averageRating: profile.averageRating,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error fetching technician stats', { error, userId });
      throw new AppError(500, 'Failed to fetch technician stats');
    }
  }

  /**
   * Get assigned services for technician
   */
  static async getAssignedServices(userId: string, companyId: string, status?: ServiceStatus) {
    try {
      const where: any = {
        assignedToId: userId,
        companyId,
      };

      if (status) {
        where.status = status;
      } else {
        // Default: show only active services
        where.status = { in: [ServiceStatus.PENDING, ServiceStatus.IN_PROGRESS, ServiceStatus.WAITING_PARTS] };
      }

      const services = await prisma.service.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          faults: {
            include: {
              fault: {
                select: { id: true, name: true, technicianPoints: true },
              },
            },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      });

      return services.map((service) => ({
        id: service.id,
        ticketNumber: service.ticketNumber,
        customer: service.customer,
        deviceModel: service.deviceModel,
        issue: service.issue,
        status: service.status,
        faults: service.faults.map(f => f.fault),
        estimatedCost: service.estimatedCost,
        createdAt: service.createdAt,
        assignedAt: service.updatedAt,
      }));
    } catch (error) {
      Logger.error('Error fetching assigned services', { error, userId });
      throw new AppError(500, 'Failed to fetch assigned services');
    }
  }

  /**
   * Create or get technician profile for existing technician users
   */
  static async ensureProfileExists(userId: string, companyId: string, branchId: string) {
    try {
      let profile = await prisma.technicianProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        const startingLevel = await prisma.technicianLevel.findFirst({
          where: { companyId, code: 'TRAINEE' },
        });

        profile = await prisma.technicianProfile.create({
          data: {
            userId,
            companyId,
            branchId,
            currentLevelId: startingLevel?.id ?? null,
            totalPoints: 0,
          },
        });

        Logger.info('Auto-created technician profile', { profileId: profile.id, userId });
      }

      return profile;
    } catch (error) {
      Logger.error('Error ensuring technician profile', { error, userId });
      throw new AppError(500, 'Failed to ensure technician profile');
    }
  }
}
