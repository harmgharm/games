/**
 * Users Repository
 *
 * Database operations for user profiles and search.
 */

import type { User, UserUpdate } from '@games/types';

import { db } from '../../db/client';

export const usersRepository = {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | undefined> {
    return db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
  },

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | undefined> {
    return db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', username.toLowerCase())
      .executeTakeFirst();
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UserUpdate): Promise<User | undefined> {
    return db
      .updateTable('users')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', userId)
      .returningAll()
      .executeTakeFirst();
  },

  /**
   * Search users by username or display name
   */
  async search(
    query: string,
    limit: number,
    offset: number,
  ): Promise<{ users: User[]; total: number }> {
    const searchPattern = `%${query.toLowerCase()}%`;

    // Get matching users (only public profiles)
    const users = await db
      .selectFrom('users')
      .selectAll()
      .where('is_public', '=', true)
      .where('status', '=', 'active')
      .where('deleted_at', 'is', null)
      .where((eb) =>
        eb.or([eb('username', 'ilike', searchPattern), eb('display_name', 'ilike', searchPattern)]),
      )
      .orderBy('username', 'asc')
      .limit(limit)
      .offset(offset)
      .execute();

    // Get total count
    const countResult = await db
      .selectFrom('users')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('is_public', '=', true)
      .where('status', '=', 'active')
      .where('deleted_at', 'is', null)
      .where((eb) =>
        eb.or([eb('username', 'ilike', searchPattern), eb('display_name', 'ilike', searchPattern)]),
      )
      .executeTakeFirst();

    return {
      users,
      total: Number(countResult?.count ?? 0),
    };
  },

  /**
   * Check if username is available
   * Excludes soft-deleted users and checks reserved_usernames table
   */
  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    // Check if username exists in active users (exclude soft-deleted)
    let userQuery = db
      .selectFrom('users')
      .select('id')
      .where('username', '=', username.toLowerCase())
      .where('deleted_at', 'is', null);

    if (excludeUserId) {
      userQuery = userQuery.where('id', '!=', excludeUserId);
    }

    const userExists = await userQuery.executeTakeFirst();

    if (userExists) {
      return false;
    }

    // Check if username is reserved
    const reserved = await db
      .selectFrom('reserved_usernames')
      .select('id')
      .where('username', '=', username.toLowerCase())
      .where('reserved_until', '>', new Date())
      .executeTakeFirst();

    return reserved === undefined;
  },
};
