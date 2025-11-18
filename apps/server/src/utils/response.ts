import type { ApiResponse } from '@games/types';
import type { FastifyReply } from 'fastify';

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
export function sendSuccess(
  reply: FastifyReply,
  data: unknown,
  meta?: {
    pagination?: PaginationMeta;
  },
): FastifyReply {
  const response: ApiResponse<unknown> = {
    data,
    error: null,
    meta: {
      timestamp: new Date().toISOString(),
      ...(meta?.pagination === undefined ? {} : { pagination: meta.pagination }),
    },
  };

  return reply.status(200).send(response);
}

/**
 * Sends a successful creation response (201)
 */
export function sendCreated(reply: FastifyReply, data: unknown): FastifyReply {
  const response: ApiResponse<unknown> = {
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
 * Error response options
 */
export interface SendErrorOptions {
  statusCode: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Sends an error response
 *
 * @example
 * ```typescript
 * return sendError(reply, {
 *   statusCode: 400,
 *   code: 'VALIDATION_ERROR',
 *   message: 'Invalid input'
 * });
 * ```
 */
export function sendError(reply: FastifyReply, options: SendErrorOptions): FastifyReply {
  const response: ApiResponse<null> = {
    data: null,
    error: {
      code: options.code,
      message: options.message,
      ...(options.details === undefined ? {} : { details: options.details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return reply.status(options.statusCode).send(response);
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
    // Only assign if provided (exactOptionalPropertyTypes)
    if (details !== undefined) {
      this.errorDetails = details;
    }
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
        this.errorCode !== null && this.errorMessage !== null
          ? {
              code: this.errorCode,
              message: this.errorMessage,
              ...(this.errorDetails === undefined ? {} : { details: this.errorDetails }),
            }
          : null,
      meta: {
        timestamp: new Date().toISOString(),
        ...(this.pagination === undefined ? {} : { pagination: this.pagination }),
      },
    };

    return reply.status(this.statusCode).send(response);
  }
}
