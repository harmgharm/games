import { describe, expect, it } from 'vitest';

import {
  booleanSchema,
  databaseUrlSchema,
  nodeEnvSchema,
  portSchema,
  redisUrlSchema,
  urlSchema,
} from './env.js';

describe('env schemas', () => {
  describe('nodeEnvSchema', () => {
    it('should accept valid environments', () => {
      expect(nodeEnvSchema.parse('development')).toBe('development');
      expect(nodeEnvSchema.parse('production')).toBe('production');
      expect(nodeEnvSchema.parse('test')).toBe('test');
    });

    it('should reject invalid environments', () => {
      expect(() => nodeEnvSchema.parse('invalid')).toThrow();
    });
  });

  describe('portSchema', () => {
    it('should accept valid ports', () => {
      expect(portSchema.parse('3000')).toBe(3000);
      expect(portSchema.parse(8080)).toBe(8080);
    });

    it('should reject invalid ports', () => {
      expect(() => portSchema.parse('0')).toThrow();
      expect(() => portSchema.parse('70000')).toThrow();
    });
  });

  describe('urlSchema', () => {
    it('should accept valid URLs', () => {
      expect(urlSchema.parse('https://example.com')).toBe('https://example.com');
    });

    it('should reject invalid URLs', () => {
      expect(() => urlSchema.parse('not-a-url')).toThrow();
    });
  });

  describe('booleanSchema', () => {
    it('should transform string booleans', () => {
      expect(booleanSchema.parse('true')).toBe(true);
      expect(booleanSchema.parse('false')).toBe(false);
      expect(booleanSchema.parse('1')).toBe(true);
      expect(booleanSchema.parse('0')).toBe(false);
    });
  });

  describe('databaseUrlSchema', () => {
    it('should accept valid postgres URLs', () => {
      const url = 'postgres://user:pass@localhost:5432/db';
      expect(databaseUrlSchema.parse(url)).toBe(url);
    });

    it('should reject non-postgres URLs', () => {
      expect(() => databaseUrlSchema.parse('mysql://localhost')).toThrow();
    });
  });

  describe('redisUrlSchema', () => {
    it('should accept valid redis URLs', () => {
      const url = 'redis://localhost:6379';
      expect(redisUrlSchema.parse(url)).toBe(url);
    });

    it('should reject non-redis URLs', () => {
      expect(() => redisUrlSchema.parse('http://localhost')).toThrow();
    });
  });
});
