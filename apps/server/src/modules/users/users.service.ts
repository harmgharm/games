/**
 * Users Service
 *
 * Business logic for user profiles and search.
 */

import { AppError } from '@games/types';
import type {
  PaginatedSearchResponse,
  PrivateUserProfile,
  PublicUserProfile,
  SearchUsersInput,
  UpdateProfileInput,
  UserSearchResult,
} from '@games/validation';

import { usersRepository } from './users.repository.js';

/**
 * Get public user profile by ID
 */
export async function getPublicProfile(userId: string): Promise<PublicUserProfile> {
  const user = await usersRepository.findById(userId);

  if (user === undefined) {
    throw new AppError('User not found', 'USER_NOT_FOUND', 404, true);
  }

  // Check if profile is public
  if (!user.is_public) {
    throw new AppError('Profile is private', 'PROFILE_PRIVATE', 403, true);
  }

  // Check if account is active
  if (user.status !== 'active' || user.deleted_at !== null) {
    throw new AppError('User not found', 'USER_NOT_FOUND', 404, true);
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    identityVerified: user.identity_verified,
    createdAt: user.created_at,
  };
}

/**
 * Get own profile (private data)
 */
export async function getOwnProfile(userId: string): Promise<PrivateUserProfile> {
  const user = await usersRepository.findById(userId);

  if (user === undefined) {
    throw new AppError('User not found', 'USER_NOT_FOUND', 404, true);
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    identityVerified: user.identity_verified,
    createdAt: user.created_at,
    email: user.email,
    emailVerified: user.email_verified,
    isPublic: user.is_public,
    status: user.status,
    lastLoginAt: user.last_login_at,
    loginCount: user.login_count,
  };
}

/**
 * Update own profile
 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<PrivateUserProfile> {
  const user = await usersRepository.findById(userId);

  if (user === undefined) {
    throw new AppError('User not found', 'USER_NOT_FOUND', 404, true);
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (input.displayName !== undefined) {
    updateData.display_name = input.displayName;
  }

  if (input.bio !== undefined) {
    updateData.bio = input.bio;
  }

  if (input.avatarUrl !== undefined) {
    updateData.avatar_url = input.avatarUrl;
  }

  if (input.isPublic !== undefined) {
    updateData.is_public = input.isPublic;
  }

  // Update if there are changes
  if (Object.keys(updateData).length > 0) {
    const updated = await usersRepository.updateProfile(userId, updateData);

    if (updated === undefined) {
      throw new AppError('Failed to update profile', 'UPDATE_FAILED', 500, false);
    }

    return {
      id: updated.id,
      username: updated.username,
      displayName: updated.display_name,
      bio: updated.bio,
      avatarUrl: updated.avatar_url,
      identityVerified: updated.identity_verified,
      createdAt: updated.created_at,
      email: updated.email,
      emailVerified: updated.email_verified,
      isPublic: updated.is_public,
      status: updated.status,
      lastLoginAt: updated.last_login_at,
      loginCount: updated.login_count,
    };
  }

  // Return current profile if no changes
  return getOwnProfile(userId);
}

/**
 * Search users
 */
export async function searchUsers(input: SearchUsersInput): Promise<PaginatedSearchResponse> {
  const { users, total } = await usersRepository.search(input.q, input.limit, input.offset);

  const results: UserSearchResult[] = users.map((user) => ({
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    identityVerified: user.identity_verified,
  }));

  return {
    users: results,
    total,
    limit: input.limit,
    offset: input.offset,
  };
}
