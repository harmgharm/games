/**
 * Email Repository
 *
 * Database operations for email tokens.
 */

import crypto from 'node:crypto';

import { db } from '../../db/client';

/**
 * Email token types
 */
export type EmailTokenType = 'verification' | 'password_reset';

/**
 * Email token record
 */
export interface EmailToken {
  id: string;
  user_id: string;
  token_hash: Buffer;
  code: string;
  type: EmailTokenType;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

/**
 * New email token input
 */
export interface NewEmailToken {
  user_id: string;
  token_hash: Buffer;
  code: string;
  type: EmailTokenType;
  expires_at: Date;
}

/**
 * Hash a token for storage
 */
export function hashToken(token: string): Buffer {
  return Buffer.from(crypto.createHash('sha256').update(token).digest());
}

/**
 * Generate a random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a 6-digit numeric code
 */
export function generateCode(): string {
  // eslint-disable-next-line sonarjs/pseudo-random -- Safe for email verification codes
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}

export const emailTokenRepository = {
  /**
   * Create a new email token
   */
  async create(token: NewEmailToken): Promise<EmailToken> {
    const result = await db
      .insertInto('email_tokens')
      .values(token)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result as EmailToken;
  },

  /**
   * Find token by hash
   */
  async findByHash(tokenHash: Buffer): Promise<EmailToken | undefined> {
    const result = await db
      .selectFrom('email_tokens')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .where('used_at', 'is', null)
      .executeTakeFirst();

    return result as EmailToken | undefined;
  },

  /**
   * Find token by user ID, code, and type
   */
  async findByUserAndCode(
    userId: string,
    code: string,
    type: EmailTokenType,
  ): Promise<EmailToken | undefined> {
    const result = await db
      .selectFrom('email_tokens')
      .selectAll()
      .where('user_id', '=', userId)
      .where('code', '=', code)
      .where('type', '=', type)
      .where('used_at', 'is', null)
      .executeTakeFirst();

    return result as EmailToken | undefined;
  },

  /**
   * Find active token by email and code (for password reset)
   */
  async findByEmailAndCode(
    email: string,
    code: string,
    type: EmailTokenType,
  ): Promise<EmailToken | undefined> {
    const result = await db
      .selectFrom('email_tokens')
      .innerJoin('users', 'users.id', 'email_tokens.user_id')
      .selectAll('email_tokens')
      .where('users.email', '=', email)
      .where('email_tokens.code', '=', code)
      .where('email_tokens.type', '=', type)
      .where('email_tokens.used_at', 'is', null)
      .executeTakeFirst();

    return result as EmailToken | undefined;
  },

  /**
   * Mark token as used
   */
  async markUsed(tokenId: string): Promise<void> {
    await db
      .updateTable('email_tokens')
      .set({ used_at: new Date() })
      .where('id', '=', tokenId)
      .execute();
  },

  /**
   * Invalidate all unused tokens for a user and type
   */
  async invalidateForUser(userId: string, type: EmailTokenType): Promise<void> {
    await db
      .updateTable('email_tokens')
      .set({ used_at: new Date() })
      .where('user_id', '=', userId)
      .where('type', '=', type)
      .where('used_at', 'is', null)
      .execute();
  },

  /**
   * Count recent tokens for rate limiting
   */
  async countRecentTokens(
    userId: string,
    type: EmailTokenType,
    sinceMinutes: number,
  ): Promise<number> {
    const since = new Date(Date.now() - sinceMinutes * 60 * 1000);

    const result = await db
      .selectFrom('email_tokens')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('user_id', '=', userId)
      .where('type', '=', type)
      .where('created_at', '>=', since)
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  },

  /**
   * Delete expired tokens (cleanup job)
   */
  async deleteExpired(): Promise<number> {
    const result = await db
      .deleteFrom('email_tokens')
      .where('expires_at', '<', new Date())
      .executeTakeFirst();

    return Number(result.numDeletedRows);
  },
};
