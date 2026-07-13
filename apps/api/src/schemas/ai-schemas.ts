import { z } from 'zod';

export const SendMessageDtoSchema = z.object({
  conversationId: z.string().uuid().nullable(),
  text: z.string().min(1).max(2000, { message: 'Message cannot exceed 2000 characters.' }),
});
export type SendMessageDTO = z.infer<typeof SendMessageDtoSchema>;

export const ConversationIdParamsSchema = z.object({
  id: z.string().uuid(),
});
export type ConversationIdParams = z.infer<typeof ConversationIdParamsSchema>;
