import { z } from 'zod';

export const LinkAccountDtoSchema = z.object({
  accountNumber: z.string().min(10),
  accountType: z.enum(['SAVINGS', 'CURRENT']),
});
export type LinkAccountDTO = z.infer<typeof LinkAccountDtoSchema>;

export const GetAccountDetailsParamsSchema = z.object({
  id: z.string().uuid(),
});
export type GetAccountDetailsParams = z.infer<typeof GetAccountDetailsParamsSchema>;
