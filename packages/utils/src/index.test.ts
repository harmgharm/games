import { describe, expect, it } from 'vitest';

import { clamp, entries, keys, sleep } from './index.js';

describe('utils', () => {
  describe('keys', () => {
    it('should return typed keys of an object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = keys(obj);
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('entries', () => {
    it('should return typed entries of an object', () => {
      const obj = { a: 1, b: 2 };
      const result = entries(obj);
      expect(result).toEqual([
        ['a', 1],
        ['b', 2],
      ]);
    });
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe('clamp', () => {
    it('should clamp value to min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should clamp value to max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
  });
});
