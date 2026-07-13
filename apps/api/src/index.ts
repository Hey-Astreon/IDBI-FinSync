import { env } from './config/env'; // Validate environment variables immediately on startup
import Fastify from 'fastify';
import cors from '@fastify/cors';

// Import Custom Plugins
import prismaPlugin from './plugins/prisma';
import jwtPlugin from './plugins/jwt';
import rateLimitPlugin from './plugins/rate-limit';
import helmetPlugin from './plugins/helmet';
import cookiePlugin from './plugins/cookie';

// Import Router and Error Handler
import { router } from './routes';
import { errorHandler } from './middlewares/error-middleware';

const server = Fastify({
  logger: {
    level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  },
  disableRequestLogging: true, // Disable standard request log to write structured logs manually
});

// Register Global Error Handler
server.setErrorHandler(errorHandler);

// Register Core Plugins
server.register(prismaPlugin);
server.register(jwtPlugin);
server.register(rateLimitPlugin);
server.register(helmetPlugin);
server.register(cookiePlugin);

// Configure dynamic whitelisted CORS domains
const corsWhitelist = env.CORS_WHITELIST.split(',').map((domain) => domain.trim());

server.register(cors, {
  origin: (origin, cb) => {
    // Allow server-to-server calls / non-browser requests (no Origin header)
    if (!origin) {
      return cb(null, true);
    }
    // Use exact equality — startsWith() is exploitable via query-string spoofing
    const isAllowed = corsWhitelist.includes(origin);
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS restrictions.'), false);
    }
  },
  credentials: true,
});

// Attach performance startTime tracker
server.addHook('onRequest', async (request) => {
  (request as any).startTime = Date.now();
});

// Output structured transaction metrics on every connection log
server.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - ((request as any).startTime || Date.now());
  const userId = (request.user as any)?.id || 'ANONYMOUS';
  const ip = request.ip;
  const requestId = request.id;
  const method = request.method;
  const url = request.url;
  const status = reply.statusCode;

  server.log.info(
    {
      requestId,
      userId,
      method,
      url,
      ip,
      durationMs: duration,
      status,
    },
    `HTTP ${method} ${url} finished with status ${status}`,
  );
});

// Register Router prefixed with API base path
server.register(router, { prefix: '/api/v1' });

// Base System Health Check
server.get('/health', async (request, reply) => {
  try {
    // Perform simple query to confirm DB connectivity
    await server.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      database: 'up',
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    server.log.error(err, 'Health check failed: database unreachable.');
    return reply.status(503).send({
      status: 'unhealthy',
      database: 'down',
      timestamp: new Date().toISOString(),
    });
  }
});

const start = async () => {
  try {
    await server.listen({ port: env.PORT, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown sequence
const shutdown = async (signal: string) => {
  server.log.info(`Received ${signal}. Initiating clean shutdown process.`);
  try {
    // server.close() triggers the prismaPlugin onClose hook which disconnects Prisma cleanly
    await server.close();
    server.log.info('Fastify server closed. Prisma pool released.');
    process.exit(0);
  } catch (err) {
    server.log.error(err, 'Error encountered during shutdown lifecycle.');
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
