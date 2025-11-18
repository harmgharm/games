import type { FastifyInstance, FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import { isAppError, type AppError } from '@games/types';
import type { ApiResponse } from '@games/types';

/**
 * Global error handler plugin for Fastify
 *
 * Handles:
 * - AppError instances with proper status codes
 * - Fastify validation errors
 * - Unknown errors (converted to 500)
 */
async function errorHandlerPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler((error, request, reply) => {
    const logger = request.log;

    // Handle our custom AppError instances
    if (isAppError(error)) {
      const appError = error as AppError;

      // Log operational errors as warnings, programming errors as errors
      if (appError.isOperational) {
        logger.warn(
          {
            code: appError.code,
            statusCode: appError.statusCode,
            details: appError.details,
          },
          appError.message,
        );
      } else {
        logger.error(
          {
            code: appError.code,
            statusCode: appError.statusCode,
            details: appError.details,
            stack: appError.stack,
          },
          appError.message,
        );
      }

      const response: ApiResponse<null> = {
        data: null,
        error: appError.toJSON(),
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      return reply.status(appError.statusCode).send(response);
    }

    // Handle Fastify validation errors
    if ((error as FastifyError).validation) {
      const validationError = error as FastifyError;

      logger.warn(
        {
          validation: validationError.validation,
        },
        'Validation error',
      );

      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationError.message,
          details: {
            validation: validationError.validation,
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      return reply.status(400).send(response);
    }

    // Handle unknown errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error(
      {
        err: error,
        stack: errorStack,
      },
      'Unhandled error',
    );

    // Don't expose internal error details in production
    const isProd = process.env.NODE_ENV === 'production';
    const response: ApiResponse<null> = {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: isProd ? 'An unexpected error occurred' : errorMessage,
        ...(isProd || errorStack === undefined ? {} : { details: { stack: errorStack } }),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return reply.status(500).send(response);
  });

  // Handle 404 not found
  fastify.setNotFoundHandler((request, reply) => {
    request.log.warn(
      {
        method: request.method,
        url: request.url,
      },
      'Route not found',
    );

    const response: ApiResponse<null> = {
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return reply.status(404).send(response);
  });
}

export default fp(errorHandlerPlugin, {
  name: 'error-handler',
});
