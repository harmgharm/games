/**
 * Test Setup
 *
 * Global test configuration and mocks for Vitest.
 */

import { vi } from 'vitest';

// Mock ioredis with ioredis-mock
// Using dynamic import in the factory to avoid hoisting issues
vi.mock('ioredis', async () => {
  const RedisMock = await import('ioredis-mock');
  return {
    default: RedisMock.default,
  };
});

// Set test environment variables if not already set
/* eslint-disable turbo/no-undeclared-env-vars */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-for-testing-only';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'error';
/* eslint-enable turbo/no-undeclared-env-vars */
