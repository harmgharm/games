/**
 * Email Processor Tests
 *
 * Tests for email job processing.
 */

import type { Job } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EmailJobData } from '../../plugins/queue.plugin.js';
import { processEmailJob } from './email.processor.js';
import * as emailService from './email.service.js';

// Mock the email service
vi.mock('./email.service', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('email processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processEmailJob', () => {
    describe('verification email', () => {
      it('should call sendVerificationEmail with correct data', async () => {
        const job = {
          data: {
            type: 'verification',
            to: 'user@example.com',
            userId: 'user-123',
            data: {
              username: 'testuser',
              token: 'verify-token',
              code: '123456',
            },
          },
        } as Job<EmailJobData>;

        await processEmailJob(job);

        expect(emailService.sendVerificationEmail).toHaveBeenCalledWith('user@example.com', {
          username: 'testuser',
          token: 'verify-token',
          code: '123456',
        });
      });

      it('should only call sendVerificationEmail for verification type', async () => {
        const job = {
          data: {
            type: 'verification',
            to: 'user@example.com',
            userId: 'user-123',
            data: {
              username: 'testuser',
              token: 'verify-token',
              code: '123456',
            },
          },
        } as Job<EmailJobData>;

        await processEmailJob(job);

        expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
        expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
        expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
      });
    });

    describe('password reset email', () => {
      it('should call sendPasswordResetEmail with correct data', async () => {
        const job = {
          data: {
            type: 'password_reset',
            to: 'user@example.com',
            userId: 'user-456',
            data: {
              username: 'resetuser',
              token: 'reset-token',
              code: '654321',
            },
          },
        } as Job<EmailJobData>;

        await processEmailJob(job);

        expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith('user@example.com', {
          username: 'resetuser',
          token: 'reset-token',
          code: '654321',
        });
      });

      it('should only call sendPasswordResetEmail for password_reset type', async () => {
        const job = {
          data: {
            type: 'password_reset',
            to: 'user@example.com',
            userId: 'user-456',
            data: {
              username: 'resetuser',
              token: 'reset-token',
              code: '654321',
            },
          },
        } as Job<EmailJobData>;

        await processEmailJob(job);

        expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
        expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
        expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
      });
    });

    describe('welcome email', () => {
      it('should call sendWelcomeEmail with correct data', async () => {
        const job = {
          data: {
            type: 'welcome',
            to: 'user@example.com',
            userId: 'user-789',
            data: {
              username: 'newuser',
            },
          },
        } as Job<EmailJobData>;

        await processEmailJob(job);

        expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith('user@example.com', {
          username: 'newuser',
        });
      });

      it('should only call sendWelcomeEmail for welcome type', async () => {
        const job = {
          data: {
            type: 'welcome',
            to: 'user@example.com',
            userId: 'user-789',
            data: {
              username: 'newuser',
            },
          },
        } as Job<EmailJobData>;

        await processEmailJob(job);

        expect(emailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
        expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
        expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should propagate errors from sendVerificationEmail', async () => {
        vi.mocked(emailService.sendVerificationEmail).mockRejectedValue(new Error('Email failed'));

        const job = {
          data: {
            type: 'verification',
            to: 'user@example.com',
            userId: 'user-123',
            data: {
              username: 'testuser',
              token: 'verify-token',
              code: '123456',
            },
          },
        } as Job<EmailJobData>;

        await expect(processEmailJob(job)).rejects.toThrow('Email failed');
      });

      it('should propagate errors from sendPasswordResetEmail', async () => {
        vi.mocked(emailService.sendPasswordResetEmail).mockRejectedValue(new Error('Reset failed'));

        const job = {
          data: {
            type: 'password_reset',
            to: 'user@example.com',
            userId: 'user-456',
            data: {
              username: 'resetuser',
              token: 'reset-token',
              code: '654321',
            },
          },
        } as Job<EmailJobData>;

        await expect(processEmailJob(job)).rejects.toThrow('Reset failed');
      });

      it('should propagate errors from sendWelcomeEmail', async () => {
        vi.mocked(emailService.sendWelcomeEmail).mockRejectedValue(new Error('Welcome failed'));

        const job = {
          data: {
            type: 'welcome',
            to: 'user@example.com',
            userId: 'user-789',
            data: {
              username: 'newuser',
            },
          },
        } as Job<EmailJobData>;

        await expect(processEmailJob(job)).rejects.toThrow('Welcome failed');
      });

      it('should throw for unknown email type', async () => {
        const job = {
          data: {
            type: 'unknown' as 'verification',
            to: 'user@example.com',
            userId: 'user-123',
            data: {
              username: 'testuser',
              token: 'token',
              code: '123456',
            },
          },
        } as Job<EmailJobData>;

        await expect(processEmailJob(job)).rejects.toThrow('Unknown email type');
      });
    });
  });
});
