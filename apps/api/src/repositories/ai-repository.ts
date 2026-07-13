import { prisma } from '../config/prisma';
import { AiConversation, AiMessage } from '@prisma/client';

export interface IAiRepository {
  createConversation(userId: string, title?: string): Promise<AiConversation>;
  addMessage(
    conversationId: string,
    sender: string,
    text: string,
    intentDetected?: string,
  ): Promise<AiMessage>;
  getConversationHistory(conversationId: string): Promise<AiConversation | null>;
  getConversationsByUserId(userId: string): Promise<AiConversation[]>;
}

export class AiRepository implements IAiRepository {
  async createConversation(userId: string, title?: string): Promise<AiConversation> {
    return prisma.aiConversation.create({
      data: {
        userId,
        title,
      },
    });
  }

  async addMessage(
    conversationId: string,
    sender: string,
    text: string,
    intentDetected?: string,
  ): Promise<AiMessage> {
    return prisma.aiMessage.create({
      data: {
        conversationId,
        sender,
        text,
        intentDetected,
      },
    });
  }

  async getConversationHistory(conversationId: string): Promise<AiConversation | null> {
    return prisma.aiConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async getConversationsByUserId(userId: string): Promise<AiConversation[]> {
    return prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
