import { IUserRepository } from '../repositories/user-repository';
import { User, UserPreferences, Prisma } from '@prisma/client';
import { NotFoundError } from '../errors/app-errors';

export type UserProfileDTO = Omit<User, 'passwordHash'> & {
  preferences: UserPreferences | null;
};

export class UserService {
  constructor(private userRepo: IUserRepository) {}

  async getUserProfile(id: string): Promise<UserProfileDTO> {
    const user = (await this.userRepo.findById(id)) as any;
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    const { passwordHash: _, ...profile } = user;
    return profile as UserProfileDTO;
  }

  async updateProfile(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<Omit<User, 'passwordHash'>> {
    const userExists = await this.userRepo.findById(id);
    if (!userExists) {
      throw new NotFoundError('User profile not found.');
    }

    const updatedUser = await this.userRepo.update(id, data);
    const { passwordHash: _, ...profile } = updatedUser;
    return profile;
  }

  async updatePreferences(
    userId: string,
    data: Prisma.UserPreferencesUncheckedUpdateInput,
  ): Promise<UserPreferences> {
    const userExists = await this.userRepo.findById(userId);
    if (!userExists) {
      throw new NotFoundError('User profile not found.');
    }

    return this.userRepo.updatePreferences(userId, data);
  }
}
