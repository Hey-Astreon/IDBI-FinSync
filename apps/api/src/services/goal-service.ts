import { IGoalRepository } from '../repositories/goal-repository';
import { NotificationService } from './notification-service';
import { Goal, GoalStatus, GoalMilestone } from '@prisma/client';
import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
  GoalAlreadyCompletedError,
  ValidationError,
} from '../errors/app-errors';

export interface GoalProgressDTO {
  goal: Goal;
  percentageCompleted: number;
  milestones: GoalMilestone[];
}

export class GoalService {
  constructor(
    private goalRepo: IGoalRepository,
    private notificationService: NotificationService,
  ) {}

  async createGoal(
    userId: string,
    title: string,
    targetCents: bigint,
    deadline: Date,
  ): Promise<Goal> {
    if (targetCents <= 0n) {
      // Use ValidationError (400) not generic Error (500)
      throw new ValidationError('Target amount must be a positive value.');
    }

    const goal = await this.goalRepo.create({
      userId,
      title,
      targetCents,
      deadline,
      status: GoalStatus.ACTIVE,
    });

    // Initialize milestones at 25%, 50%, 75%, 100% — single DB round-trip via createMany
    await this.goalRepo.addMilestones([
      { goalId: goal.id, percentage: 25, isAchieved: false },
      { goalId: goal.id, percentage: 50, isAchieved: false },
      { goalId: goal.id, percentage: 75, isAchieved: false },
      { goalId: goal.id, percentage: 100, isAchieved: false },
    ]);

    await this.notificationService.createNotification(
      userId,
      'Goal Created!',
      `You've set a target of ₹${(Number(targetCents) / 100).toLocaleString()} for "${title}". Let's start saving!`,
    );

    // Fetch and return the updated goal structure
    const updatedGoal = await this.goalRepo.findById(goal.id);
    if (!updatedGoal) {
      throw new NotFoundError('Goal creation failed.');
    }
    return updatedGoal;
  }

  async getGoalDetails(userId: string, id: string): Promise<GoalProgressDTO> {
    const goal = (await this.goalRepo.findById(id)) as any;
    if (!goal) {
      throw new NotFoundError('Goal target not found.');
    }

    if (goal.userId !== userId) {
      throw new AuthorizationError('You do not own this goal.');
    }

    const target = Number(goal.targetCents);
    const current = Number(goal.currentCents);
    const percentageCompleted =
      target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

    return {
      goal,
      percentageCompleted,
      milestones: goal.milestones,
    };
  }

  async getUserGoals(userId: string): Promise<Goal[]> {
    return this.goalRepo.findByUserId(userId);
  }

  async addFundsToGoal(userId: string, id: string, amountCents: bigint): Promise<GoalProgressDTO> {
    const goal = (await this.goalRepo.findById(id)) as any;
    if (!goal) {
      throw new NotFoundError('Goal target not found.');
    }

    if (goal.userId !== userId) {
      throw new AuthorizationError('You do not own this goal.');
    }

    if (goal.status === GoalStatus.COMPLETED) {
      throw new GoalAlreadyCompletedError();
    }

    const newCurrentCents = goal.currentCents + amountCents;
    const isCompleted = newCurrentCents >= goal.targetCents;

    const updatedGoal = (await this.goalRepo.update(id, {
      currentCents: newCurrentCents,
      status: isCompleted ? GoalStatus.COMPLETED : goal.status,
    })) as any;

    const target = Number(updatedGoal.targetCents);
    const current = Number(updatedGoal.currentCents);
    const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

    // Evaluate milestone achievements
    const milestones = await this.goalRepo.getMilestones(id);
    for (const milestone of milestones) {
      if (!milestone.isAchieved && percentage >= milestone.percentage) {
        await this.goalRepo.updateMilestoneAchievement(milestone.id, true);
        await this.notificationService.createNotification(
          userId,
          `Goal Milestone Unlocked!`,
          `Congratulations! You've achieved ${milestone.percentage}% of your goal for "${updatedGoal.title}".`,
        );
      }
    }

    if (isCompleted) {
      await this.notificationService.createNotification(
        userId,
        `Goal Completed! 🎉`,
        `Amazing job! You have fully funded "${updatedGoal.title}".`,
      );
    }

    const updatedMilestones = await this.goalRepo.getMilestones(id);

    return {
      goal: updatedGoal,
      percentageCompleted: percentage,
      milestones: updatedMilestones,
    };
  }

  async pauseGoal(userId: string, id: string): Promise<Goal> {
    const goal = await this.goalRepo.findById(id);
    if (!goal) {
      throw new NotFoundError('Goal target not found.');
    }
    if (goal.userId !== userId) {
      throw new AuthorizationError('You do not own this goal.');
    }
    if (goal.status === GoalStatus.COMPLETED) {
      throw new ConflictError('Cannot pause a completed goal.');
    }
    return this.goalRepo.update(id, { status: GoalStatus.PAUSED });
  }

  async resumeGoal(userId: string, id: string): Promise<Goal> {
    const goal = await this.goalRepo.findById(id);
    if (!goal) {
      throw new NotFoundError('Goal target not found.');
    }
    if (goal.userId !== userId) {
      throw new AuthorizationError('You do not own this goal.');
    }
    if (goal.status !== GoalStatus.PAUSED) {
      throw new ConflictError('Goal is not currently paused.');
    }
    return this.goalRepo.update(id, { status: GoalStatus.ACTIVE });
  }
}
