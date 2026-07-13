import { FastifyInstance } from 'fastify';
import { GoalController } from '../controllers/goal-controller';
import { GoalService } from '../services/goal-service';
import { GoalRepository } from '../repositories/goal-repository';
import { NotificationRepository } from '../repositories/notification-repository';
import { NotificationService } from '../services/notification-service';
import { authenticate } from '../middlewares/auth-middleware';
import { validate } from '../middlewares/validate-middleware';
import {
  CreateGoalDtoSchema,
  GoalIdParamsSchema,
  AddFundsDtoSchema,
} from '../schemas/goal-schemas';

const goalRepo = new GoalRepository();
const notificationRepo = new NotificationRepository();
const notificationService = new NotificationService(notificationRepo);
const goalService = new GoalService(goalRepo, notificationService);
const goalController = new GoalController(goalService);

export async function goalRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.post(
    '/',
    {
      preHandler: validate({
        body: CreateGoalDtoSchema,
      }),
    },
    (req, rep) => goalController.create(req, rep),
  );

  fastify.get('/', (req, rep) => goalController.getGoals(req, rep));

  fastify.get(
    '/:id',
    {
      preHandler: validate({
        params: GoalIdParamsSchema,
      }),
    },
    (req, rep) => goalController.getDetails(req, rep),
  );

  fastify.post(
    '/:id/funds',
    {
      preHandler: validate({
        params: GoalIdParamsSchema,
        body: AddFundsDtoSchema,
      }),
    },
    (req, rep) => goalController.addFunds(req, rep),
  );

  fastify.patch(
    '/:id/pause',
    {
      preHandler: validate({
        params: GoalIdParamsSchema,
      }),
    },
    (req, rep) => goalController.pause(req, rep),
  );

  fastify.patch(
    '/:id/resume',
    {
      preHandler: validate({
        params: GoalIdParamsSchema,
      }),
    },
    (req, rep) => goalController.resume(req, rep),
  );
}
