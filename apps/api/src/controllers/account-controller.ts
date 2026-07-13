import { FastifyRequest, FastifyReply } from 'fastify';
import { AccountService } from '../services/account-service';
import { LinkAccountDTO, GetAccountDetailsParams } from '../schemas/account-schemas';

export class AccountController {
  constructor(private accountService: AccountService) {}

  async linkAccount(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { accountNumber, accountType } = request.body as LinkAccountDTO;
    const account = await this.accountService.linkAccount(userId, accountNumber, accountType);
    return reply.status(201).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        ...account,
        balanceCents: account.balanceCents.toString(),
      },
    });
  }

  async getAccounts(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const accounts = await this.accountService.getUserAccounts(userId);
    const formattedAccounts = accounts.map((acc) => ({
      ...acc,
      balanceCents: acc.balanceCents.toString(),
    }));
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: formattedAccounts,
    });
  }

  async getAccountDetails(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as GetAccountDetailsParams;
    const account = await this.accountService.getAccountDetails(userId, id);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        ...account,
        balanceCents: account.balanceCents.toString(),
      },
    });
  }
}
