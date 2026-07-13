import { z } from 'zod';

export const NotificationIdParamsSchema = z.object({
  id: z.string().uuid(),
});
export type NotificationIdParams = z.infer<typeof NotificationIdParamsSchema>;
