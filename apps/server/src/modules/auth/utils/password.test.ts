import { describe, expect, it } from 'vitest';

import { checkPasswordStrength, hashPassword, needsRehash, verifyPassword } from './password';

describe('password utils', () => {
  describe('checkPasswordStrength', () => {
    it('should return low score for weak passwords', () => {
      const result = checkPasswordStrength('123456');
      expect(result.score).toBeLessThan(2);
      expect(result.isStrong).toBe(false);
    });

    it('should return high score for strong passwords', () => {
      const result = checkPasswordStrength('correct-horse-battery-staple');
      expect(result.score).toBeGreaterThanOrEqual(2);
      expect(result.isStrong).toBe(true);
    });

    it('should penalize passwords containing user inputs', () => {
      const withoutInputs = checkPasswordStrength('johnsmith2024');
      const withInputs = checkPasswordStrength('johnsmith2024', ['john', 'john@example.com']);

      // Password containing user data should be weaker
      expect(withInputs.score).toBeLessThanOrEqual(withoutInputs.score);
    });

    it('should provide feedback for weak passwords', () => {
      const result = checkPasswordStrength('password');
      expect(result.feedback).toBeDefined();
      expect(result.feedback.suggestions).toBeInstanceOf(Array);
    });

    it('should consider score 2 or higher as strong', () => {
      // Score 0-1 = weak, 2+ = strong
      const weak = checkPasswordStrength('abc');
      const strong = checkPasswordStrength('MyStr0ng!P@ssw0rd#2024');

      expect(weak.isStrong).toBe(false);
      expect(strong.isStrong).toBe(true);
    });

    it('should handle empty password', () => {
      const result = checkPasswordStrength('');
      expect(result.score).toBe(0);
      expect(result.isStrong).toBe(false);
    });

    it('should return empty string for warning when none exists', () => {
      const result = checkPasswordStrength('very-strong-unique-passphrase-123');
      expect(typeof result.feedback.warning).toBe('string');
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'testPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for different passwords', async () => {
      const hash1 = await hashPassword('password1');
      const hash2 = await hashPassword('password2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(hash, password);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword('correctPassword');

      const isValid = await verifyPassword(hash, 'wrongPassword');
      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const isValid = await verifyPassword('invalid-hash', 'password');
      expect(isValid).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const isValid = await verifyPassword('', 'password');
      expect(isValid).toBe(false);
    });
  });

  describe('needsRehash', () => {
    it('should return false for freshly hashed password', async () => {
      const hash = await hashPassword('testPassword');
      const needs = needsRehash(hash);

      expect(needs).toBe(false);
    });

    it('should handle argon2id hashes', async () => {
      const hash = await hashPassword('testPassword');
      expect(hash).toMatch(/^\$argon2id\$/);

      // Fresh hash with current options should not need rehash
      expect(needsRehash(hash)).toBe(false);
    });
  });
});
