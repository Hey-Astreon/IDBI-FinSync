import { FastifyRequest, FastifyReply } from 'fastify';
import { GoalService } from '../services/goal-service';
import { CreateGoalDTO, AddFundsDTO, GoalIdParams } from '../schemas/goal-schemas';

export class GoalController {
  constructor(private goalService: GoalService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { title, targetCents, deadline } = request.body as CreateGoalDTO;
    const goal = await this.goalService.createGoal(
      userId,
      title,
      BigInt(targetCents),
      new Date(deadline),
    );
    return reply.status(201).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        ...goal,
        targetCents: goal.targetCents.toString(),
        currentCents: goal.currentCents.toString(),
      },
    });
  }

  async getDetails(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as GoalIdParams;
    const details = await this.goalService.getGoalDetails(userId, id);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        goal: {
          ...details.goal,
          targetCents: details.goal.targetCents.toString(),
          currentCents: details.goal.currentCents.toString(),
        },
        percentageCompleted: details.percentageCompleted,
        milestones: details.milestones,
      },
    });
  }

  async getGoals(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const goals = await this.goalService.getUserGoals(userId);
    const formattedGoals = goals.map((goal) => ({
      ...goal,
      targetCents: goal.targetCents.toString(),
      currentCents: goal.currentCents.toString(),
    }));
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: formattedGoals,
    });
  }

  async addFunds(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as GoalIdParams;
    const { amountCents } = request.body as AddFundsDTO;
    const details = await this.goalService.addFundsToGoal(userId, id, BigInt(amountCents));
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        goal: {
          ...details.goal,
          targetCents: details.goal.targetCents.toString(),
          currentCents: details.goal.currentCents.toString(),
        },
        percentageCompleted: details.percentageCompleted,
        milestones: details.milestones,
      },
    });
  }

  async pause(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as GoalIdParams;
    const goal = await this.goalService.pauseGoal(userId, id);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        ...goal,
        targetCents: goal.targetCents.toString(),
        currentCents: goal.currentCents.toString(),
      },
    });
  }

  async resume(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as GoalIdParams;
    const goal = await this.goalService.resumeGoal(userId, id);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        ...goal,
        targetCents: goal.targetCents.toString(),
        currentCents: goal.currentCents.toString(),
      },
    });
  }
}
