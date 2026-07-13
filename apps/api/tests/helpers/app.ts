import Fastify, { FastifyInstance } from 'fastify';

import { errorHandler } from '../../src/middlewares/error-middleware';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';

export const TEST_JWT_SECRET = 'test_jwt_secret_that_is_long_enough_32_chars';

/**
 * Creates a barebones Fastify test app with JWT + Cookie plugins registered.
 * Use this to mount individual route handlers in tests.
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  app.setErrorHandler(errorHandler);

  await app.register(fastifyCookie, { secret: TEST_JWT_SECRET });
  await app.register(fastifyJwt, {
    secret: TEST_JWT_SECRET,
    cookie: { cookieName: 'refreshToken', signed: false },
  });

  return app;
}

/**
 * Signs a test JWT access token for a given user payload.
 */
export function signTestToken(
  app: FastifyInstance,
  payload: { id: string; email: string },
): string {
  return app.jwt.sign(payload, { expiresIn: '15m' });
}

/**
 * Signs a test JWT refresh token.
 */
export function signRefreshToken(app: FastifyInstance, payload: { id: string }): string {
  return app.jwt.sign(payload, { expiresIn: '7d' });
}
