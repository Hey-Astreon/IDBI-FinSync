import { FastifyInstance } from 'fastify';
import { NotificationController } from '../controllers/notification-controller';
import { NotificationService } from '../services/notification-service';
import { NotificationRepository } from '../repositories/notification-repository';
import { authenticate } from '../middlewares/auth-middleware';
import { validate } from '../middlewares/validate-middleware';
import { NotificationIdParamsSchema } from '../schemas/notification-schemas';

const notificationRepo = new NotificationRepository();
const notificationService = new NotificationService(notificationRepo);
const notificationController = new NotificationController(notificationService);

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', (req, rep) => notificationController.getNotifications(req, rep));

  fastify.patch(
    '/:id/read',
    {
      preHandler: validate({
        params: NotificationIdParamsSchema,
      }),
    },
    (req, rep) => notificationController.markAsRead(req, rep),
  );
}
