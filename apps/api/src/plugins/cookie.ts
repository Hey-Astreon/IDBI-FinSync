import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import { env } from '../config/env';

const cookiePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyCookie, {
    secret: env.JWT_SECRET,
    parseOptions: {},
  });
};

export default fp(cookiePlugin);
