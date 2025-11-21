import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Redis } from 'ioredis';

import { createLockoutService, formatLockoutTime, type LockoutService } from './lockout.service.js';

// Use ioredis-mock for testing
import RedisMock from 'ioredis-mock';

// Mock the userRepository
vi.mock('./auth.repository.js', () => ({
  userRepository: {
    setLockedUntil: vi.fn().mockResolvedValue(undefined),
  },
}));

import { userRepository } from './auth.repository.js';

describe('lockout service', () => {
  let redis: Redis;
  let lockoutService: LockoutService;

  beforeEach(() => {
    redis = new (RedisMock as any)() as Redis;
    lockoutService = createLockoutService(redis);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await redis.flushall();
  });

  describe('checkLockout', () => {
    it('should return not locked for new identifier', async () => {
      const status = await lockoutService.checkLockout('test@example.com');

      expect(status.isLocked).toBe(false);
    });

    it('should return locked status when short lockout exists', async () => {
      // Manually set a short lockout
      await redis.setex('auth:short_lockout:test@example.com', 900, '1');

      const status = await lockoutService.checkLockout('test@example.com');

      expect(status.isLocked).toBe(true);
      expect(status.remainingSeconds).toBeGreaterThan(0);
      expect(status.remainingSeconds).toBeLessThanOrEqual(900);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should increment failed attempts', async () => {
      await lockoutService.recordFailedAttempt('test@example.com');

      const count = await lockoutService.getFailedAttemptCount('test@example.com');
      expect(count).toBe(1);
    });

    it('should not lock after 4 attempts', async () => {
      for (let i = 0; i < 4; i++) {
        await lockoutService.recordFailedAttempt('test@example.com');
      }

      const status = await lockoutService.checkLockout('test@example.com');
      expect(status.isLocked).toBe(false);

      const count = await lockoutService.getFailedAttemptCount('test@example.com');
      expect(count).toBe(4);
    });

    it('should apply short lockout after 5 attempts', async () => {
      let status;
      for (let i = 0; i < 5; i++) {
        status = await lockoutService.recordFailedAttempt('test@example.com');
      }

      expect(status?.isLocked).toBe(true);
      expect(status?.remainingSeconds).toBe(15 * 60); // 15 minutes

      // Verify lockout is set
      const checkStatus = await lockoutService.checkLockout('test@example.com');
      expect(checkStatus.isLocked).toBe(true);
    });

    it('should clear attempt counter after short lockout', async () => {
      for (let i = 0; i < 5; i++) {
        await lockoutService.recordFailedAttempt('test@example.com');
      }

      const count = await lockoutService.getFailedAttemptCount('test@example.com');
      expect(count).toBe(0); // Counter should be cleared after lockout
    });

    it('should increment offense counter after each short lockout', async () => {
      // First short lockout
      for (let i = 0; i < 5; i++) {
        await lockoutService.recordFailedAttempt('test@example.com');
      }

      // Check offense count
      const offenseCount = await redis.get('auth:offense_count:test@example.com');
      expect(offenseCount).toBe('1');
    });

    it('should apply punishment lock after 3 offenses when userId provided', async () => {
      const userId = 'user-123';

      // First offense (5 attempts)
      for (let i = 0; i < 5; i++) {
        await lockoutService.recordFailedAttempt('test@example.com', userId);
      }
      await redis.del('auth:short_lockout:test@example.com'); // Clear lockout

      // Second offense (5 attempts)
      for (let i = 0; i < 5; i++) {
        await lockoutService.recordFailedAttempt('test@example.com', userId);
      }
      await redis.del('auth:short_lockout:test@example.com'); // Clear lockout

      // Third offense (5 attempts) - should trigger punishment
      let status;
      for (let i = 0; i < 5; i++) {
        status = await lockoutService.recordFailedAttempt('test@example.com', userId);
      }

      expect(status?.isLocked).toBe(true);
      expect(status?.remainingSeconds).toBe(24 * 60 * 60); // 24 hours
      expect(status?.reason).toContain('contact support');

      // Should have called setLockedUntil
      expect(userRepository.setLockedUntil).toHaveBeenCalledWith(userId, expect.any(Date));

      // Offense counter should be cleared after punishment
      const offenseCount = await redis.get('auth:offense_count:test@example.com');
      expect(offenseCount).toBeNull();
    });

    it('should not apply punishment lock without userId', async () => {
      // Three offenses without userId
      for (let offense = 0; offense < 3; offense++) {
        for (let i = 0; i < 5; i++) {
          await lockoutService.recordFailedAttempt('test@example.com');
        }
        await redis.del('auth:short_lockout:test@example.com');
      }

      // Should not have called setLockedUntil
      expect(userRepository.setLockedUntil).not.toHaveBeenCalled();
    });

    it('should apply short lockout for third offense without userId', async () => {
      // Three offenses without userId
      let status;
      for (let offense = 0; offense < 3; offense++) {
        for (let i = 0; i < 5; i++) {
          status = await lockoutService.recordFailedAttempt('test@example.com');
        }
        if (offense < 2) {
          await redis.del('auth:short_lockout:test@example.com');
        }
      }

      // Should still apply short lockout (not punishment)
      expect(status?.isLocked).toBe(true);
      expect(status?.remainingSeconds).toBe(15 * 60); // Still 15 minutes
    });
  });

  describe('clearFailedAttempts', () => {
    it('should clear failed attempts on successful login', async () => {
      // Record some failed attempts
      for (let i = 0; i < 3; i++) {
        await lockoutService.recordFailedAttempt('test@example.com');
      }

      // Clear on successful login
      await lockoutService.clearFailedAttempts('test@example.com');

      const count = await lockoutService.getFailedAttemptCount('test@example.com');
      expect(count).toBe(0);
    });

    it('should not clear offense counter on successful login', async () => {
      // Record a full offense
      for (let i = 0; i < 5; i++) {
        await lockoutService.recordFailedAttempt('test@example.com');
      }

      // Clear failed attempts
      await lockoutService.clearFailedAttempts('test@example.com');

      // Offense counter should still exist
      const offenseCount = await redis.get('auth:offense_count:test@example.com');
      expect(offenseCount).toBe('1');
    });
  });

  describe('getFailedAttemptCount', () => {
    it('should return 0 for new identifier', async () => {
      const count = await lockoutService.getFailedAttemptCount('new@example.com');
      expect(count).toBe(0);
    });

    it('should return correct count after attempts', async () => {
      await lockoutService.recordFailedAttempt('test@example.com');
      await lockoutService.recordFailedAttempt('test@example.com');
      await lockoutService.recordFailedAttempt('test@example.com');

      const count = await lockoutService.getFailedAttemptCount('test@example.com');
      expect(count).toBe(3);
    });
  });
});

describe('formatLockoutTime', () => {
  it('should format seconds correctly', () => {
    expect(formatLockoutTime(30)).toBe('30 seconds');
    expect(formatLockoutTime(1)).toBe('1 seconds');
  });

  it('should format minutes correctly', () => {
    expect(formatLockoutTime(60)).toBe('1 minute');
    expect(formatLockoutTime(120)).toBe('2 minutes');
    expect(formatLockoutTime(900)).toBe('15 minutes');
  });

  it('should format hours correctly', () => {
    expect(formatLockoutTime(3600)).toBe('1 hour');
    expect(formatLockoutTime(7200)).toBe('2 hours');
    expect(formatLockoutTime(86400)).toBe('24 hours');
  });

  it('should round up partial minutes', () => {
    expect(formatLockoutTime(61)).toBe('2 minutes');
    expect(formatLockoutTime(119)).toBe('2 minutes');
  });

  it('should round up partial hours', () => {
    expect(formatLockoutTime(3601)).toBe('2 hours');
    expect(formatLockoutTime(7199)).toBe('2 hours');
  });
});
