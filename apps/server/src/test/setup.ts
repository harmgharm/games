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
