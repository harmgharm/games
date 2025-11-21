/**
 * Users Service Tests
 *
 * Tests for user profile business logic.
 */

import { AppError } from '@games/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usersRepository } from './users.repository.js';
import * as usersService from './users.service.js';

// Mock the repository
vi.mock('./users.repository', () => ({
  usersRepository: {
    findById: vi.fn(),
    findByUsername: vi.fn(),
    updateProfile: vi.fn(),
    search: vi.fn(),
    isUsernameAvailable: vi.fn(),
  },
}));

// Helper to create mock user
function createMockUser(
  overrides: Partial<{
    id: string;
    email: string;
    username: string;
    password_hash: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    email_verified: boolean;
    identity_verified: boolean;
    last_login_at: Date | null;
    last_login_ip: string | null;
    login_count: number;
    locked_until: Date | null;
    status: 'active' | 'banned' | 'disabled' | 'deleted';
    is_public: boolean;
    created_at: Date;
    updated_at: Date | null;
    deleted_at: Date | null;
  }> = {},
) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    password_hash: 'hashed',
    display_name: 'Test User',
    bio: 'Test bio',
    avatar_url: 'https://example.com/avatar.jpg',
    email_verified: true,
    identity_verified: false,
    last_login_at: new Date(),
    last_login_ip: '127.0.0.1',
    login_count: 5,
    locked_until: null,
    status: 'active' as const,
    is_public: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

describe('users service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPublicProfile', () => {
    it('should return public profile for active public user', async () => {
      const mockUser = createMockUser();
      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);

      const result = await usersService.getPublicProfile('user-123');

      expect(result).toEqual({
        id: 'user-123',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'Test bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        identityVerified: false,
        createdAt: mockUser.created_at,
      });
    });

    it('should throw error if user not found', async () => {
      vi.mocked(usersRepository.findById).mockResolvedValue(undefined);

      await expect(usersService.getPublicProfile('unknown')).rejects.toThrow(AppError);
      await expect(usersService.getPublicProfile('unknown')).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('should throw error if profile is private', async () => {
      const mockUser = createMockUser({ is_public: false });
      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);

      await expect(usersService.getPublicProfile('user-123')).rejects.toThrow(AppError);
      await expect(usersService.getPublicProfile('user-123')).rejects.toMatchObject({
        code: 'PROFILE_PRIVATE',
        statusCode: 403,
      });
    });

    it('should throw error if user is banned', async () => {
      const mockUser = createMockUser({ status: 'banned' });
      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);

      await expect(usersService.getPublicProfile('user-123')).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('should throw error if user is deleted', async () => {
      const mockUser = createMockUser({ deleted_at: new Date() });
      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);

      await expect(usersService.getPublicProfile('user-123')).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        statusCode: 404,
      });
    });
  });

  describe('getOwnProfile', () => {
    it('should return full profile data', async () => {
      const mockUser = createMockUser();
      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);

      const result = await usersService.getOwnProfile('user-123');

      expect(result).toEqual({
        id: 'user-123',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'Test bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        identityVerified: false,
        createdAt: mockUser.created_at,
        email: 'test@example.com',
        emailVerified: true,
        isPublic: true,
        status: 'active',
        lastLoginAt: mockUser.last_login_at,
        loginCount: 5,
      });
    });

    it('should throw error if user not found', async () => {
      vi.mocked(usersRepository.findById).mockResolvedValue(undefined);

      await expect(usersService.getOwnProfile('unknown')).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('should return private profile data even if not public', async () => {
      const mockUser = createMockUser({ is_public: false });
      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);

      const result = await usersService.getOwnProfile('user-123');

      expect(result.isPublic).toBe(false);
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('updateProfile', () => {
    it('should update display name', async () => {
      const mockUser = createMockUser();
      const updatedUser = createMockUser({ display_name: 'New Name' });

      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(usersRepository.updateProfile).mockResolvedValue(updatedUser);

      const result = await usersService.updateProfile('user-123', {
        displayName: 'New Name',
      });

      expect(usersRepository.updateProfile).toHaveBeenCalledWith('user-123', {
        display_name: 'New Name',
      });
      expect(result.displayName).toBe('New Name');
    });

    it('should update bio', async () => {
      const mockUser = createMockUser();
      const updatedUser = createMockUser({ bio: 'New bio' });

      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(usersRepository.updateProfile).mockResolvedValue(updatedUser);

      const result = await usersService.updateProfile('user-123', {
        bio: 'New bio',
      });

      expect(usersRepository.updateProfile).toHaveBeenCalledWith('user-123', {
        bio: 'New bio',
      });
      expect(result.bio).toBe('New bio');
    });

    it('should update avatar URL', async () => {
      const mockUser = createMockUser();
      const updatedUser = createMockUser({ avatar_url: 'https://new.com/avatar.png' });

      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(usersRepository.updateProfile).mockResolvedValue(updatedUser);

      const result = await usersService.updateProfile('user-123', {
        avatarUrl: 'https://new.com/avatar.png',
      });

      expect(usersRepository.updateProfile).toHaveBeenCalledWith('user-123', {
        avatar_url: 'https://new.com/avatar.png',
      });
      expect(result.avatarUrl).toBe('https://new.com/avatar.png');
    });

    it('should update privacy setting', async () => {
      const mockUser = createMockUser();
      const updatedUser = createMockUser({ is_public: false });

      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(usersRepository.updateProfile).mockResolvedValue(updatedUser);

      const result = await usersService.updateProfile('user-123', {
        isPublic: false,
      });

      expect(usersRepository.updateProfile).toHaveBeenCalledWith('user-123', {
        is_public: false,
      });
      expect(result.isPublic).toBe(false);
    });

    it('should update multiple fields at once', async () => {
      const mockUser = createMockUser();
      const updatedUser = createMockUser({
        display_name: 'New Name',
        bio: 'New bio',
        is_public: false,
      });

      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(usersRepository.updateProfile).mockResolvedValue(updatedUser);

      await usersService.updateProfile('user-123', {
        displayName: 'New Name',
        bio: 'New bio',
        isPublic: false,
      });

      expect(usersRepository.updateProfile).toHaveBeenCalledWith('user-123', {
        display_name: 'New Name',
        bio: 'New bio',
        is_public: false,
      });
    });

    it('should return current profile if no changes', async () => {
      const mockUser = createMockUser();
      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);

      const result = await usersService.updateProfile('user-123', {});

      expect(usersRepository.updateProfile).not.toHaveBeenCalled();
      expect(result.id).toBe('user-123');
    });

    it('should throw error if user not found', async () => {
      vi.mocked(usersRepository.findById).mockResolvedValue(undefined);

      await expect(
        usersService.updateProfile('unknown', { displayName: 'New' }),
      ).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('should throw error if update fails', async () => {
      const mockUser = createMockUser();
      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(usersRepository.updateProfile).mockResolvedValue(undefined);

      await expect(
        usersService.updateProfile('user-123', { displayName: 'New' }),
      ).rejects.toMatchObject({
        code: 'UPDATE_FAILED',
        statusCode: 500,
      });
    });

    it('should allow setting bio to null', async () => {
      const mockUser = createMockUser();
      const updatedUser = createMockUser({ bio: null });

      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(usersRepository.updateProfile).mockResolvedValue(updatedUser);

      const result = await usersService.updateProfile('user-123', {
        bio: null,
      });

      expect(usersRepository.updateProfile).toHaveBeenCalledWith('user-123', {
        bio: null,
      });
      expect(result.bio).toBeNull();
    });
  });

  describe('searchUsers', () => {
    it('should return paginated search results', async () => {
      const mockUsers = [
        createMockUser({ id: 'user-1', username: 'john' }),
        createMockUser({ id: 'user-2', username: 'jane' }),
      ];

      vi.mocked(usersRepository.search).mockResolvedValue({
        users: mockUsers,
        total: 2,
      });

      const result = await usersService.searchUsers({
        q: 'j',
        limit: 20,
        offset: 0,
      });

      expect(result).toEqual({
        users: [
          {
            id: 'user-1',
            username: 'john',
            displayName: 'Test User',
            avatarUrl: 'https://example.com/avatar.jpg',
            identityVerified: false,
          },
          {
            id: 'user-2',
            username: 'jane',
            displayName: 'Test User',
            avatarUrl: 'https://example.com/avatar.jpg',
            identityVerified: false,
          },
        ],
        total: 2,
        limit: 20,
        offset: 0,
      });
    });

    it('should return empty results for no matches', async () => {
      vi.mocked(usersRepository.search).mockResolvedValue({
        users: [],
        total: 0,
      });

      const result = await usersService.searchUsers({
        q: 'nonexistent',
        limit: 20,
        offset: 0,
      });

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should pass pagination params to repository', async () => {
      vi.mocked(usersRepository.search).mockResolvedValue({
        users: [],
        total: 0,
      });

      await usersService.searchUsers({
        q: 'test',
        limit: 10,
        offset: 50,
      });

      expect(usersRepository.search).toHaveBeenCalledWith('test', 10, 50);
    });
  });
});
