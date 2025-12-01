import prisma from '../config/database';
import { NotificationType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { Logger } from '../utils/logger';

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export class TechnicianNotificationService {
  /**
   * Create a notification
   */
  static async create(data: CreateNotificationData) {
    try {
      const notification = await prisma.technicianNotification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
        },
      });

      Logger.info('Notification created', { notificationId: notification.id, userId: data.userId });

      return notification;
    } catch (error) {
      Logger.error('Error creating notification', { error });
      throw new AppError(500, 'Failed to create notification');
    }
  }

  /**
   * Create notification for service assignment
   */
  static async notifyServiceAssigned(
    userId: string,
    serviceId: string,
    ticketNumber: string,
    deviceModel: string,
    issue: string
  ) {
    return this.create({
      userId,
      type: NotificationType.SERVICE_ASSIGNED,
      title: 'New Service Assigned',
      message: `You have been assigned service ${ticketNumber} - ${deviceModel}: ${issue.substring(0, 50)}${issue.length > 50 ? '...' : ''}`,
      data: { serviceId, ticketNumber, deviceModel, issue },
    });
  }

  /**
   * Create notification for service reassignment
   */
  static async notifyServiceReassigned(
    userId: string,
    serviceId: string,
    ticketNumber: string,
    deviceModel: string,
    previousTechnicianName?: string
  ) {
    return this.create({
      userId,
      type: NotificationType.SERVICE_REASSIGNED,
      title: 'Service Reassigned to You',
      message: `Service ${ticketNumber} (${deviceModel}) has been reassigned to you${previousTechnicianName ? ` from ${previousTechnicianName}` : ''}.`,
      data: { serviceId, ticketNumber, deviceModel, previousTechnicianName },
    });
  }

  /**
   * Get notifications for user
   */
  static async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (unreadOnly) {
        where.isRead = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.technicianNotification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.technicianNotification.count({ where }),
        prisma.technicianNotification.count({
          where: { userId, isRead: false },
        }),
      ]);

      return {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error('Error fetching notifications', { error, userId });
      throw new AppError(500, 'Failed to fetch notifications');
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string) {
    try {
      const count = await prisma.technicianNotification.count({
        where: { userId, isRead: false },
      });

      return { unreadCount: count };
    } catch (error) {
      Logger.error('Error fetching unread count', { error, userId });
      throw new AppError(500, 'Failed to fetch unread count');
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.technicianNotification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new AppError(404, 'Notification not found');
      }

      if (notification.isRead) {
        return notification;
      }

      const updated = await prisma.technicianNotification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error marking notification as read', { error, notificationId });
      throw new AppError(500, 'Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    try {
      const result = await prisma.technicianNotification.updateMany({
        where: { userId, isRead: false },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      Logger.info('All notifications marked as read', { userId, count: result.count });

      return { markedCount: result.count };
    } catch (error) {
      Logger.error('Error marking all as read', { error, userId });
      throw new AppError(500, 'Failed to mark all notifications as read');
    }
  }

  /**
   * Delete notification
   */
  static async delete(notificationId: string, userId: string) {
    try {
      const notification = await prisma.technicianNotification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new AppError(404, 'Notification not found');
      }

      await prisma.technicianNotification.delete({
        where: { id: notificationId },
      });

      return { message: 'Notification deleted' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      Logger.error('Error deleting notification', { error, notificationId });
      throw new AppError(500, 'Failed to delete notification');
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  static async deleteOldNotifications(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.technicianNotification.deleteMany({
        where: {
          isRead: true,
          createdAt: { lt: cutoffDate },
        },
      });

      Logger.info('Old notifications deleted', { count: result.count, daysOld });

      return { deletedCount: result.count };
    } catch (error) {
      Logger.error('Error deleting old notifications', { error });
      throw new AppError(500, 'Failed to delete old notifications');
    }
  }

  /**
   * Send daily target reminder
   */
  static async sendDailyTargetReminder(userId: string, target: number, current: number) {
    const remaining = target - current;
    if (remaining <= 0) return null;

    return this.create({
      userId,
      type: NotificationType.DAILY_TARGET,
      title: 'Daily Target Reminder',
      message: `You have ${remaining} more service${remaining > 1 ? 's' : ''} to complete to meet your daily target of ${target}.`,
      data: { target, current, remaining },
    });
  }

  /**
   * Send announcement to all technicians in a branch/company
   */
  static async sendAnnouncement(
    companyId: string,
    branchId: string | null,
    title: string,
    message: string
  ) {
    try {
      const where: any = {
        companyId,
        role: 'TECHNICIAN',
        isActive: true,
      };

      if (branchId) {
        where.branchId = branchId;
      }

      const technicians = await prisma.user.findMany({
        where,
        select: { id: true },
      });

      const notifications = await prisma.technicianNotification.createMany({
        data: technicians.map((tech) => ({
          userId: tech.id,
          type: NotificationType.ANNOUNCEMENT,
          title,
          message,
          data: { companyId, branchId },
        })),
      });

      Logger.info('Announcement sent', {
        count: notifications.count,
        companyId,
        branchId,
      });

      return { sentCount: notifications.count };
    } catch (error) {
      Logger.error('Error sending announcement', { error, companyId });
      throw new AppError(500, 'Failed to send announcement');
    }
  }
}
