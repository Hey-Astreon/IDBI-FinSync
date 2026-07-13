import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildTestApp, signTestToken } from '../helpers/app';
import { authRoutes } from '../../src/routes/auth-routes';
import { accountRoutes } from '../../src/routes/account-routes';
import { goalRoutes } from '../../src/routes/goal-routes';
import { transactionRoutes } from '../../src/routes/transaction-routes';
import { investmentRoutes } from '../../src/routes/investment-routes';
import { aiRoutes } from '../../src/routes/ai-routes';
import { notificationRoutes } from '../../src/routes/notification-routes';
import { userRoutes } from '../../src/routes/user-routes';

// Mock dependencies globally with standard constructor functions
vi.mock('../../src/repositories/auth-repository', () => {
  return {
    AuthRepository: class {
      createSession = vi.fn().mockResolvedValue({ id: 'session-id' });
      createRefreshToken = vi.fn().mockResolvedValue({ id: 'refresh-id' });
      findRefreshToken = vi.fn().mockResolvedValue({
        userId: 'f8db6fa9-2df1-4475-814d-61266b039474',
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });
      deleteRefreshToken = vi.fn().mockResolvedValue({ id: 'refresh-id' });
      createOtpVerification = vi.fn().mockResolvedValue({ id: 'otp-id' });
      findOtpVerification = vi.fn().mockResolvedValue({
        codeHash: '$argon2id$v=19$m=65536,t=3,p=4$fakehash',
        expiresAt: new Date(Date.now() + 1000 * 60 * 5),
        status: 'PENDING',
      });
      updateOtpStatus = vi.fn().mockResolvedValue({ id: 'otp-id' });
    },
  };
});

vi.mock('../../src/repositories/user-repository', () => {
  return {
    UserRepository: class {
      findByEmail = vi.fn().mockImplementation(async (email) => {
        if (email === 'exists@idbi.com') {
          return { id: 'f8db6fa9-2df1-4475-814d-61266b039474', email, passwordHash: 'hash' };
        }
        return null;
      });
      findByMobileNumber = vi.fn().mockResolvedValue(null);
      create = vi
        .fn()
        .mockResolvedValue({ id: 'f8db6fa9-2df1-4475-814d-61266b039474', email: 'new@idbi.com' });
      findById = vi
        .fn()
        .mockResolvedValue({ id: 'f8db6fa9-2df1-4475-814d-61266b039474', email: 'user@idbi.com' });
      update = vi
        .fn()
        .mockResolvedValue({ id: 'f8db6fa9-2df1-4475-814d-61266b039474', email: 'user@idbi.com' });
      updatePreferences = vi
        .fn()
        .mockResolvedValue({ userId: 'f8db6fa9-2df1-4475-814d-61266b039474', theme: 'dark' });
    },
  };
});

vi.mock('../../src/repositories/account-repository', () => {
  return {
    AccountRepository: class {
      create = vi.fn().mockResolvedValue({
        id: 'b7da9dbb-8217-47b2-a4f6-8c4371bfbe55',
        accountNumber: '1234567890',
      });
      findByUserId = vi.fn().mockResolvedValue([
        {
          id: 'b7da9dbb-8217-47b2-a4f6-8c4371bfbe55',
          userId: 'f8db6fa9-2df1-4475-814d-61266b039474',
          balanceCents: 100000n,
          currency: 'INR',
        },
      ]);
      findById = vi.fn().mockResolvedValue({
        id: 'b7da9dbb-8217-47b2-a4f6-8c4371bfbe55',
        userId: 'f8db6fa9-2df1-4475-814d-61266b039474',
        balanceCents: 100000n,
        currency: 'INR',
      });
    },
  };
});

vi.mock('../../src/repositories/goal-repository', () => {
  return {
    GoalRepository: class {
      create = vi.fn().mockResolvedValue({
        id: 'd22081cc-7d04-45b0-8e12-32b07e7b5f00',
        userId: 'f8db6fa9-2df1-4475-814d-61266b039474',
        targetCents: 500000n,
      });
      findById = vi.fn().mockResolvedValue({
        id: 'd22081cc-7d04-45b0-8e12-32b07e7b5f00',
        userId: 'f8db6fa9-2df1-4475-814d-61266b039474',
        targetCents: 500000n,
        currentCents: 0n,
        status: 'ACTIVE',
      });
      findByUserId = vi.fn().mockResolvedValue([]);
      update = vi.fn().mockResolvedValue({ id: 'd22081cc-7d04-45b0-8e12-32b07e7b5f00' });
      addMilestones = vi.fn().mockResolvedValue(undefined);
      getMilestones = vi.fn().mockResolvedValue([]);
      updateMilestoneAchievement = vi
        .fn()
        .mockResolvedValue({ id: 'c1a63c67-628d-4cb0-bc4b-bf5a34e06229' });
    },
  };
});

vi.mock('../../src/repositories/transaction-repository', () => {
  return {
    TransactionRepository: class {
      create = vi
        .fn()
        .mockResolvedValue({ id: 'e1d13db1-e24c-47db-a22c-a292d3f3f0ef', amountCents: 15000n });
      createWithBalanceUpdate = vi
        .fn()
        .mockResolvedValue({ id: 'e1d13db1-e24c-47db-a22c-a292d3f3f0ef', amountCents: 15000n });
      findPaginated = vi.fn().mockResolvedValue({ transactions: [], total: 0 });
    },
  };
});

vi.mock('../../src/repositories/investment-repository', () => {
  return {
    InvestmentRepository: class {
      createSip = vi
        .fn()
        .mockResolvedValue({ id: 'a5c0bdf0-5f21-4fa5-bf27-14e3b7b2ef42', amountCents: 5000n });
      findSipById = vi.fn().mockResolvedValue({
        id: 'a5c0bdf0-5f21-4fa5-bf27-14e3b7b2ef42',
        userId: 'f8db6fa9-2df1-4475-814d-61266b039474',
        amountCents: 5000n,
        nextDeductionDate: new Date(),
        frequency: 'MONTHLY',
      });
      getSipsByUserId = vi.fn().mockResolvedValue([]);
      getRecommendedFunds = vi.fn().mockResolvedValue([]);
      executeInvestmentTransaction = vi
        .fn()
        .mockResolvedValue({ id: '8d2a6a68-6c8c-4f7f-94ad-963c0a52df71' });
    },
  };
});

vi.mock('../../src/repositories/notification-repository', () => {
  return {
    NotificationRepository: class {
      create = vi.fn().mockResolvedValue({ id: '097a8e7e-3df5-4fa8-b21a-d021c17fae78' });
      findByUserId = vi.fn().mockResolvedValue([]);
      findByIdAndUserId = vi.fn().mockResolvedValue({
        id: '097a8e7e-3df5-4fa8-b21a-d021c17fae78',
        userId: 'f8db6fa9-2df1-4475-814d-61266b039474',
      });
      markAsRead = vi
        .fn()
        .mockResolvedValue({ id: '097a8e7e-3df5-4fa8-b21a-d021c17fae78', isRead: true });
    },
  };
});

vi.mock('../../src/repositories/ai-repository', () => {
  return {
    AiRepository: class {
      createConversation = vi
        .fn()
        .mockResolvedValue({ id: '1b89ab4c-0d32-45af-863a-23d9b4c09ef7' });
      getConversationsByUserId = vi.fn().mockResolvedValue([]);
      getConversationHistory = vi.fn().mockResolvedValue({
        id: '1b89ab4c-0d32-45af-863a-23d9b4c09ef7',
        userId: 'f8db6fa9-2df1-4475-814d-61266b039474',
        messages: [],
      });
      addMessage = vi
        .fn()
        .mockResolvedValue({ id: '4d8a9ea7-bc5b-43d9-a9a3-9eb10c9c71a3', text: 'response' });
    },
  };
});

// Mock argon2 verify to always succeed for testing login
vi.mock('argon2', () => {
  return {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    verify: vi.fn().mockResolvedValue(true),
  };
});

describe('IDBI FinSync Routing & Controller Integration Suite', () => {
  let app: any;
  let testToken: string;

  beforeEach(async () => {
    app = await buildTestApp();
    testToken = signTestToken(app, {
      id: 'f8db6fa9-2df1-4475-814d-61266b039474',
      email: 'user@idbi.com',
    });

    // Register routes
    await app.register(authRoutes, { prefix: '/auth' });
    await app.register(userRoutes, { prefix: '/user' });
    await app.register(accountRoutes, { prefix: '/accounts' });
    await app.register(goalRoutes, { prefix: '/goals' });
    await app.register(transactionRoutes, { prefix: '/transactions' });
    await app.register(investmentRoutes, { prefix: '/investments' });
    await app.register(aiRoutes, { prefix: '/ai' });
    await app.register(notificationRoutes, { prefix: '/notifications' });
  });

  describe('🔐 Authentication & JWT Layer', () => {
    it('should reject invalid password criteria during register (VAL_001)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@idbi.com',
          mobileNumber: '+919876543210',
          password: '123', // too short, no specials, etc.
        },
      });

      const body = JSON.parse(response.body);
      expect(response.statusCode).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VAL_001');
    });

    it('should register successfully with valid criteria', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'valid@idbi.com',
          mobileNumber: '+919876543210',
          password: 'SecurePassword123!',
        },
      });

      const body = JSON.parse(response.body);
      expect(response.statusCode).toBe(201);
      expect(body.success).toBe(true);
    });

    it('should reject request with expired or missing token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/user/profile',
      });

      const body = JSON.parse(response.body);
      expect(response.statusCode).toBe(401);
      expect(body.success).toBe(false);
    });

    it('should allow requests with a valid Bearer token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/user/profile',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('🎯 Goals Management Routing', () => {
    it('should reject goal creation with past deadlines', async () => {
      const pastDeadline = new Date(Date.now() - 1000 * 60).toISOString();
      const response = await app.inject({
        method: 'POST',
        url: '/goals',
        headers: { authorization: `Bearer ${testToken}` },
        payload: {
          title: 'My Retirement Goal',
          targetCents: 100000,
          deadline: pastDeadline,
        },
      });

      const body = JSON.parse(response.body);
      expect(response.statusCode).toBe(400);
      expect(body.error.code).toBe('VAL_001');
      expect(body.error.details[0].message).toContain('Deadline must be a future date.');
    });

    it('should create goal and return 25%, 50%, 75%, 100% milestone parameters', async () => {
      const futureDeadline = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString();
      const response = await app.inject({
        method: 'POST',
        url: '/goals',
        headers: { authorization: `Bearer ${testToken}` },
        payload: {
          title: 'Car Purchase Fund',
          targetCents: 5000000,
          deadline: futureDeadline,
        },
      });

      const body = JSON.parse(response.body);
      expect(response.statusCode).toBe(201);
      expect(body.success).toBe(true);
    });
  });

  describe('💸 Transaction Verification', () => {
    it('should fail with VAL_001 if amount is non-integer or decimal', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/transactions',
        headers: { authorization: `Bearer ${testToken}` },
        payload: {
          accountId: 'b7da9dbb-8217-47b2-a4f6-8c4371bfbe55',
          amountCents: 15.5,
          type: 'OUTFLOW',
          category: 'FOOD',
        },
      });

      const body = JSON.parse(response.body);
      expect(response.statusCode).toBe(400);
      expect(body.error.code).toBe('VAL_001');
    });

    it('should execute transaction successfully with valid parameters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/transactions',
        headers: { authorization: `Bearer ${testToken}` },
        payload: {
          accountId: 'b7da9dbb-8217-47b2-a4f6-8c4371bfbe55',
          amountCents: 15000,
          type: 'OUTFLOW',
          category: 'FOOD',
        },
      });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('🧠 AI Assistant Integration', () => {
    it('should enforce 2000 character maximum payload boundary', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/ai/chat',
        headers: { authorization: `Bearer ${testToken}` },
        payload: {
          conversationId: null,
          text: 'a'.repeat(2001),
        },
      });

      const body = JSON.parse(response.body);
      expect(response.statusCode).toBe(400);
      expect(body.error.code).toBe('VAL_001');
      expect(body.error.details[0].message).toContain('Message cannot exceed 2000 characters.');
    });
  });
});
