import { prisma } from '../config/prisma';
import { User, UserPreferences, Prisma } from '@prisma/client';

export interface IUserRepository {
  create(data: Prisma.UserCreateInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByMobileNumber(mobileNumber: string): Promise<User | null>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
  updatePreferences(
    userId: string,
    data: Prisma.UserPreferencesUncheckedUpdateInput,
  ): Promise<UserPreferences>;
}

export class UserRepository implements IUserRepository {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
      include: {
        preferences: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findByMobileNumber(mobileNumber: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { mobileNumber },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePreferences(
    userId: string,
    data: Prisma.UserPreferencesUncheckedUpdateInput,
  ): Promise<UserPreferences> {
    return prisma.userPreferences.update({
      where: { userId },
      data,
    });
  }
}
