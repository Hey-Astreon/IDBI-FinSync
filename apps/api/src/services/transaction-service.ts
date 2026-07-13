import { ITransactionRepository } from '../repositories/transaction-repository';
import { IAccountRepository } from '../repositories/account-repository';
import { Transaction, TransactionType, TransactionCategory } from '@prisma/client';
import { NotFoundError, AuthorizationError, InsufficientFundsError } from '../errors/app-errors';

export interface PaginatedTransactionsDTO {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export class TransactionService {
  constructor(
    private transactionRepo: ITransactionRepository,
    private accountRepo: IAccountRepository,
  ) {}

  async createTransaction(
    userId: string,
    accountId: string,
    amountCents: bigint,
    type: TransactionType,
    category: TransactionCategory,
    merchantName?: string,
  ): Promise<Transaction> {
    const account = await this.accountRepo.findById(accountId);
    if (!account) {
      throw new NotFoundError('Connected bank account not found.');
    }

    if (account.userId !== userId) {
      throw new AuthorizationError('You do not own this account.');
    }

    if (type === TransactionType.OUTFLOW && account.balanceCents < amountCents) {
      throw new InsufficientFundsError();
    }

    const balanceChange = type === TransactionType.INFLOW ? amountCents : -amountCents;

    try {
      return await this.transactionRepo.createWithBalanceUpdate(
        {
          userId,
          accountId,
          amountCents,
          type,
          category,
          merchantName,
        },
        balanceChange,
      );
    } catch (err: any) {
      if (err.message === 'INSUFFICIENT_FUNDS') {
        throw new InsufficientFundsError();
      }
      throw err;
    }
  }

  async getTransactions(
    userId: string,
    filters: {
      category?: TransactionCategory;
      type?: TransactionType;
      startDate?: Date;
      endDate?: Date;
    },
    page: number,
    limit: number,
  ): Promise<PaginatedTransactionsDTO> {
    const skip = (page - 1) * limit;
    const [transactions, total] = await this.transactionRepo.findPaginated(
      userId,
      filters,
      skip,
      limit,
    );

    return {
      transactions,
      total,
      page,
      limit,
    };
  }
}
