/**
 * Email Repository Tests
 *
 * Tests for email token utility functions.
 */

import crypto from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { generateCode, generateToken, hashToken } from './email.repository';

describe('email repository utilities', () => {
  describe('hashToken', () => {
    it('should return a Buffer', () => {
      const result = hashToken('test-token');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should return consistent hash for same input', () => {
      const token = 'test-token-123';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);
      expect(hash1.equals(hash2)).toBe(true);
    });

    it('should return different hash for different input', () => {
      const hash1 = hashToken('token-1');
      const hash2 = hashToken('token-2');
      expect(hash1.equals(hash2)).toBe(false);
    });

    it('should produce SHA-256 hash (32 bytes)', () => {
      const hash = hashToken('any-token');
      expect(hash).toHaveLength(32);
    });

    it('should match crypto.createHash output', () => {
      const token = 'verify-token';
      const expected = crypto.createHash('sha256').update(token).digest();
      const result = hashToken(token);
      expect(result.equals(expected)).toBe(true);
    });
  });

  describe('generateToken', () => {
    it('should return a string', () => {
      const token = generateToken();
      expect(typeof token).toBe('string');
    });

    it('should return 64 character hex string (32 bytes)', () => {
      const token = generateToken();
      expect(token).toHaveLength(64);
      expect(/^[\da-f]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe('generateCode', () => {
    it('should return a string', () => {
      const code = generateCode();
      expect(typeof code).toBe('string');
    });

    it('should return a 6-digit string', () => {
      const code = generateCode();
      expect(code).toHaveLength(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
    });

    it('should generate codes between 100000 and 999999', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateCode();
        const num = Number.parseInt(code, 10);
        expect(num).toBeGreaterThanOrEqual(100_000);
        expect(num).toBeLessThanOrEqual(999_999);
      }
    });

    it('should not generate codes with leading zeros', () => {
      // Run many times to check no leading zeros
      for (let i = 0; i < 100; i++) {
        const code = generateCode();
        expect(code[0]).not.toBe('0');
      }
    });
  });
});
