export type KycStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED';
export type RiskTier = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
export type GoalStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type InvestmentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED';
export type TransactionType = 'INFLOW' | 'OUTFLOW';
export type TransactionCategory =
  'FOOD' | 'UTILITIES' | 'RENT' | 'INVESTMENT' | 'ENTERTAINMENT' | 'SALARY' | 'OTHER';
export type FundCategory = 'EQUITY' | 'DEBT' | 'HYBRID' | 'LIQUID';
export type SipFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';

export interface User {
  id: string;
  email: string;
  mobileNumber: string;
  kycStatus: KycStatus;
  riskTier: RiskTier;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  biometricsEnabled: boolean;
  baseCurrency: string;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: string;
  balanceCents: string; // Stored as string to handle BigInt safely in JSON
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetCents: string;
  currentCents: string;
  status: GoalStatus;
  streakCount: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  amountCents: string;
  type: TransactionType;
  category: TransactionCategory;
  merchantName?: string;
  timestamp: string;
  createdAt: string;
}

export interface MutualFund {
  id: string;
  name: string;
  category: FundCategory;
  riskRating: RiskTier;
  navCents: number;
  expenseRatioPercentage: string;
  historicalReturn1y: string;
  historicalReturn3y: string;
  historicalReturn5y: string;
  isRecommended: boolean;
}

export interface Sip {
  id: string;
  userId: string;
  goalId: string;
  fundId: string;
  amountCents: string;
  frequency: SipFrequency;
  nextDeductionDate: string;
  isActive: boolean;
  fund?: MutualFund;
  goal?: Goal;
}

export interface Investment {
  id: string;
  userId: string;
  goalId: string;
  sipId?: string;
  amountCents: string;
  status: InvestmentStatus;
  unitsPurchased?: string;
  transactionRef?: string;
  createdAt: string;
  fundId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  sender: 'USER' | 'MITRA';
  text: string;
  intentDetected?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  timestamp: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  timestamp: string;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      rule: string;
      message: string;
    }>;
  };
}
