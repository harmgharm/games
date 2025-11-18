import type { FastifyReply } from 'fastify';
import type { ApiResponse } from '@games/types';

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Creates pagination metadata from query parameters
 */
export function createPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Sends a successful JSON response with data
 *
 * @example
 * ```typescript
 * // Single item
 * return sendSuccess(reply, { id: '123', name: 'Test' });
 *
 * // With pagination
 * return sendSuccess(reply, users, {
 *   pagination: createPaginationMeta(1, 10, 100),
 * });
 * ```
 */
export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  meta?: {
    pagination?: PaginationMeta;
  },
): FastifyReply {
  const response: ApiResponse<T> = {
    data,
    error: null,
    meta: {
      timestamp: new Date().toISOString(),
      ...(meta?.pagination ? { pagination: meta.pagination } : {}),
    },
  };

  return reply.status(200).send(response);
}

/**
 * Sends a successful creation response (201)
 */
export function sendCreated<T>(reply: FastifyReply, data: T): FastifyReply {
  const response: ApiResponse<T> = {
    data,
    error: null,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return reply.status(201).send(response);
}

/**
 * Sends a no content response (204)
 */
export function sendNoContent(reply: FastifyReply): FastifyReply {
  return reply.status(204).send();
}

/**
 * Sends an error response
 *
 * @example
 * ```typescript
 * return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input');
 * ```
 */
export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): FastifyReply {
  const response: ApiResponse<null> = {
    data: null,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return reply.status(statusCode).send(response);
}

/**
 * Type-safe response builder for complex scenarios
 */
export class ResponseBuilder<T> {
  private statusCode = 200;
  private data: T | null = null;
  private errorCode: string | null = null;
  private errorMessage: string | null = null;
  private errorDetails?: Record<string, unknown>;
  private pagination?: PaginationMeta;

  setData(data: T): this {
    this.data = data;
    return this;
  }

  setStatus(code: number): this {
    this.statusCode = code;
    return this;
  }

  setError(code: string, message: string, details?: Record<string, unknown>): this {
    this.errorCode = code;
    this.errorMessage = message;
    this.errorDetails = details;
    this.data = null;
    return this;
  }

  setPagination(meta: PaginationMeta): this {
    this.pagination = meta;
    return this;
  }

  send(reply: FastifyReply): FastifyReply {
    const response: ApiResponse<T> = {
      data: this.data,
      error:
        this.errorCode && this.errorMessage
          ? {
              code: this.errorCode,
              message: this.errorMessage,
              ...(this.errorDetails ? { details: this.errorDetails } : {}),
            }
          : null,
      meta: {
        timestamp: new Date().toISOString(),
        ...(this.pagination ? { pagination: this.pagination } : {}),
      },
    };

    return reply.status(this.statusCode).send(response);
  }
}
