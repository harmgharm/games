/**
 * Auth Repository
 *
 * Database queries for authentication.
 */

import type { NewSession, NewUser, Session, User } from '@games/types';

import { db } from '../../db';

/**
 * User queries
 */
export const userRepository = {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | undefined> {
    return db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
  },

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | undefined> {
    return db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', username)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
  },

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | undefined> {
    return db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
  },

  /**
   * Create a new user
   */
  async create(user: NewUser): Promise<User> {
    return db.insertInto('users').values(user).returningAll().executeTakeFirstOrThrow();
  },

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await db
      .updateTable('users')
      .set({ last_login_at: new Date() })
      .where('id', '=', userId)
      .execute();
  },

  /**
   * Update login info (timestamp, IP, increment count)
   */
  async updateLoginInfo(userId: string, ip: string | null): Promise<void> {
    await db
      .updateTable('users')
      .set({
        last_login_at: new Date(),
        last_login_ip: ip,
        login_count: (eb) => eb('login_count', '+', 1),
      })
      .where('id', '=', userId)
      .execute();
  },

  /**
   * Update email verified status
   */
  async updateEmailVerified(userId: string, verified: boolean): Promise<void> {
    await db
      .updateTable('users')
      .set({ email_verified: verified })
      .where('id', '=', userId)
      .execute();
  },

  /**
   * Update password
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .updateTable('users')
      .set({ password_hash: passwordHash })
      .where('id', '=', userId)
      .execute();
  },
};

/**
 * Session queries
 */
export const sessionRepository = {
  /**
   * Create a new session
   */
  async create(session: NewSession): Promise<Session> {
    return db.insertInto('sessions').values(session).returningAll().executeTakeFirstOrThrow();
  },

  /**
   * Find session by token hash
   */
  async findByTokenHash(tokenHash: string): Promise<Session | undefined> {
    return db
      .selectFrom('sessions')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .where('revoked_at', 'is', null)
      .executeTakeFirst();
  },

  /**
   * Find all active sessions for a user
   */
  async findActiveByUserId(userId: string): Promise<Session[]> {
    return db
      .selectFrom('sessions')
      .selectAll()
      .where('user_id', '=', userId)
      .where('revoked_at', 'is', null)
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc')
      .execute();
  },

  /**
   * Revoke a session
   */
  async revoke(sessionId: string): Promise<void> {
    await db
      .updateTable('sessions')
      .set({ revoked_at: new Date() })
      .where('id', '=', sessionId)
      .execute();
  },

  /**
   * Revoke all sessions for a user
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await db
      .updateTable('sessions')
      .set({ revoked_at: new Date() })
      .where('user_id', '=', userId)
      .where('revoked_at', 'is', null)
      .execute();
  },

  /**
   * Delete expired sessions (cleanup job)
   */
  async deleteExpired(): Promise<number> {
    const result = await db
      .deleteFrom('sessions')
      .where('expires_at', '<', new Date())
      .executeTakeFirst();

    return Number(result.numDeletedRows);
  },
};

export type UserRepository = typeof userRepository;
export type SessionRepository = typeof sessionRepository;
