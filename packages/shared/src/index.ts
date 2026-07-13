// Standard Error Codes from API Specification
export enum ErrorCodes {
  AUTH_001 = 'AUTH_001', // Token expired / missing
  AUTH_002 = 'AUTH_002', // Step-up verification failed
  VAL_001 = 'VAL_001', // Invalid payload fields
  RES_001 = 'RES_001', // Generic resource not found
  RES_002 = 'RES_002', // Generic resource conflict / duplicate
  GOAL_001 = 'GOAL_001', // Goal ID not found
  GOAL_002 = 'GOAL_002', // Operation conflicts with current goal status
  SIM_001 = 'SIM_001', // Invalid simulation inputs
  AI_001 = 'AI_001', // LLM service down / filters triggered
  INVEST_001 = 'INVEST_001', // Insufficient funds in connected IDBI A/C
  INVEST_002 = 'INVEST_002', // Selected mutual fund is inactive
  DB_001 = 'DB_001', // Database timeout / concurrency collision
  SYS_001 = 'SYS_001', // Core Banking System ledger offline
  SYS_002 = 'SYS_002', // Rate limit exceeded
}

// Lifecycle State Machines
export type GoalState = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type InvestmentState = 'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED';
export type AIChatState = 'WAITING' | 'THINKING' | 'STREAMING' | 'COMPLETED' | 'ERROR';

// Universal JSON Envelope Types
export interface SuccessResponse<T> {
  success: true;
  timestamp: string;
  data: T;
}

export interface ErrorDetails {
  field: string;
  rule: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  timestamp: string;
  error: {
    code: string;
    message: string;
    details?: ErrorDetails[];
  };
}
