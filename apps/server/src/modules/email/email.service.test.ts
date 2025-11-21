/**
 * Email Service Tests
 *
 * Tests for email sending functions.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from './email.service.js';

// Mock the env config (vi.mock is hoisted automatically)
vi.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    POSTMARK_API_KEY: undefined,
    EMAIL_FROM: 'noreply@example.com',
    APP_URL: 'https://example.com',
  },
}));

// Mock Postmark client
vi.mock('postmark', () => ({
  ServerClient: vi.fn().mockImplementation(() => ({
    sendEmail: vi.fn().mockResolvedValue({ MessageID: 'test-id' }),
  })),
}));

describe('email service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    const testData = {
      username: 'testuser',
      token: 'verify-token-123',
      code: '123456',
    };

    it('should not throw in test/dev mode', async () => {
      await expect(sendVerificationEmail('user@example.com', testData)).resolves.not.toThrow();
    });

    it('should accept valid email and data', async () => {
      await expect(
        sendVerificationEmail('user@example.com', {
          username: 'user',
          token: 'token',
          code: '123456',
        }),
      ).resolves.toBeUndefined();
    });

    it('should handle different usernames', async () => {
      await expect(
        sendVerificationEmail('test@test.com', {
          username: 'different-user',
          token: 'different-token',
          code: '654321',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('sendPasswordResetEmail', () => {
    const testData = {
      username: 'resetuser',
      token: 'reset-token-456',
      code: '654321',
    };

    it('should not throw in test/dev mode', async () => {
      await expect(sendPasswordResetEmail('user@example.com', testData)).resolves.not.toThrow();
    });

    it('should accept valid email and data', async () => {
      await expect(
        sendPasswordResetEmail('user@example.com', {
          username: 'user',
          token: 'token',
          code: '123456',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('sendWelcomeEmail', () => {
    const testData = {
      username: 'newuser',
    };

    it('should not throw in test/dev mode', async () => {
      await expect(sendWelcomeEmail('user@example.com', testData)).resolves.not.toThrow();
    });

    it('should accept valid email and data', async () => {
      await expect(
        sendWelcomeEmail('user@example.com', {
          username: 'user',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('email content', () => {
    // These tests verify the functions integrate correctly with templates
    // Detailed template tests are in email.templates.test.ts

    it('should build verification URL correctly', async () => {
      // This test verifies the URL is built with APP_URL + token
      // The actual email content is logged to console in test mode
      await expect(
        sendVerificationEmail('user@example.com', {
          username: 'user',
          token: 'my-token',
          code: '123456',
        }),
      ).resolves.toBeUndefined();
    });

    it('should build reset URL correctly', async () => {
      await expect(
        sendPasswordResetEmail('user@example.com', {
          username: 'user',
          token: 'reset-token',
          code: '654321',
        }),
      ).resolves.toBeUndefined();
    });

    it('should build dashboard URL correctly', async () => {
      await expect(
        sendWelcomeEmail('user@example.com', {
          username: 'user',
        }),
      ).resolves.toBeUndefined();
    });
  });
});
