/**
 * Users Routes Tests
 *
 * Tests for user profile HTTP endpoints.
 */

import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildServer } from '../../app.js';
import { usersRepository } from './users.repository.js';

// Mock Redis using ioredis-mock
vi.mock('ioredis', async () => {
  const RedisMock = await import('ioredis-mock');
  return {
    default: RedisMock.default,
  };
});

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

describe('users routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return public user profile', async () => {
      const mockUser = createMockUser();
      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/user-123',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.data).toMatchObject({
        id: 'user-123',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'Test bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        identityVerified: false,
      });
      expect(body.error).toBeNull();
      expect(body.meta).toHaveProperty('timestamp');
    });

    it('should return 404 for non-existent user', async () => {
      vi.mocked(usersRepository.findById).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/unknown',
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body);
      expect(body.error).toMatchObject({
        code: 'USER_NOT_FOUND',
      });
    });

    it('should return 403 for private profile', async () => {
      const mockUser = createMockUser({ is_public: false });
      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/user-123',
      });

      expect(response.statusCode).toBe(403);

      const body = JSON.parse(response.body);
      expect(body.error).toMatchObject({
        code: 'PROFILE_PRIVATE',
      });
    });

    it('should return 404 for banned user', async () => {
      const mockUser = createMockUser({ status: 'banned' });
      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/user-123',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/users/search', () => {
    it('should return search results', async () => {
      const mockUsers = [
        createMockUser({ id: 'user-1', username: 'john' }),
        createMockUser({ id: 'user-2', username: 'jane' }),
      ];

      vi.mocked(usersRepository.search).mockResolvedValue({
        users: mockUsers,
        total: 2,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/search?q=j',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.data.users).toHaveLength(2);
      expect(body.data.total).toBe(2);
      expect(body.data.limit).toBe(20);
      expect(body.data.offset).toBe(0);
    });

    it('should support pagination params', async () => {
      vi.mocked(usersRepository.search).mockResolvedValue({
        users: [],
        total: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/search?q=test&limit=10&offset=20',
      });

      expect(response.statusCode).toBe(200);
      expect(usersRepository.search).toHaveBeenCalledWith('test', 10, 20);
    });

    it('should return 400 for missing query', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/search',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return own profile with valid token', async () => {
      const mockUser = createMockUser();
      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);

      // Generate a valid JWT token
      const token = app.jwt.sign({ userId: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.data).toMatchObject({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        emailVerified: true,
        isPublic: true,
        status: 'active',
        loginCount: 5,
      });
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users/me',
        payload: { displayName: 'New Name' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should update profile with valid token', async () => {
      const mockUser = createMockUser();
      const updatedUser = createMockUser({ display_name: 'New Name' });

      vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(usersRepository.updateProfile).mockResolvedValue(updatedUser);

      const token = app.jwt.sign({ userId: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: { displayName: 'New Name' },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.data.displayName).toBe('New Name');
    });

    it('should validate avatar URL format', async () => {
      const token = app.jwt.sign({ userId: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: { avatarUrl: 'not-a-url' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate bio length', async () => {
      const token = app.jwt.sign({ userId: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: { bio: 'a'.repeat(501) },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
