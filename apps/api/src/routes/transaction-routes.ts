import { FastifyInstance } from 'fastify';
import { TransactionController } from '../controllers/transaction-controller';
import { TransactionService } from '../services/transaction-service';
import { TransactionRepository } from '../repositories/transaction-repository';
import { AccountRepository } from '../repositories/account-repository';
import { authenticate } from '../middlewares/auth-middleware';
import { validate } from '../middlewares/validate-middleware';
import {
  CreateTransactionDtoSchema,
  GetTransactionsQuerySchema,
} from '../schemas/transaction-schemas';

const transactionRepo = new TransactionRepository();
const accountRepo = new AccountRepository();
const transactionService = new TransactionService(transactionRepo, accountRepo);
const transactionController = new TransactionController(transactionService);

export async function transactionRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.post(
    '/',
    {
      preHandler: validate({
        body: CreateTransactionDtoSchema,
      }),
    },
    (req, rep) => transactionController.create(req, rep),
  );

  fastify.get(
    '/',
    {
      preHandler: validate({
        query: GetTransactionsQuerySchema,
      }),
    },
    (req, rep) => transactionController.getTransactions(req, rep),
  );
}
