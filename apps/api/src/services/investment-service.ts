import { IInvestmentRepository } from '../repositories/investment-repository';
import { IAccountRepository } from '../repositories/account-repository';
import { IGoalRepository } from '../repositories/goal-repository';
import { NotificationService } from './notification-service';
import { Sip, Investment, MutualFund, SipFrequency } from '@prisma/client';
import { NotFoundError, AuthorizationError, InsufficientFundsError } from '../errors/app-errors';

export class InvestmentService {
  constructor(
    private investmentRepo: IInvestmentRepository,
    private accountRepo: IAccountRepository,
    private goalRepo: IGoalRepository,
    private notificationService: NotificationService,
  ) {}

  async createSip(
    userId: string,
    goalId: string,
    fundId: string,
    amountCents: bigint,
    frequency: SipFrequency,
  ): Promise<Sip> {
    const goal = await this.goalRepo.findById(goalId);
    if (!goal) {
      throw new NotFoundError('Associated goal target not found.');
    }

    if (goal.userId !== userId) {
      throw new AuthorizationError('You do not own this goal.');
    }

    // Set next deduction date based on frequency defaults
    const nextDeductionDate = new Date();
    if (frequency === SipFrequency.WEEKLY) {
      nextDeductionDate.setDate(nextDeductionDate.getDate() + 7);
    } else {
      nextDeductionDate.setMonth(nextDeductionDate.getMonth() + 1);
    }

    const sip = await this.investmentRepo.createSip({
      userId,
      goalId,
      fundId,
      amountCents,
      frequency,
      nextDeductionDate,
    });

    await this.notificationService.createNotification(
      userId,
      'Systematic Plan Setup Success!',
      `SIP created for "${goal.title}" amounting to ₹${(Number(amountCents) / 100).toLocaleString()}.`,
    );

    return sip;
  }

  async executeSipPayment(userId: string, sipId: string, accountId: string): Promise<Investment> {
    // Direct O(1) lookup instead of fetching all user SIPs and scanning in memory
    const sip = (await this.investmentRepo.findSipById(sipId)) as any;
    if (!sip) {
      throw new NotFoundError('Systematic plan parameter not found.');
    }
    // Explicit ownership check
    if (sip.userId !== userId) {
      throw new AuthorizationError('You do not own this SIP.');
    }

    const account = await this.accountRepo.findById(accountId);
    if (!account || account.userId !== userId) {
      throw new AuthorizationError('Invalid account details provided.');
    }

    if (account.balanceCents < sip.amountCents) {
      throw new InsufficientFundsError();
    }

    const transactionRef = `SIP-TRX-${Date.now()}`;
    const unitsPurchased = Number(sip.amountCents) / Number(sip.fund.navCents);

    const investment = (await this.investmentRepo.executeInvestmentTransaction(
      userId,
      accountId,
      sip.goalId,
      sip.id,
      sip.fundId,
      sip.amountCents,
      unitsPurchased,
      transactionRef,
    )) as any;

    await this.notificationService.createNotification(
      userId,
      'Investment Processed!',
      `Successfully processed ₹${(Number(sip.amountCents) / 100).toLocaleString()} for "${investment.goal.title}".`,
    );

    return investment;
  }

  async getRecommendedProducts(): Promise<MutualFund[]> {
    return this.investmentRepo.getRecommendedFunds();
  }

  async executeManualSweep(
    userId: string,
    accountId: string,
    goalId: string,
    fundId: string,
    amountCents: bigint,
  ): Promise<Investment> {
    const goal = await this.goalRepo.findById(goalId);
    if (!goal || goal.userId !== userId) {
      throw new AuthorizationError('Invalid goal parameters.');
    }

    const account = await this.accountRepo.findById(accountId);
    if (!account || account.userId !== userId) {
      throw new AuthorizationError('Invalid account parameters.');
    }

    if (account.balanceCents < amountCents) {
      throw new InsufficientFundsError();
    }

    const transactionRef = `SWP-TRX-${Date.now()}`;
    const unitsPurchased = Number(amountCents) / 1000; // Mock NAV: ₹10 per unit

    const investment = (await this.investmentRepo.executeInvestmentTransaction(
      userId,
      accountId,
      goalId,
      null,
      fundId,
      amountCents,
      unitsPurchased,
      transactionRef,
    )) as any;

    await this.notificationService.createNotification(
      userId,
      'One-Time Investment Success!',
      `Swept ₹${(Number(amountCents) / 100).toLocaleString()} into "${goal.title}".`,
    );

    return investment;
  }
}
