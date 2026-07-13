import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth-routes';
import { userRoutes } from './user-routes';
import { accountRoutes } from './account-routes';
import { goalRoutes } from './goal-routes';
import { transactionRoutes } from './transaction-routes';
import { investmentRoutes } from './investment-routes';
import { aiRoutes } from './ai-routes';
import { notificationRoutes } from './notification-routes';

export async function router(fastify: FastifyInstance) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(userRoutes, { prefix: '/user' });
  fastify.register(accountRoutes, { prefix: '/accounts' });
  fastify.register(goalRoutes, { prefix: '/goals' });
  fastify.register(transactionRoutes, { prefix: '/transactions' });
  fastify.register(investmentRoutes, { prefix: '/investments' });
  fastify.register(aiRoutes, { prefix: '/ai' });
  fastify.register(notificationRoutes, { prefix: '/notifications' });
}
