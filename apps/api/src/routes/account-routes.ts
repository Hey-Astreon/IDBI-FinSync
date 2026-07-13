import { FastifyInstance } from 'fastify';
import { AccountController } from '../controllers/account-controller';
import { AccountService } from '../services/account-service';
import { AccountRepository } from '../repositories/account-repository';
import { authenticate } from '../middlewares/auth-middleware';
import { validate } from '../middlewares/validate-middleware';
import { LinkAccountDtoSchema, GetAccountDetailsParamsSchema } from '../schemas/account-schemas';

const accountRepo = new AccountRepository();
const accountService = new AccountService(accountRepo);
const accountController = new AccountController(accountService);

export async function accountRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.post(
    '/link',
    {
      preHandler: validate({
        body: LinkAccountDtoSchema,
      }),
    },
    (req, rep) => accountController.linkAccount(req, rep),
  );

  fastify.get('/', (req, rep) => accountController.getAccounts(req, rep));

  fastify.get(
    '/:id',
    {
      preHandler: validate({
        params: GetAccountDetailsParamsSchema,
      }),
    },
    (req, rep) => accountController.getAccountDetails(req, rep),
  );
}
