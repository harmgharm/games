/**
 * Email Templates Tests
 *
 * Tests for email template generation.
 */

import { describe, expect, it } from 'vitest';

import { passwordResetEmail, verificationEmail, welcomeEmail } from './email.templates';

describe('email templates', () => {
  describe('verificationEmail', () => {
    const testData = {
      username: 'testuser',
      verifyUrl: 'https://example.com/verify?token=abc123',
      code: '123456',
    };

    it('should return subject and html', () => {
      const result = verificationEmail(testData);
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
    });

    it('should have correct subject', () => {
      const result = verificationEmail(testData);
      expect(result.subject).toBe('Verify your email address');
    });

    it('should include username in html', () => {
      const result = verificationEmail(testData);
      expect(result.html).toContain('testuser');
    });

    it('should include verification URL in html', () => {
      const result = verificationEmail(testData);
      expect(result.html).toContain('https://example.com/verify?token=abc123');
    });

    it('should include verification code in html', () => {
      const result = verificationEmail(testData);
      expect(result.html).toContain('123456');
    });

    it('should include verify button with URL', () => {
      const result = verificationEmail(testData);
      expect(result.html).toContain('href="https://example.com/verify?token=abc123"');
      expect(result.html).toContain('Verify Email');
    });

    it('should include base layout structure', () => {
      const result = verificationEmail(testData);
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('Gaming Platform');
      expect(result.html).toContain('class="header"');
      expect(result.html).toContain('class="content"');
      expect(result.html).toContain('class="footer"');
    });

    it('should include expiry notice', () => {
      const result = verificationEmail(testData);
      expect(result.html).toContain('expire in 24 hours');
    });
  });

  describe('passwordResetEmail', () => {
    const testData = {
      username: 'resetuser',
      resetUrl: 'https://example.com/reset?token=xyz789',
      code: '654321',
    };

    it('should return subject and html', () => {
      const result = passwordResetEmail(testData);
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
    });

    it('should have correct subject', () => {
      const result = passwordResetEmail(testData);
      expect(result.subject).toBe('Reset your password');
    });

    it('should include username in html', () => {
      const result = passwordResetEmail(testData);
      expect(result.html).toContain('resetuser');
    });

    it('should include reset URL in html', () => {
      const result = passwordResetEmail(testData);
      expect(result.html).toContain('https://example.com/reset?token=xyz789');
    });

    it('should include reset code in html', () => {
      const result = passwordResetEmail(testData);
      expect(result.html).toContain('654321');
    });

    it('should include reset button with URL', () => {
      const result = passwordResetEmail(testData);
      expect(result.html).toContain('href="https://example.com/reset?token=xyz789"');
      expect(result.html).toContain('Reset Password');
    });

    it('should include expiry notice', () => {
      const result = passwordResetEmail(testData);
      expect(result.html).toContain('expire in 1 hour');
    });

    it('should include safety notice', () => {
      const result = passwordResetEmail(testData);
      expect(result.html).toContain("didn't request this");
    });
  });

  describe('welcomeEmail', () => {
    const testData = {
      username: 'newuser',
      loginUrl: 'https://example.com/dashboard',
    };

    it('should return subject and html', () => {
      const result = welcomeEmail(testData);
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
    });

    it('should have correct subject', () => {
      const result = welcomeEmail(testData);
      expect(result.subject).toBe('Welcome to Gaming Platform!');
    });

    it('should include username in html', () => {
      const result = welcomeEmail(testData);
      expect(result.html).toContain('newuser');
    });

    it('should include dashboard URL in html', () => {
      const result = welcomeEmail(testData);
      expect(result.html).toContain('https://example.com/dashboard');
    });

    it('should include dashboard button', () => {
      const result = welcomeEmail(testData);
      expect(result.html).toContain('href="https://example.com/dashboard"');
      expect(result.html).toContain('Go to Dashboard');
    });

    it('should include feature list', () => {
      const result = welcomeEmail(testData);
      expect(result.html).toContain('Complete your profile');
      expect(result.html).toContain('Add friends');
      expect(result.html).toContain('Join matches');
      expect(result.html).toContain('leaderboards');
    });

    it('should include welcome message', () => {
      const result = welcomeEmail(testData);
      expect(result.html).toContain('Welcome to Gaming Platform');
      expect(result.html).toContain('Happy gaming');
    });
  });

  describe('template security', () => {
    it('should not escape username (trusted input)', () => {
      // Usernames are validated on registration, so this is trusted input
      const result = verificationEmail({
        username: 'user123',
        verifyUrl: 'https://example.com/verify',
        code: '123456',
      });
      expect(result.html).toContain('user123');
    });

    it('should include all provided data in output', () => {
      const data = {
        username: 'uniqueuser',
        verifyUrl: 'https://unique.example.com/verify?token=unique',
        code: '999888',
      };
      const result = verificationEmail(data);
      expect(result.html).toContain(data.username);
      expect(result.html).toContain(data.verifyUrl);
      expect(result.html).toContain(data.code);
    });
  });
});
