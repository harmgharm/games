/**
 * User Search Schema
 */

import { z } from 'zod';

/**
 * Search users query parameters
 */
export const searchUsersSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type SearchUsersInput = z.infer<typeof searchUsersSchema>;

/**
 * User search result
 */
export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  identityVerified: boolean;
}

/**
 * Paginated search response
 */
export interface PaginatedSearchResponse {
  users: UserSearchResult[];
  total: number;
  limit: number;
  offset: number;
}
