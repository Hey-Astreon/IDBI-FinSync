import { prisma } from '../config/prisma';
import { Goal, GoalMilestone, Prisma } from '@prisma/client';

export interface IGoalRepository {
  create(data: Prisma.GoalUncheckedCreateInput): Promise<Goal>;
  findById(id: string): Promise<Goal | null>;
  findByUserId(userId: string): Promise<Goal[]>;
  update(id: string, data: Prisma.GoalUpdateInput): Promise<Goal>;
  addMilestone(data: Prisma.GoalMilestoneUncheckedCreateInput): Promise<GoalMilestone>;
  addMilestones(data: Prisma.GoalMilestoneUncheckedCreateInput[]): Promise<void>;
  getMilestones(goalId: string): Promise<GoalMilestone[]>;
  updateMilestoneAchievement(id: string, isAchieved: boolean): Promise<GoalMilestone>;
}

export class GoalRepository implements IGoalRepository {
  async create(data: Prisma.GoalUncheckedCreateInput): Promise<Goal> {
    return prisma.goal.create({
      data,
      include: {
        milestones: true,
      },
    });
  }

  async findById(id: string): Promise<Goal | null> {
    return prisma.goal.findUnique({
      where: { id },
      include: {
        milestones: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Goal[]> {
    return prisma.goal.findMany({
      where: { userId },
      include: {
        milestones: true,
      },
      orderBy: { deadline: 'asc' },
    });
  }

  async update(id: string, data: Prisma.GoalUpdateInput): Promise<Goal> {
    return prisma.goal.update({
      where: { id },
      data,
      include: {
        milestones: true,
      },
    });
  }

  async addMilestone(data: Prisma.GoalMilestoneUncheckedCreateInput): Promise<GoalMilestone> {
    return prisma.goalMilestone.create({
      data,
    });
  }

  async addMilestones(data: Prisma.GoalMilestoneUncheckedCreateInput[]): Promise<void> {
    // Single atomic batch insert — replaces sequential await loop
    await prisma.goalMilestone.createMany({ data });
  }

  async getMilestones(goalId: string): Promise<GoalMilestone[]> {
    return prisma.goalMilestone.findMany({
      where: { goalId },
      orderBy: { percentage: 'asc' },
    });
  }

  async updateMilestoneAchievement(id: string, isAchieved: boolean): Promise<GoalMilestone> {
    return prisma.goalMilestone.update({
      where: { id },
      data: { isAchieved },
    });
  }
}
