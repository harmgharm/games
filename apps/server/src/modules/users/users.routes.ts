/**
 * Users Routes
 *
 * API endpoints for user profiles and search.
 */

import { searchUsersSchema, updateProfileSchema } from '@games/validation';
import type { FastifyInstance } from 'fastify';

import * as usersService from './users.service';

/**
 * Register user routes
 */
export async function usersRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/users/me - Get own profile
   */
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
    handler: async (request) => {
      const userId = request.user.userId;
      const profile = await usersService.getOwnProfile(userId);

      return {
        data: profile,
        error: null,
        meta: { timestamp: new Date().toISOString() },
      };
    },
  });

  /**
   * PATCH /api/v1/users/me - Update own profile
   */
  fastify.patch('/me', {
    onRequest: [fastify.authenticate],
    handler: async (request) => {
      const userId = request.user.userId;
      const input = updateProfileSchema.parse(request.body);
      const profile = await usersService.updateProfile(userId, input);

      return {
        data: profile,
        error: null,
        meta: { timestamp: new Date().toISOString() },
      };
    },
  });

  /**
   * GET /api/v1/users/search - Search users
   */
  fastify.get('/search', {
    handler: async (request) => {
      const input = searchUsersSchema.parse(request.query);
      const result = await usersService.searchUsers(input);

      return {
        data: result,
        error: null,
        meta: { timestamp: new Date().toISOString() },
      };
    },
  });

  /**
   * GET /api/v1/users/:id - Get user profile by ID
   */
  fastify.get<{ Params: { id: string } }>('/:id', {
    handler: async (request) => {
      const { id } = request.params;
      const profile = await usersService.getPublicProfile(id);

      return {
        data: profile,
        error: null,
        meta: { timestamp: new Date().toISOString() },
      };
    },
  });
}
