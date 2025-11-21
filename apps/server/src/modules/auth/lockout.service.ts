/**
 * Account Lockout Service
 *
 * Implements a 3-tier lockout system:
 * 1. Short Counter (Redis) - Tracks failed attempts, triggers short lockout
 * 2. Escalation Counter (Redis) - Tracks short lockouts, triggers punishment
 * 3. Punishment Lock (DB) - 24hr lockout in users.locked_until
 */

import type { Redis } from 'ioredis';

import { userRepository } from './auth.repository.js';

/**
 * Lockout configuration
 */
const LOCKOUT_CONFIG = {
  // Short counter settings
  MAX_ATTEMPTS: 5,
  ATTEMPT_WINDOW: 15 * 60, // 15 minutes TTL for attempt counter
  SHORT_LOCKOUT_DURATION: 15 * 60, // 15 minute lockout

  // Escalation settings
  MAX_OFFENSES: 3, // Number of short lockouts before punishment
  OFFENSE_WINDOW: 24 * 60 * 60, // 24 hours TTL for offense counter

  // Punishment settings
  PUNISHMENT_DURATION: 24 * 60 * 60 * 1000, // 24 hours in ms for DB
} as const;

/**
 * Redis key prefixes
 */
const REDIS_KEYS = {
  FAILED_ATTEMPTS: 'auth:failed_attempts:',
  SHORT_LOCKOUT: 'auth:short_lockout:',
  OFFENSE_COUNT: 'auth:offense_count:',
} as const;

/**
 * Get Redis keys for an identifier
 */
function getKeys(identifier: string) {
  return {
    attempts: `${REDIS_KEYS.FAILED_ATTEMPTS}${identifier}`,
    lockout: `${REDIS_KEYS.SHORT_LOCKOUT}${identifier}`,
    offenses: `${REDIS_KEYS.OFFENSE_COUNT}${identifier}`,
  };
}

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds?: number;
  reason?: string;
}

export interface LockoutService {
  /**
   * Check if an identifier is locked out (Redis short lockout only)
   * Note: DB locked_until is checked separately in auth.service
   */
  checkLockout(identifier: string): Promise<LockoutStatus>;

  /**
   * Record a failed login attempt
   * Returns lockout status after recording
   */
  recordFailedAttempt(identifier: string, userId?: string): Promise<LockoutStatus>;

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
      const keys = getKeys(identifier);
      const ttl = await redis.ttl(keys.lockout);

      if (ttl > 0) {
        return {
          isLocked: true,
          remainingSeconds: ttl,
          reason: 'Too many failed login attempts',
        };
      }

      return { isLocked: false };
    },

    async recordFailedAttempt(identifier: string, userId?: string): Promise<LockoutStatus> {
      const keys = getKeys(identifier);

      // Increment failed attempts
      const attempts = await redis.incr(keys.attempts);

      // Set expiry on first attempt
      if (attempts === 1) {
        await redis.expire(keys.attempts, LOCKOUT_CONFIG.ATTEMPT_WINDOW);
      }

      // Check if we've hit the attempt limit
      if (attempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS) {
        // Clear attempt counter
        await redis.del(keys.attempts);

        // Increment offense counter
        const offenses = await redis.incr(keys.offenses);

        // Set/refresh offense counter expiry
        await redis.expire(keys.offenses, LOCKOUT_CONFIG.OFFENSE_WINDOW);

        // Check if we've hit the offense limit for punishment
        if (offenses >= LOCKOUT_CONFIG.MAX_OFFENSES && userId !== undefined) {
          // Apply punishment lock to database
          const punishmentUntil = new Date(Date.now() + LOCKOUT_CONFIG.PUNISHMENT_DURATION);
          await userRepository.setLockedUntil(userId, punishmentUntil);

          // Clear offense counter since punishment was applied
          await redis.del(keys.offenses);

          return {
            isLocked: true,
            remainingSeconds: LOCKOUT_CONFIG.PUNISHMENT_DURATION / 1000,
            reason: 'Account locked due to repeated failed attempts. Please contact support.',
          };
        }

        // Apply short lockout
        await redis.setex(keys.lockout, LOCKOUT_CONFIG.SHORT_LOCKOUT_DURATION, '1');

        return {
          isLocked: true,
          remainingSeconds: LOCKOUT_CONFIG.SHORT_LOCKOUT_DURATION,
          reason: 'Too many failed login attempts',
        };
      }

      return { isLocked: false };
    },

    async clearFailedAttempts(identifier: string): Promise<void> {
      const keys = getKeys(identifier);
      await redis.del(keys.attempts);
      // Note: We don't clear offense counter on successful login
      // This prevents attackers from resetting their offense count
    },

    async getFailedAttemptCount(identifier: string): Promise<number> {
      const keys = getKeys(identifier);
      const count = await redis.get(keys.attempts);
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
