import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/user-service';
import { UpdateProfileDTO, UpdatePreferencesDTO } from '../schemas/user-schemas';

export class UserController {
  constructor(private userService: UserService) {}

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const profile = await this.userService.getUserProfile(userId);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: profile,
    });
  }

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const data = request.body as UpdateProfileDTO;
    const updated = await this.userService.updateProfile(userId, data);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: updated,
    });
  }

  async updatePreferences(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const data = request.body as UpdatePreferencesDTO;
    const updated = await this.userService.updatePreferences(userId, data);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: updated,
    });
  }
}
