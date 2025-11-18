import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createLockoutService, formatLockoutTime, type LockoutService } from './lockout.service';

// Use ioredis-mock for testing
import RedisMock from 'ioredis-mock';

describe('lockout service', () => {
  let redis: InstanceType<typeof RedisMock>;
  let lockoutService: LockoutService;

  beforeEach(() => {
    redis = new RedisMock();
    lockoutService = createLockoutService(redis);
  });

  afterEach(async () => {
    await redis.flushall();
  });

  describe('checkLockout', () => {
    it('should return not locked for new identifier', async () => {
      const status = await lockoutService.checkLockout('test@example.com');

      expect(status.isLocked).toBe(false);
    });

    it('should return locked status when lockout exists', async () => {
      // Manually set a lockout
      await redis.setex('auth:lockout:test@example.com', 900, '1');

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

    it('should lock after 5 attempts', async () => {
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

    it('should clear attempt counter after lockout', async () => {
      for (let i = 0; i < 5; i++) {
        await lockoutService.recordFailedAttempt('test@example.com');
      }

      const count = await lockoutService.getFailedAttemptCount('test@example.com');
      expect(count).toBe(0); // Counter should be cleared after lockout
    });

    it('should escalate lockout duration on repeated lockouts', async () => {
      // First lockout - 15 minutes
      for (let i = 0; i < 5; i++) {
        await lockoutService.recordFailedAttempt('test@example.com');
      }

      // Clear lockout to simulate time passing
      await redis.del('auth:lockout:test@example.com');

      // Second lockout - 1 hour
      let status;
      for (let i = 0; i < 5; i++) {
        status = await lockoutService.recordFailedAttempt('test@example.com');
      }

      expect(status?.isLocked).toBe(true);
      expect(status?.remainingSeconds).toBe(60 * 60); // 1 hour

      // Clear lockout again
      await redis.del('auth:lockout:test@example.com');

      // Third lockout - 24 hours
      for (let i = 0; i < 5; i++) {
        status = await lockoutService.recordFailedAttempt('test@example.com');
      }

      expect(status?.isLocked).toBe(true);
      expect(status?.remainingSeconds).toBe(24 * 60 * 60); // 24 hours
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
