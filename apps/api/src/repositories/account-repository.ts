import { prisma } from '../config/prisma';
import { Account, Prisma } from '@prisma/client';

export interface IAccountRepository {
  create(data: Prisma.AccountUncheckedCreateInput): Promise<Account>;
  findById(id: string): Promise<Account | null>;
  findByAccountNumber(accountNumber: string): Promise<Account | null>;
  findByUserId(userId: string): Promise<Account[]>;
  updateBalance(id: string, amountCents: bigint): Promise<Account>;
}

export class AccountRepository implements IAccountRepository {
  async create(data: Prisma.AccountUncheckedCreateInput): Promise<Account> {
    return prisma.account.create({
      data,
    });
  }

  async findById(id: string): Promise<Account | null> {
    return prisma.account.findUnique({
      where: { id },
    });
  }

  async findByAccountNumber(accountNumber: string): Promise<Account | null> {
    return prisma.account.findUnique({
      where: { accountNumber },
    });
  }

  async findByUserId(userId: string): Promise<Account[]> {
    return prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBalance(id: string, amountCents: bigint): Promise<Account> {
    return prisma.account.update({
      where: { id },
      data: {
        balanceCents: {
          increment: amountCents,
        },
      },
    });
  }
}
