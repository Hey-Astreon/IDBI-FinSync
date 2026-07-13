import { FastifyRequest, FastifyReply } from 'fastify';
import { TransactionService } from '../services/transaction-service';
import { CreateTransactionDTO, GetTransactionsQuery } from '../schemas/transaction-schemas';

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { accountId, amountCents, type, category, merchantName } =
      request.body as CreateTransactionDTO;
    const txn = await this.transactionService.createTransaction(
      userId,
      accountId,
      BigInt(amountCents),
      type,
      category,
      merchantName,
    );
    return reply.status(201).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        ...txn,
        amountCents: txn.amountCents.toString(),
      },
    });
  }

  async getTransactions(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { category, type, startDate, endDate, page, limit } =
      request.query as GetTransactionsQuery;

    const formattedFilters = {
      ...(category && { category }),
      ...(type && { type }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    };

    const paginated = await this.transactionService.getTransactions(
      userId,
      formattedFilters,
      page,
      limit,
    );

    const formattedTxns = paginated.transactions.map((txn) => ({
      ...txn,
      amountCents: txn.amountCents.toString(),
    }));

    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        transactions: formattedTxns,
        total: paginated.total,
        page: paginated.page,
        limit: paginated.limit,
      },
    });
  }
}
