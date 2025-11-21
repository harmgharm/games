/**
 * Email Queue Tests
 *
 * Tests for email queue producer functions.
 */

import type { FastifyInstance } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createEmailQueue } from './email.queue.js';

describe('email queue', () => {
  let mockFastify: FastifyInstance;
  let mockEmailQueue: {
    add: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockEmailQueue = {
      add: vi.fn().mockResolvedValue({ id: 'job-123' }),
    };

    mockFastify = {
      queues: {
        email: mockEmailQueue,
      },
      log: {
        info: vi.fn(),
        error: vi.fn(),
      },
    } as unknown as FastifyInstance;
  });

  describe('createEmailQueue', () => {
    it('should return queue functions', () => {
      const queue = createEmailQueue(mockFastify);
      expect(queue).toHaveProperty('queueVerificationEmail');
      expect(queue).toHaveProperty('queuePasswordResetEmail');
      expect(queue).toHaveProperty('queueWelcomeEmail');
    });
  });

  describe('queueVerificationEmail', () => {
    it('should add job to queue with correct data', async () => {
      const queue = createEmailQueue(mockFastify);

      await queue.queueVerificationEmail('user@example.com', 'user-123', {
        username: 'testuser',
        token: 'abc123',
        code: '123456',
      });

      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        'verification',
        {
          type: 'verification',
          to: 'user@example.com',
          userId: 'user-123',
          data: {
            username: 'testuser',
            token: 'abc123',
            code: '123456',
          },
        },
        expect.objectContaining({
          jobId: expect.stringContaining('verification-user-123-'),
        }),
      );
    });

    it('should log info when email is queued', async () => {
      const queue = createEmailQueue(mockFastify);

      await queue.queueVerificationEmail('user@example.com', 'user-123', {
        username: 'testuser',
        token: 'abc123',
        code: '123456',
      });

      expect(mockFastify.log.info).toHaveBeenCalledWith(
        { to: 'user@example.com', userId: 'user-123' },
        'Verification email queued',
      );
    });

    it('should generate unique job IDs', async () => {
      const queue = createEmailQueue(mockFastify);

      await queue.queueVerificationEmail('user@example.com', 'user-123', {
        username: 'testuser',
        token: 'abc123',
        code: '123456',
      });

      const call = mockEmailQueue.add.mock.calls[0];
      const jobId = call?.[2]?.jobId as string;
      expect(jobId).toMatch(/^verification-user-123-\d+$/);
    });
  });

  describe('queuePasswordResetEmail', () => {
    it('should add job to queue with correct data', async () => {
      const queue = createEmailQueue(mockFastify);

      await queue.queuePasswordResetEmail('user@example.com', 'user-456', {
        username: 'resetuser',
        token: 'reset-token',
        code: '654321',
      });

      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        'password_reset',
        {
          type: 'password_reset',
          to: 'user@example.com',
          userId: 'user-456',
          data: {
            username: 'resetuser',
            token: 'reset-token',
            code: '654321',
          },
        },
        expect.objectContaining({
          jobId: expect.stringContaining('password_reset-user-456-'),
        }),
      );
    });

    it('should log info when email is queued', async () => {
      const queue = createEmailQueue(mockFastify);

      await queue.queuePasswordResetEmail('user@example.com', 'user-456', {
        username: 'resetuser',
        token: 'reset-token',
        code: '654321',
      });

      expect(mockFastify.log.info).toHaveBeenCalledWith(
        { to: 'user@example.com', userId: 'user-456' },
        'Password reset email queued',
      );
    });
  });

  describe('queueWelcomeEmail', () => {
    it('should add job to queue with correct data', async () => {
      const queue = createEmailQueue(mockFastify);

      await queue.queueWelcomeEmail('user@example.com', 'user-789', {
        username: 'newuser',
      });

      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        'welcome',
        {
          type: 'welcome',
          to: 'user@example.com',
          userId: 'user-789',
          data: {
            username: 'newuser',
          },
        },
        expect.objectContaining({
          jobId: expect.stringContaining('welcome-user-789-'),
        }),
      );
    });

    it('should log info when email is queued', async () => {
      const queue = createEmailQueue(mockFastify);

      await queue.queueWelcomeEmail('user@example.com', 'user-789', {
        username: 'newuser',
      });

      expect(mockFastify.log.info).toHaveBeenCalledWith(
        { to: 'user@example.com', userId: 'user-789' },
        'Welcome email queued',
      );
    });
  });

  describe('error handling', () => {
    it('should propagate queue errors', async () => {
      mockEmailQueue.add.mockRejectedValue(new Error('Queue unavailable'));

      const queue = createEmailQueue(mockFastify);

      await expect(
        queue.queueVerificationEmail('user@example.com', 'user-123', {
          username: 'testuser',
          token: 'abc123',
          code: '123456',
        }),
      ).rejects.toThrow('Queue unavailable');
    });
  });
});
