import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../errors/app-errors';
import { env } from '../config/env';

export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  const timestamp = new Date().toISOString();
  const showStack = env.NODE_ENV === 'development';

  if (error instanceof AppError) {
    // Log user domain errors as warnings/info, not full error stack traces to avoid log noise
    request.log.warn(
      {
        code: error.code,
        message: error.message,
        userId: (request.user as any)?.id || 'ANONYMOUS',
      },
      `Domain exception triggered: ${error.message}`,
    );

    return reply.status(error.statusCode).send({
      success: false,
      timestamp,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
        ...(showStack && { stack: error.stack }),
      },
    });
  }

  // Handle unexpected standard execution system faults (5xx)
  request.log.error(
    {
      err: error,
      userId: (request.user as any)?.id || 'ANONYMOUS',
      requestId: request.id,
    },
    `System exception captured: ${error.message}`,
  );

  return reply.status(error.statusCode || 500).send({
    success: false,
    timestamp,
    error: {
      code: 'SYS_001',
      message:
        error.statusCode && error.statusCode < 500
          ? error.message
          : 'An unexpected server error occurred.',
      ...(showStack && { stack: error.stack }),
    },
  });
};
