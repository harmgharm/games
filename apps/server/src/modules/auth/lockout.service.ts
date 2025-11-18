/**
 * Account Lockout Service
 *
 * Handles short-term lockouts via Redis with escalating durations.
 */

import type { Redis } from 'ioredis';

/**
 * Lockout configuration
 */
const LOCKOUT_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATIONS: [
    15 * 60, // 15 minutes (first lockout)
    60 * 60, // 1 hour (second lockout)
    24 * 60 * 60, // 24 hours (third+ lockout)
  ],
  ATTEMPT_WINDOW: 15 * 60, // 15 minutes to track attempts
} as const;

/**
 * Redis key prefixes
 */
const REDIS_KEYS = {
  FAILED_ATTEMPTS: 'auth:failed_attempts:',
  LOCKOUT: 'auth:lockout:',
  LOCKOUT_COUNT: 'auth:lockout_count:',
} as const;

/**
 * Get the key for tracking failed attempts
 */
function getFailedAttemptsKey(identifier: string): string {
  return `${REDIS_KEYS.FAILED_ATTEMPTS}${identifier}`;
}

/**
 * Get the key for lockout status
 */
function getLockoutKey(identifier: string): string {
  return `${REDIS_KEYS.LOCKOUT}${identifier}`;
}

/**
 * Get the key for lockout count (for escalation)
 */
function getLockoutCountKey(identifier: string): string {
  return `${REDIS_KEYS.LOCKOUT_COUNT}${identifier}`;
}

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds?: number;
  reason?: string;
}

export interface LockoutService {
  /**
   * Check if an identifier (userId or IP) is locked out
   */
  checkLockout(identifier: string): Promise<LockoutStatus>;

  /**
   * Record a failed login attempt
   * Returns lockout status after recording
   */
  recordFailedAttempt(identifier: string): Promise<LockoutStatus>;

  /**
   * Clear failed attempts on successful login
   */
  clearFailedAttempts(identifier: string): Promise<void>;

  /**
   * Get current failed attempt count
   */
  getFailedAttemptCount(identifier: string): Promise<number>;
}

/**
 * Create a lockout service instance
 */
export function createLockoutService(redis: Redis): LockoutService {
  return {
    async checkLockout(identifier: string): Promise<LockoutStatus> {
      const lockoutKey = getLockoutKey(identifier);
      const ttl = await redis.ttl(lockoutKey);

      if (ttl > 0) {
        return {
          isLocked: true,
          remainingSeconds: ttl,
          reason: 'Too many failed login attempts',
        };
      }

      return { isLocked: false };
    },

    async recordFailedAttempt(identifier: string): Promise<LockoutStatus> {
      const attemptsKey = getFailedAttemptsKey(identifier);
      const lockoutKey = getLockoutKey(identifier);
      const lockoutCountKey = getLockoutCountKey(identifier);

      // Increment failed attempts
      const attempts = await redis.incr(attemptsKey);

      // Set expiry on first attempt
      if (attempts === 1) {
        await redis.expire(attemptsKey, LOCKOUT_CONFIG.ATTEMPT_WINDOW);
      }

      // Check if we've hit the limit
      if (attempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS) {
        // Get current lockout count for escalation
        const lockoutCountStr = await redis.get(lockoutCountKey);
        const lockoutCount = lockoutCountStr === null ? 0 : parseInt(lockoutCountStr, 10);

        // Determine lockout duration based on escalation
        const durationIndex = Math.min(lockoutCount, LOCKOUT_CONFIG.LOCKOUT_DURATIONS.length - 1);
        const lockoutDuration = LOCKOUT_CONFIG.LOCKOUT_DURATIONS[durationIndex];

        // Set lockout
        await redis.setex(lockoutKey, lockoutDuration, '1');

        // Increment lockout count (for escalation)
        // This key persists longer to track repeat offenders
        await redis.incr(lockoutCountKey);
        await redis.expire(lockoutCountKey, 7 * 24 * 60 * 60); // 7 days

        // Clear failed attempts counter
        await redis.del(attemptsKey);

        return {
          isLocked: true,
          remainingSeconds: lockoutDuration,
          reason: 'Too many failed login attempts',
        };
      }

      return {
        isLocked: false,
      };
    },

    async clearFailedAttempts(identifier: string): Promise<void> {
      const attemptsKey = getFailedAttemptsKey(identifier);
      await redis.del(attemptsKey);
    },

    async getFailedAttemptCount(identifier: string): Promise<number> {
      const attemptsKey = getFailedAttemptsKey(identifier);
      const count = await redis.get(attemptsKey);
      return count === null ? 0 : parseInt(count, 10);
    },
  };
}

/**
 * Format remaining lockout time for user display
 */
export function formatLockoutTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.ceil(seconds / 3600);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}
