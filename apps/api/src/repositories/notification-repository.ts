import { prisma } from '../config/prisma';
import { Notification, Prisma } from '@prisma/client';

export interface INotificationRepository {
  create(data: Prisma.NotificationUncheckedCreateInput): Promise<Notification>;
  findByUserId(userId: string): Promise<Notification[]>;
  findByIdAndUserId(id: string, userId: string): Promise<Notification | null>;
  markAsRead(id: string): Promise<Notification>;
}

export class NotificationRepository implements INotificationRepository {
  async create(data: Prisma.NotificationUncheckedCreateInput): Promise<Notification> {
    return prisma.notification.create({
      data,
    });
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Notification | null> {
    return prisma.notification.findFirst({
      where: { id, userId },
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
