import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticationError } from '../errors/app-errors';

export const authenticate = async (request: FastifyRequest, _reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch {
    throw new AuthenticationError('Access token is invalid or expired.');
  }
};
