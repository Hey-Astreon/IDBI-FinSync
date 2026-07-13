import { ErrorCodes } from '@idbi/shared';

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: any,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, ErrorCodes.VAL_001, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed.') {
    super(message, 401, ErrorCodes.AUTH_001);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied.') {
    super(message, 403, ErrorCodes.AUTH_002);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    // RES_002 = generic resource conflict (not goal-specific)
    super(message, 409, ErrorCodes.RES_002);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    // RES_001 = generic resource not found (not goal-specific)
    super(message, 404, ErrorCodes.RES_001);
  }
}

export class InsufficientFundsError extends AppError {
  constructor(message: string = 'Insufficient balance in selected account.') {
    super(message, 422, ErrorCodes.INVEST_001);
  }
}

export class GoalAlreadyCompletedError extends AppError {
  constructor(message: string = 'Cannot execute transaction on a completed goal.') {
    // GOAL_002 = goal-specific operation conflict
    super(message, 409, ErrorCodes.GOAL_002);
  }
}
