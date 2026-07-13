import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env';

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
    },
    sign: {
      expiresIn: '15m',
    },
  });
};

export default fp(jwtPlugin);
