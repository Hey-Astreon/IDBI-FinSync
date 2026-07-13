import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });
};

export default fp(rateLimitPlugin);
