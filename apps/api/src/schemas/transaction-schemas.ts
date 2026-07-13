import { z } from 'zod';
import { TransactionCategory, TransactionType } from '@prisma/client';

// amountCents coerced to a strict positive integer
const positiveIntSchema = z.coerce
  .number({ invalid_type_error: 'Amount must be a number.' })
  .int({ message: 'Amount must be a whole number (no decimals).' })
  .positive({ message: 'Amount must be greater than zero.' });

export const CreateTransactionDtoSchema = z.object({
  accountId: z.string().uuid(),
  amountCents: positiveIntSchema,
  type: z.nativeEnum(TransactionType),
  category: z.nativeEnum(TransactionCategory),
  merchantName: z.string().max(255).optional(),
});
export type CreateTransactionDTO = z.infer<typeof CreateTransactionDtoSchema>;

export const GetTransactionsQuerySchema = z.object({
  category: z.nativeEnum(TransactionCategory).optional(),
  type: z.nativeEnum(TransactionType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  // Coerce page/limit and apply max bounds to prevent abuse
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type GetTransactionsQuery = z.infer<typeof GetTransactionsQuerySchema>;
