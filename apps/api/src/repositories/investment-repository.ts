import { prisma } from '../config/prisma';
import {
  Sip,
  Investment,
  MutualFund,
  Prisma,
  TransactionCategory,
  TransactionType,
} from '@prisma/client';

export interface IInvestmentRepository {
  createSip(data: Prisma.SipUncheckedCreateInput): Promise<Sip>;
  findSipById(id: string): Promise<Sip | null>;
  getSipsByUserId(userId: string): Promise<Sip[]>;
  updateSip(id: string, data: Prisma.SipUpdateInput): Promise<Sip>;
  createInvestment(data: Prisma.InvestmentUncheckedCreateInput): Promise<Investment>;
  getInvestmentsByUserId(userId: string): Promise<Investment[]>;
  getRecommendedFunds(): Promise<MutualFund[]>;
  executeInvestmentTransaction(
    userId: string,
    accountId: string,
    goalId: string,
    sipId: string | null,
    fundId: string,
    amountCents: bigint,
    unitsPurchased: number,
    transactionRef: string,
  ): Promise<Investment>;
}

export class InvestmentRepository implements IInvestmentRepository {
  async createSip(data: Prisma.SipUncheckedCreateInput): Promise<Sip> {
    return prisma.sip.create({
      data,
      include: {
        fund: true,
      },
    });
  }

  async findSipById(id: string): Promise<Sip | null> {
    return prisma.sip.findUnique({
      where: { id },
      include: { fund: true },
    });
  }

  async getSipsByUserId(userId: string): Promise<Sip[]> {
    return prisma.sip.findMany({
      where: { userId },
      include: {
        fund: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSip(id: string, data: Prisma.SipUpdateInput): Promise<Sip> {
    return prisma.sip.update({
      where: { id },
      data,
      include: {
        fund: true,
      },
    });
  }

  async createInvestment(data: Prisma.InvestmentUncheckedCreateInput): Promise<Investment> {
    return prisma.investment.create({
      data,
      include: {
        goal: true,
      },
    });
  }

  async getInvestmentsByUserId(userId: string): Promise<Investment[]> {
    return prisma.investment.findMany({
      where: { userId },
      include: {
        goal: true,
        sip: {
          include: {
            fund: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecommendedFunds(): Promise<MutualFund[]> {
    return prisma.mutualFund.findMany({
      where: { isRecommended: true },
      orderBy: { historicalReturn3y: 'desc' },
    });
  }

  async executeInvestmentTransaction(
    userId: string,
    accountId: string,
    goalId: string,
    sipId: string | null,
    fundId: string,
    amountCents: bigint,
    unitsPurchased: number,
    transactionRef: string,
  ): Promise<Investment> {
    return prisma.$transaction(async (tx) => {
      // 1. Decrement Account balance
      const account = await tx.account.update({
        where: { id: accountId },
        data: {
          balanceCents: {
            decrement: amountCents,
          },
        },
      });

      if (account.balanceCents < 0n) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      // 2. Increment Goal progress
      await tx.goal.update({
        where: { id: goalId },
        data: {
          currentCents: {
            increment: amountCents,
          },
        },
      });

      // 3. Create Outflow Transaction record
      await tx.transaction.create({
        data: {
          userId,
          accountId,
          amountCents,
          type: TransactionType.OUTFLOW,
          category: TransactionCategory.INVESTMENT,
          merchantName: `IDBI Wealth - Fund Sweep`,
        },
      });

      // 4. If sipId is provided, update its next deduction date atomically inside the transaction!
      if (sipId) {
        const sip = await tx.sip.findUnique({
          where: { id: sipId },
        });
        if (sip) {
          const updatedDeductionDate = new Date(sip.nextDeductionDate);
          if (sip.frequency === 'WEEKLY') {
            updatedDeductionDate.setDate(updatedDeductionDate.getDate() + 7);
          } else {
            updatedDeductionDate.setMonth(updatedDeductionDate.getMonth() + 1);
          }
          await tx.sip.update({
            where: { id: sipId },
            data: { nextDeductionDate: updatedDeductionDate },
          });
        }
      }

      // 5. Create Successful Investment record (fundId is now correctly persisted)
      const investment = await tx.investment.create({
        data: {
          userId,
          goalId,
          sipId,
          fundId,
          amountCents,
          status: 'SUCCESSFUL',
          unitsPurchased,
          transactionRef,
        },
        include: {
          goal: true,
        },
      });

      return investment;
    });
  }
}
