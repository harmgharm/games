import { describe, expect, it, vi } from 'vitest';

import {
  generateRefreshToken,
  getRefreshTokenExpiry,
  getRefreshTokenMaxAge,
  hashRefreshToken,
  REFRESH_TOKEN_COOKIE,
  TOKEN_EXPIRY,
} from './token.js';

describe('token utils', () => {
  describe('TOKEN_EXPIRY', () => {
    it('should have correct expiry values', () => {
      expect(TOKEN_EXPIRY.ACCESS).toBe('15m');
      expect(TOKEN_EXPIRY.REFRESH_DEFAULT).toBe('7d');
      expect(TOKEN_EXPIRY.REFRESH_REMEMBER_ME).toBe('30d');
    });
  });

  describe('REFRESH_TOKEN_COOKIE', () => {
    it('should have correct cookie configuration', () => {
      expect(REFRESH_TOKEN_COOKIE.name).toBe('refresh_token');
      expect(REFRESH_TOKEN_COOKIE.options.httpOnly).toBe(true);
      expect(REFRESH_TOKEN_COOKIE.options.sameSite).toBe('strict');
      expect(REFRESH_TOKEN_COOKIE.options.path).toBe('/api/v1/auth');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateRefreshToken();

      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();

      for (let index = 0; index < 100; index++) {
        tokens.add(generateRefreshToken());
      }

      // All 100 tokens should be unique
      expect(tokens.size).toBe(100);
    });

    it('should be cryptographically random', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('hashRefreshToken', () => {
    it('should return a SHA-256 hash (64 hex characters)', () => {
      const token = generateRefreshToken();
      const hash = hashRefreshToken(token);

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce consistent hashes for same input', () => {
      const token = 'test-token-123';
      const hash1 = hashRefreshToken(token);
      const hash2 = hashRefreshToken(token);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashRefreshToken('token1');
      const hash2 = hashRefreshToken('token2');

      expect(hash1).not.toBe(hash2);
    });

    it('should hash the generated refresh token', () => {
      const token = generateRefreshToken();
      const hash = hashRefreshToken(token);

      expect(hash).not.toBe(token);
      expect(hash).toHaveLength(64);
    });
  });

  describe('getRefreshTokenExpiry', () => {
    it('should return 7 days in the future for default', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const expiry = getRefreshTokenExpiry(false);

      expect(expiry.getDate()).toBe(8); // Jan 1 + 7 days = Jan 8
      expect(expiry.getMonth()).toBe(0); // January

      vi.useRealTimers();
    });

    it('should return 30 days in the future for remember me', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const expiry = getRefreshTokenExpiry(true);

      expect(expiry.getDate()).toBe(31); // Jan 1 + 30 days = Jan 31
      expect(expiry.getMonth()).toBe(0); // January

      vi.useRealTimers();
    });

    it('should return a Date object', () => {
      const expiry = getRefreshTokenExpiry(false);
      expect(expiry).toBeInstanceOf(Date);
    });

    it('should return a future date', () => {
      const now = new Date();
      const expiry = getRefreshTokenExpiry(false);

      expect(expiry.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('getRefreshTokenMaxAge', () => {
    it('should return 7 days in seconds for default', () => {
      const maxAge = getRefreshTokenMaxAge(false);
      const expectedSeconds = 7 * 24 * 60 * 60;

      expect(maxAge).toBe(expectedSeconds);
      expect(maxAge).toBe(604_800);
    });

    it('should return 30 days in seconds for remember me', () => {
      const maxAge = getRefreshTokenMaxAge(true);
      const expectedSeconds = 30 * 24 * 60 * 60;

      expect(maxAge).toBe(expectedSeconds);
      expect(maxAge).toBe(2_592_000);
    });

    it('should return a number', () => {
      const maxAge = getRefreshTokenMaxAge(false);
      expect(typeof maxAge).toBe('number');
    });
  });
});
