import { FastifyInstance } from 'fastify';
import { InvestmentController } from '../controllers/investment-controller';
import { InvestmentService } from '../services/investment-service';
import { InvestmentRepository } from '../repositories/investment-repository';
import { AccountRepository } from '../repositories/account-repository';
import { GoalRepository } from '../repositories/goal-repository';
import { NotificationRepository } from '../repositories/notification-repository';
import { NotificationService } from '../services/notification-service';
import { authenticate } from '../middlewares/auth-middleware';
import { validate } from '../middlewares/validate-middleware';
import {
  CreateSipDtoSchema,
  SipIdParamsSchema,
  ExecuteSipPaymentDtoSchema,
  ExecuteManualSweepDtoSchema,
} from '../schemas/investment-schemas';

const investmentRepo = new InvestmentRepository();
const accountRepo = new AccountRepository();
const goalRepo = new GoalRepository();
const notificationRepo = new NotificationRepository();
const notificationService = new NotificationService(notificationRepo);
const investmentService = new InvestmentService(
  investmentRepo,
  accountRepo,
  goalRepo,
  notificationService,
);
const investmentController = new InvestmentController(investmentService);

export async function investmentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.post(
    '/sip',
    {
      preHandler: validate({
        body: CreateSipDtoSchema,
      }),
    },
    (req, rep) => investmentController.createSip(req, rep),
  );

  fastify.post(
    '/sip/:id/pay',
    {
      preHandler: validate({
        params: SipIdParamsSchema,
        body: ExecuteSipPaymentDtoSchema,
      }),
    },
    (req, rep) => investmentController.executeSipPayment(req, rep),
  );

  fastify.get('/recommendations', (req, rep) => investmentController.getRecommendations(req, rep));

  fastify.post(
    '/sweep',
    {
      preHandler: validate({
        body: ExecuteManualSweepDtoSchema,
      }),
    },
    (req, rep) => investmentController.executeManualSweep(req, rep),
  );
}
