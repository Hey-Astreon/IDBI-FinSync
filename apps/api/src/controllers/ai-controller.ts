import { FastifyRequest, FastifyReply } from 'fastify';
import { AIService } from '../services/ai-service';
import { SendMessageDTO, ConversationIdParams } from '../schemas/ai-schemas';

export class AIController {
  constructor(private aiService: AIService) {}

  async sendMessage(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { conversationId, text } = request.body as SendMessageDTO;
    const result = await this.aiService.sendMessage(userId, conversationId, text);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: result,
    });
  }

  async getConversations(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const conversations = await this.aiService.getConversationList(userId);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: conversations,
    });
  }

  async getHistory(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as ConversationIdParams;
    const history = await this.aiService.getConversationHistory(userId, id);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: history,
    });
  }
}
