import { prisma } from '../config/prisma';
import { Transaction, TransactionType, TransactionCategory, Prisma } from '@prisma/client';

export interface ITransactionRepository {
  create(data: Prisma.TransactionUncheckedCreateInput): Promise<Transaction>;
  createWithBalanceUpdate(
    data: Prisma.TransactionUncheckedCreateInput,
    balanceChange: bigint,
  ): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findPaginated(
    userId: string,
    filters: {
      category?: TransactionCategory;
      type?: TransactionType;
      startDate?: Date;
      endDate?: Date;
    },
    skip: number,
    take: number,
  ): Promise<[Transaction[], number]>;
}

export class TransactionRepository implements ITransactionRepository {
  async create(data: Prisma.TransactionUncheckedCreateInput): Promise<Transaction> {
    return prisma.transaction.create({
      data,
    });
  }

  async createWithBalanceUpdate(
    data: Prisma.TransactionUncheckedCreateInput,
    balanceChange: bigint,
  ): Promise<Transaction> {
    return prisma.$transaction(async (tx) => {
      const account = await tx.account.update({
        where: { id: data.accountId },
        data: {
          balanceCents: {
            increment: balanceChange,
          },
        },
      });

      if (account.balanceCents < 0n) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      return tx.transaction.create({
        data,
      });
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { id },
    });
  }

  async findPaginated(
    userId: string,
    filters: {
      category?: TransactionCategory;
      type?: TransactionType;
      startDate?: Date;
      endDate?: Date;
    },
    skip: number,
    take: number,
  ): Promise<[Transaction[], number]> {
    const whereClause: Prisma.TransactionWhereInput = {
      userId,
      ...(filters.category && { category: filters.category }),
      ...(filters.type && { type: filters.type }),
      ...((filters.startDate || filters.endDate) && {
        timestamp: {
          ...(filters.startDate && { gte: filters.startDate }),
          ...(filters.endDate && { lte: filters.endDate }),
        },
      }),
    };

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip,
        take,
      }),
      prisma.transaction.count({
        where: whereClause,
      }),
    ]);

    return [transactions, total];
  }
}
