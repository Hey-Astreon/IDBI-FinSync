import { FastifyInstance } from 'fastify';
import { AIController } from '../controllers/ai-controller';
import { AIService } from '../services/ai-service';
import { AiRepository } from '../repositories/ai-repository';
import { UserRepository } from '../repositories/user-repository';
import { AccountRepository } from '../repositories/account-repository';
import { GoalRepository } from '../repositories/goal-repository';
import { authenticate } from '../middlewares/auth-middleware';
import { validate } from '../middlewares/validate-middleware';
import { SendMessageDtoSchema, ConversationIdParamsSchema } from '../schemas/ai-schemas';

const aiRepo = new AiRepository();
const userRepo = new UserRepository();
const accountRepo = new AccountRepository();
const goalRepo = new GoalRepository();
const aiService = new AIService(aiRepo, userRepo, accountRepo, goalRepo);
const aiController = new AIController(aiService);

export async function aiRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.post(
    '/chat',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
      preHandler: validate({
        body: SendMessageDtoSchema,
      }),
    },
    (req, rep) => aiController.sendMessage(req, rep),
  );

  fastify.get('/conversations', (req, rep) => aiController.getConversations(req, rep));

  fastify.get(
    '/conversations/:id/history',
    {
      preHandler: validate({
        params: ConversationIdParamsSchema,
      }),
    },
    (req, rep) => aiController.getHistory(req, rep),
  );
}
