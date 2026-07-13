import { FastifyRequest, FastifyReply } from 'fastify';
import { InvestmentService } from '../services/investment-service';
import {
  CreateSipDTO,
  ExecuteSipPaymentDTO,
  SipIdParams,
  ExecuteManualSweepDTO,
} from '../schemas/investment-schemas';

export class InvestmentController {
  constructor(private investmentService: InvestmentService) {}

  async createSip(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { goalId, fundId, amountCents, frequency } = request.body as CreateSipDTO;
    const sip = await this.investmentService.createSip(
      userId,
      goalId,
      fundId,
      BigInt(amountCents),
      frequency,
    );
    return reply.status(201).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        ...sip,
        amountCents: sip.amountCents.toString(),
      },
    });
  }

  async executeSipPayment(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as SipIdParams;
    const { accountId } = request.body as ExecuteSipPaymentDTO;
    const investment = (await this.investmentService.executeSipPayment(
      userId,
      id,
      accountId,
    )) as any;
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        ...investment,
        amountCents: investment.amountCents.toString(),
        goal: {
          ...investment.goal,
          targetCents: investment.goal.targetCents.toString(),
          currentCents: investment.goal.currentCents.toString(),
        },
      },
    });
  }

  async getRecommendations(request: FastifyRequest, reply: FastifyReply) {
    const funds = await this.investmentService.getRecommendedProducts();
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: funds,
    });
  }

  async executeManualSweep(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { accountId, goalId, fundId, amountCents } = request.body as ExecuteManualSweepDTO;
    const investment = (await this.investmentService.executeManualSweep(
      userId,
      accountId,
      goalId,
      fundId,
      BigInt(amountCents),
    )) as any;
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        ...investment,
        amountCents: investment.amountCents.toString(),
        goal: {
          ...investment.goal,
          targetCents: investment.goal.targetCents.toString(),
          currentCents: investment.goal.currentCents.toString(),
        },
      },
    });
  }
}
