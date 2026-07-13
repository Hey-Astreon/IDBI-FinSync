import { IAiRepository } from '../repositories/ai-repository';
import { IUserRepository } from '../repositories/user-repository';
import { IAccountRepository } from '../repositories/account-repository';
import { IGoalRepository } from '../repositories/goal-repository';
import { AiConversation, AiMessage } from '@prisma/client';
import { NotFoundError, AuthorizationError } from '../errors/app-errors';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class AIService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private aiRepo: IAiRepository,
    private userRepo: IUserRepository,
    private accountRepo: IAccountRepository,
    private goalRepo: IGoalRepository,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'AIzaSyPlaceholderKeyForLocalDevelopmentAndDemos') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async getConversationList(userId: string): Promise<AiConversation[]> {
    return this.aiRepo.getConversationsByUserId(userId);
  }

  async getConversationHistory(userId: string, conversationId: string): Promise<AiMessage[]> {
    const conversation = (await this.aiRepo.getConversationHistory(conversationId)) as any;
    if (!conversation) {
      throw new NotFoundError('Conversation thread not found.');
    }
    if (conversation.userId !== userId) {
      throw new AuthorizationError('You do not own this conversation.');
    }
    return conversation.messages;
  }

  async sendMessage(
    userId: string,
    conversationId: string | null,
    text: string,
  ): Promise<{ conversationId: string; response: AiMessage }> {
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const conv = await this.aiRepo.createConversation(userId, 'Financial Sync Discussion');
      activeConversationId = conv.id;
    }

    // 1. Save user query
    await this.aiRepo.addMessage(activeConversationId, 'USER', text);

    // 2. Fetch context
    const user = await this.userRepo.findById(userId);
    const accounts = await this.accountRepo.findByUserId(userId);
    const goals = await this.goalRepo.findByUserId(userId);

    const balanceSum = accounts.reduce((sum, acc) => sum + acc.balanceCents, 0n);

    // 3. Build prompts
    const contextPrompt = `
      You are Mitra, a supportive and expert AI financial companion for IDBI Bank.
      The user is ${user?.email || 'Valued Customer'}.
      Their total connected account balance: INR ${(Number(balanceSum) / 100).toFixed(2)}.
      Their active financial goals: ${
        goals
          .map(
            (g) =>
              `"${g.title}" (Saved: INR ${(Number(g.currentCents) / 100).toFixed(2)} of INR ${(
                Number(g.targetCents) / 100
              ).toFixed(2)})`,
          )
          .join(', ') || 'No active goals set.'
      }.
      
      Rules:
      - Be warm, encouraging, objective, and brief (2-3 sentences max).
      - Do not use financial jargon.
      - If the user asks to save or invest, suggest running a simulation or using their surplus balance.
    `;

    let responseText = `Hi, I am Mitra. Let's start optimizing your surplus balance of INR ${(
      Number(balanceSum) / 100
    ).toFixed(2)} today.`;
    const intentDetected = 'GET_CASHFLOW';

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(`${contextPrompt}\nUser Query: ${text}`);
        const generatedText = result.response.text();
        if (generatedText) {
          responseText = generatedText.trim();
        }
      } catch (err) {
        console.error('LLM API error, falling back to template responses:', err);
      }
    }

    // 4. Save response message
    const responseMessage = await this.aiRepo.addMessage(
      activeConversationId,
      'MITRA',
      responseText,
      intentDetected,
    );

    return {
      conversationId: activeConversationId,
      response: responseMessage,
    };
  }
}
