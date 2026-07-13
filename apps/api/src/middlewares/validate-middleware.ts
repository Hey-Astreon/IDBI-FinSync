import { FastifyRequest, FastifyReply } from 'fastify';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../errors/app-errors';

export const validate = (schema: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}) => {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      if (schema.body) {
        request.body = await schema.body.parseAsync(request.body);
      }
      if (schema.query) {
        request.query = await schema.query.parseAsync(request.query);
      }
      if (schema.params) {
        request.params = await schema.params.parseAsync(request.params);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          rule: issue.code,
          message: issue.message,
        }));
        throw new ValidationError('Request validation failed.', details);
      }
      throw error;
    }
  };
};
