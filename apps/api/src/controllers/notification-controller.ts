import { FastifyRequest, FastifyReply } from 'fastify';
import { NotificationService } from '../services/notification-service';
import { NotificationIdParams } from '../schemas/notification-schemas';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  async getNotifications(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const notifications = await this.notificationService.getUserNotifications(userId);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: notifications,
    });
  }

  async markAsRead(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as NotificationIdParams;
    const notification = await this.notificationService.markAsRead(id, userId);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: notification,
    });
  }
}
