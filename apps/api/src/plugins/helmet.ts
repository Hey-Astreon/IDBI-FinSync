import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import fastifyHelmet from '@fastify/helmet';

const helmetPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyHelmet, {
    contentSecurityPolicy: true,
  });
};

export default fp(helmetPlugin);
