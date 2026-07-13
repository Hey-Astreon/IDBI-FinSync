import { z } from 'zod';
import { SipFrequency } from '@prisma/client';

// amountCents coerced to a strict positive integer
const positiveIntSchema = z.coerce
  .number({ invalid_type_error: 'Amount must be a number.' })
  .int({ message: 'Amount must be a whole number (no decimals).' })
  .positive({ message: 'Amount must be greater than zero.' });

export const CreateSipDtoSchema = z.object({
  goalId: z.string().uuid(),
  fundId: z.string().uuid(),
  amountCents: positiveIntSchema,
  frequency: z.nativeEnum(SipFrequency),
});
export type CreateSipDTO = z.infer<typeof CreateSipDtoSchema>;

export const ExecuteSipPaymentDtoSchema = z.object({
  accountId: z.string().uuid(),
});
export type ExecuteSipPaymentDTO = z.infer<typeof ExecuteSipPaymentDtoSchema>;

export const SipIdParamsSchema = z.object({
  id: z.string().uuid(),
});
export type SipIdParams = z.infer<typeof SipIdParamsSchema>;

export const ExecuteManualSweepDtoSchema = z.object({
  accountId: z.string().uuid(),
  goalId: z.string().uuid(),
  fundId: z.string().uuid(),
  amountCents: positiveIntSchema,
});
export type ExecuteManualSweepDTO = z.infer<typeof ExecuteManualSweepDtoSchema>;
