import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/user-controller';
import { UserService } from '../services/user-service';
import { UserRepository } from '../repositories/user-repository';
import { authenticate } from '../middlewares/auth-middleware';
import { validate } from '../middlewares/validate-middleware';
import { UpdateProfileDtoSchema, UpdatePreferencesDtoSchema } from '../schemas/user-schemas';

const userRepo = new UserRepository();
const userService = new UserService(userRepo);
const userController = new UserController(userService);

export async function userRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/profile', (req, rep) => userController.getProfile(req, rep));

  fastify.put(
    '/profile',
    {
      preHandler: validate({
        body: UpdateProfileDtoSchema,
      }),
    },
    (req, rep) => userController.updateProfile(req, rep),
  );

  fastify.patch(
    '/preferences',
    {
      preHandler: validate({
        body: UpdatePreferencesDtoSchema,
      }),
    },
    (req, rep) => userController.updatePreferences(req, rep),
  );
}
