import { INotificationRepository } from '../repositories/notification-repository';
import { Notification } from '@prisma/client';
import { NotFoundError } from '../errors/app-errors';

export class NotificationService {
  constructor(private notificationRepo: INotificationRepository) {}

  async createNotification(userId: string, title: string, message: string): Promise<Notification> {
    return this.notificationRepo.create({
      userId,
      title,
      message,
    });
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepo.findByUserId(userId);
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    // Verify ownership with a single targeted query instead of loading all notifications
    const notification = await this.notificationRepo.findByIdAndUserId(id, userId);
    if (!notification) {
      throw new NotFoundError('Notification not found.');
    }
    return this.notificationRepo.markAsRead(id);
  }
}
