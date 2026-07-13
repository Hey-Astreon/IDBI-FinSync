import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth-controller';
import { AuthService } from '../services/auth-service';
import { AuthRepository } from '../repositories/auth-repository';
import { UserRepository } from '../repositories/user-repository';
import { validate } from '../middlewares/validate-middleware';
import {
  RegisterDtoSchema,
  LoginDtoSchema,
  RequestOtpDtoSchema,
  VerifyOtpDtoSchema,
} from '../schemas/auth-schemas';

const authRepo = new AuthRepository();
const userRepo = new UserRepository();
const authService = new AuthService(authRepo, userRepo);
const authController = new AuthController(authService);

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/register',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
      preHandler: validate({
        body: RegisterDtoSchema,
      }),
    },
    (req, rep) => authController.register(req, rep),
  );

  fastify.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
      preHandler: validate({
        body: LoginDtoSchema,
      }),
    },
    (req, rep) => authController.login(req, rep),
  );

  fastify.post('/refresh', (req, rep) => authController.refresh(req, rep));

  fastify.post('/logout', (req, rep) => authController.logout(req, rep));

  fastify.post(
    '/otp/request',
    {
      config: {
        rateLimit: {
          max: 3,
          timeWindow: '1 minute',
        },
      },
      preHandler: validate({
        body: RequestOtpDtoSchema,
      }),
    },
    (req, rep) => authController.requestOtp(req, rep),
  );

  fastify.post(
    '/otp/verify',
    {
      config: {
        rateLimit: {
          max: 3,
          timeWindow: '1 minute',
        },
      },
      preHandler: validate({
        body: VerifyOtpDtoSchema,
      }),
    },
    (req, rep) => authController.verifyOtp(req, rep),
  );
}
