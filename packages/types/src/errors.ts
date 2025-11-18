/**
 * Base application error class
 * All custom errors extend this
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Only assign details if provided (exactOptionalPropertyTypes compatibility)
    if (details !== undefined) {
      this.details = details;
    }

    // Maintains proper stack trace (V8 engines only)
    if ('captureStackTrace' in Error) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

/**
 * Validation error - 400 Bad Request
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
  }
}

/**
 * Authentication error - 401 Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
  }
}

/**
 * Authorization error - 403 Forbidden
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
  }
}

/**
 * Not found error - 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404, true);
  }
}

/**
 * Conflict error - 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409, true);
  }
}

/**
 * Rate limit error - 429 Too Many Requests
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true);
  }
}

/**
 * Database error - 500 Internal Server Error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 'DATABASE_ERROR', 500, false);
  }
}

/**
 * External service error - 502 Bad Gateway
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(message ?? `${service} service unavailable`, 'EXTERNAL_SERVICE_ERROR', 502, true);
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Error codes for consistent error handling
 */
export const ErrorCodes = {
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Resources
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Business logic
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
