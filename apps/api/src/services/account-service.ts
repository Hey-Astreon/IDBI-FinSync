import { IAccountRepository } from '../repositories/account-repository';
import { Account } from '@prisma/client';
import { ConflictError, NotFoundError, AuthorizationError } from '../errors/app-errors';

export class AccountService {
  constructor(private accountRepo: IAccountRepository) {}

  async linkAccount(userId: string, accountNumber: string, accountType: string): Promise<Account> {
    const existingAccount = await this.accountRepo.findByAccountNumber(accountNumber);
    if (existingAccount) {
      throw new ConflictError('Account number is already linked to a profile.');
    }

    return this.accountRepo.create({
      userId,
      accountNumber,
      accountType,
      balanceCents: 50000000n, // Seed with ₹5,00,000 for hackathon demo cash flow simulations
    });
  }

  async getUserAccounts(userId: string): Promise<Account[]> {
    return this.accountRepo.findByUserId(userId);
  }

  async getAccountDetails(userId: string, accountId: string): Promise<Account> {
    const account = await this.accountRepo.findById(accountId);
    if (!account) {
      throw new NotFoundError('Bank account not found.');
    }

    if (account.userId !== userId) {
      throw new AuthorizationError('You do not own this account.');
    }

    return account;
  }
}
