import { z } from 'zod';

// amountCents coerced to a strict positive integer
const positiveIntSchema = z.coerce
  .number({ invalid_type_error: 'Amount must be a number.' })
  .int({ message: 'Amount must be a whole number (no decimals).' })
  .positive({ message: 'Amount must be greater than zero.' });

export const CreateGoalDtoSchema = z.object({
  title: z.string().min(3),
  targetCents: positiveIntSchema,
  deadline: z
    .string()
    .datetime()
    .refine((d) => new Date(d) > new Date(), {
      message: 'Deadline must be a future date.',
    }),
});
export type CreateGoalDTO = z.infer<typeof CreateGoalDtoSchema>;

export const AddFundsDtoSchema = z.object({
  amountCents: positiveIntSchema,
});
export type AddFundsDTO = z.infer<typeof AddFundsDtoSchema>;

export const GoalIdParamsSchema = z.object({
  id: z.string().uuid(),
});
export type GoalIdParams = z.infer<typeof GoalIdParamsSchema>;
