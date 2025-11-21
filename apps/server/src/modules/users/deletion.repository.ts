/**
 * Deletion Repository
 *
 * Database operations for account deletion and username reservation.
 */

import type { NewReservedUsername, ReservedUsername } from '@games/types';

import { db } from '../../db/client';

export const deletionRepository = {
  /**
   * Reserve a username for a specified duration
   */
  async reserveUsername(options: {
    username: string;
    userId: string;
    emailHash: Buffer;
    daysToReserve: number;
  }): Promise<ReservedUsername> {
    const reservedUntil = new Date();
    reservedUntil.setDate(reservedUntil.getDate() + options.daysToReserve);

    const reservation: NewReservedUsername = {
      username: options.username.toLowerCase(),
      user_id: options.userId,
      original_email_hash: options.emailHash,
      reserved_until: reservedUntil,
    };

    return db
      .insertInto('reserved_usernames')
      .values(reservation)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  /**
   * Check if a username is currently reserved (not expired)
   */
  async isUsernameReserved(username: string): Promise<boolean> {
    const reservation = await db
      .selectFrom('reserved_usernames')
      .select('id')
      .where('username', '=', username.toLowerCase())
      .where('reserved_until', '>', new Date())
      .executeTakeFirst();

    return reservation !== undefined;
  },

  /**
   * Find reservation by user ID
   */
  async findReservationByUserId(userId: string): Promise<ReservedUsername | undefined> {
    return db
      .selectFrom('reserved_usernames')
      .selectAll()
      .where('user_id', '=', userId)
      .where('reserved_until', '>', new Date())
      .executeTakeFirst();
  },

  /**
   * Find reservation by email hash (for recovery)
   */
  async findReservationByEmailHash(emailHash: Buffer): Promise<ReservedUsername | undefined> {
    return db
      .selectFrom('reserved_usernames')
      .selectAll()
      .where('original_email_hash', '=', emailHash)
      .where('reserved_until', '>', new Date())
      .executeTakeFirst();
  },

  /**
   * Delete a reservation (used after successful recovery)
   */
  async deleteReservation(userId: string): Promise<void> {
    await db.deleteFrom('reserved_usernames').where('user_id', '=', userId).execute();
  },

  /**
   * Delete all expired reservations (cleanup job)
   * Returns the number of deleted reservations
   */
  async releaseExpiredReservations(): Promise<number> {
    const result = await db
      .deleteFrom('reserved_usernames')
      .where('reserved_until', '<', new Date())
      .executeTakeFirst();

    return Number(result.numDeletedRows);
  },
};
