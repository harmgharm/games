/**
 * Deletion Service
 *
 * Handles account deletion and recovery with username reservation.
 */

import crypto from 'node:crypto';

import { AppError } from '@games/types';

import { withTransaction } from '../../db/transaction';
import { verifyPassword } from '../auth/utils/password';
import { deletionRepository } from './deletion.repository';
import { usersRepository } from './users.repository';

const RESERVATION_DAYS = 30;

export const deletionService = {
  /**
   * Delete user account
   * - Verifies password
   * - Anonymizes username and email
   * - Reserves original username for 30 days
   * - Revokes all sessions
   * - Deletes email tokens and social relationships
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    await withTransaction(async (trx) => {
      // 1. Get user and verify password
      const user = await usersRepository.findById(userId);

      if (user === undefined) {
        throw new AppError('User not found', 'USER_NOT_FOUND', 404, true);
      }

      if (user.deleted_at !== null || user.status === 'deleted') {
        throw new AppError('Account already deleted', 'ACCOUNT_ALREADY_DELETED', 400, true);
      }

      const isValidPassword = await verifyPassword(user.password_hash, password);

      if (!isValidPassword) {
        throw new AppError('Invalid password', 'INVALID_PASSWORD', 401, true);
      }

      // 2. Generate anonymized data
      const randomId = crypto.randomBytes(4).toString('hex'); // 8 hex chars
      const anonymizedUsername = `deleted_${randomId}`;
      const anonymizedEmail = `deleted_${user.id}@anonymized.local`;

      // 3. Hash original email for recovery verification
      const emailHash = crypto.createHash('sha256').update(user.email.toLowerCase()).digest();

      // 4. Reserve original username (30 days)
      await trx
        .insertInto('reserved_usernames')
        .values({
          username: user.username.toLowerCase(),
          user_id: user.id,
          original_email_hash: emailHash,
          reserved_until: new Date(Date.now() + RESERVATION_DAYS * 24 * 60 * 60 * 1000),
        })
        .execute();

      // 5. Update user with anonymized data
      await trx
        .updateTable('users')
        .set({
          username: anonymizedUsername,
          email: anonymizedEmail,
          display_name: null,
          bio: null,
          avatar_url: null,
          deleted_at: new Date(),
          status: 'deleted',
          updated_at: new Date(),
        })
        .where('id', '=', userId)
        .execute();

      // 6. Revoke all sessions
      await trx
        .updateTable('sessions')
        .set({ revoked_at: new Date() })
        .where('user_id', '=', userId)
        .where('revoked_at', 'is', null)
        .execute();

      // 7. Delete email tokens
      await trx.deleteFrom('email_tokens').where('user_id', '=', userId).execute();

      // 8. Delete social relationships
      await trx
        .deleteFrom('friendships')
        .where((eb) => eb.or([eb('requester_id', '=', userId), eb('addressee_id', '=', userId)]))
        .execute();

      await trx.deleteFrom('blocks').where('blocker_id', '=', userId).execute();

      await trx.deleteFrom('mutes').where('muter_id', '=', userId).execute();
    });
  },

  /**
   * Recover deleted account
   * - User provides original email and password
   * - Verifies email hash matches reservation
   * - Verifies password
   * - Restores original username
   * - Clears deleted_at and sets status to active
   * - Deletes reservation
   */
  async recoverAccount(email: string, password: string): Promise<{ userId: string }> {
    return withTransaction(async (trx) => {
      // 1. Hash provided email
      const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest();

      // 2. Find reservation by email hash
      const reservation = await deletionRepository.findReservationByEmailHash(emailHash);

      if (reservation === undefined) {
        throw new AppError(
          'No recovery found or recovery period expired',
          'RECOVERY_NOT_FOUND',
          404,
          true,
        );
      }

      // 3. Get user
      const user = await usersRepository.findById(reservation.user_id);

      if (user === undefined) {
        throw new AppError('User not found', 'USER_NOT_FOUND', 404, true);
      }

      // 4. Verify password
      const isValidPassword = await verifyPassword(user.password_hash, password);

      if (!isValidPassword) {
        throw new AppError('Invalid password', 'INVALID_PASSWORD', 401, true);
      }

      // 5. Restore original username and email
      await trx
        .updateTable('users')
        .set({
          username: reservation.username,
          email: email.toLowerCase(),
          deleted_at: null,
          status: 'active',
          updated_at: new Date(),
        })
        .where('id', '=', user.id)
        .execute();

      // 6. Delete reservation
      await trx.deleteFrom('reserved_usernames').where('user_id', '=', user.id).execute();

      return { userId: user.id };
    });
  },

  /**
   * Cleanup expired username reservations
   * Called by scheduled job
   */
  async cleanupExpiredReservations(): Promise<number> {
    return deletionRepository.releaseExpiredReservations();
  },
};
