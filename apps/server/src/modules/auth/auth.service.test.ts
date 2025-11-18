/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable sonarjs/no-hardcoded-passwords */
/* eslint-disable unicorn/no-useless-undefined */
import { AppError } from '@games/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sessionRepository, userRepository } from './auth.repository';
import * as authService from './auth.service';
import { hashPassword } from './utils/password';

// Mock the repositories
vi.mock('./auth.repository', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findByUsername: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateLastLogin: vi.fn(),
  },
  sessionRepository: {
    create: vi.fn(),
    findByTokenHash: vi.fn(),
    findActiveByUserId: vi.fn(),
    revoke: vi.fn(),
    revokeAllForUser: vi.fn(),
    deleteExpired: vi.fn(),
  },
}));

// Helper to create complete mock user objects
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
    is_verified: boolean;
    last_login_at: Date | null;
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
    display_name: null as string | null,
    bio: null as string | null,
    avatar_url: null as string | null,
    email_verified: false,
    is_verified: false,
    last_login_at: null as Date | null,
    created_at: new Date(),
    updated_at: new Date() as Date | null,
    deleted_at: null as Date | null,
    ...overrides,
  };
}

// Mock fastify instance
const mockFastify = {
  jwt: {
    sign: vi.fn().mockReturnValue('mock-access-token'),
  },
} as unknown as Parameters<typeof authService.register>[0];

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    const validInput = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'StrongP@ssw0rd!2024',
      displayName: 'Test User',
    };

    it('should register a new user successfully', async () => {
      const mockUser = createMockUser({ display_name: 'Test User' });

      vi.mocked(userRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(userRepository.findByUsername).mockResolvedValue(undefined);
      vi.mocked(userRepository.create).mockResolvedValue(mockUser);
      vi.mocked(sessionRepository.create).mockResolvedValue({
        id: 'session-123',
        user_id: 'user-123',
        token_hash: 'hash',
        expires_at: new Date(),
        revoked_at: null,
        created_at: new Date(),
      });

      const result = await authService.register(mockFastify, validInput, {});

      expect(result.user.id).toBe('user-123');
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toHaveLength(64);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          username: 'testuser',
        }),
      );
    });

    it('should throw error for weak password', async () => {
      const weakInput = { ...validInput, password: '123456' };

      await expect(authService.register(mockFastify, weakInput, {})).rejects.toThrow(AppError);
      await expect(authService.register(mockFastify, weakInput, {})).rejects.toMatchObject({
        code: 'WEAK_PASSWORD',
        statusCode: 400,
      });
    });

    it('should throw error if email already exists', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        createMockUser({ id: 'existing-user', username: 'existing', password_hash: 'hash' }),
      );

      await expect(authService.register(mockFastify, validInput, {})).rejects.toMatchObject({
        code: 'EMAIL_EXISTS',
        statusCode: 409,
      });
    });

    it('should throw error if username already exists', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(userRepository.findByUsername).mockResolvedValue(
        createMockUser({ id: 'existing-user', email: 'other@example.com', password_hash: 'hash' }),
      );

      await expect(authService.register(mockFastify, validInput, {})).rejects.toMatchObject({
        code: 'USERNAME_EXISTS',
        statusCode: 409,
      });
    });
  });

  describe('login', () => {
    const loginInput = {
      email: 'test@example.com',
      password: 'correct-password',
      rememberMe: false,
    };

    it('should login successfully with correct credentials', async () => {
      const passwordHash = await hashPassword('correct-password');
      const mockUser = createMockUser({
        password_hash: passwordHash,
        display_name: 'Test User',
      });

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(sessionRepository.create).mockResolvedValue({
        id: 'session-123',
        user_id: 'user-123',
        token_hash: 'hash',
        expires_at: new Date(),
        revoked_at: null,
        created_at: new Date(),
      });

      const result = await authService.login(mockFastify, loginInput, {});

      expect(result.user.id).toBe('user-123');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toHaveLength(64);
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith('user-123');
    });

    it('should throw error for non-existent email', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(undefined);

      await expect(authService.login(mockFastify, loginInput, {})).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        statusCode: 401,
      });
    });

    it('should throw error for wrong password', async () => {
      const mockUser = createMockUser({
        password_hash: await hashPassword('different-password'),
      });

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);

      await expect(authService.login(mockFastify, loginInput, {})).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        statusCode: 401,
      });
    });

    it('should use remember me expiry when flag is set', async () => {
      const passwordHash = await hashPassword('correct-password');
      const mockUser = createMockUser({ password_hash: passwordHash });

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(sessionRepository.create).mockResolvedValue({
        id: 'session-123',
        user_id: 'user-123',
        token_hash: 'hash',
        expires_at: new Date(),
        revoked_at: null,
        created_at: new Date(),
      });

      const result = await authService.login(mockFastify, { ...loginInput, rememberMe: true }, {});

      // Check that expiry is approximately 30 days from now
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const expectedExpiry = Date.now() + thirtyDaysMs;
      const actualExpiry = result.refreshTokenExpiry.getTime();

      expect(actualExpiry).toBeGreaterThan(expectedExpiry - 1000);
      expect(actualExpiry).toBeLessThan(expectedExpiry + 1000);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const futureDate = new Date(Date.now() + 86_400_000); // 1 day from now
      const mockSession = {
        id: 'session-123',
        user_id: 'user-123',
        token_hash: 'hash',
        expires_at: futureDate,
        revoked_at: null,
        created_at: new Date(),
      };

      const mockUser = createMockUser({ password_hash: 'hash' });

      vi.mocked(sessionRepository.findByTokenHash).mockResolvedValue(mockSession);
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(sessionRepository.create).mockResolvedValue({
        ...mockSession,
        id: 'new-session',
      });

      const result = await authService.refresh(mockFastify, 'valid-refresh-token');

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toHaveLength(64);
      expect(sessionRepository.revoke).toHaveBeenCalledWith('session-123');
      expect(sessionRepository.create).toHaveBeenCalled();
    });

    it('should throw error for invalid token', async () => {
      vi.mocked(sessionRepository.findByTokenHash).mockResolvedValue(undefined);

      await expect(authService.refresh(mockFastify, 'invalid-token')).rejects.toMatchObject({
        code: 'INVALID_TOKEN',
        statusCode: 401,
      });
    });

    it('should throw error for expired token', async () => {
      const pastDate = new Date(Date.now() - 86_400_000); // 1 day ago
      const mockSession = {
        id: 'session-123',
        user_id: 'user-123',
        token_hash: 'hash',
        expires_at: pastDate,
        revoked_at: null,
        created_at: new Date(),
      };

      vi.mocked(sessionRepository.findByTokenHash).mockResolvedValue(mockSession);

      await expect(authService.refresh(mockFastify, 'expired-token')).rejects.toMatchObject({
        code: 'TOKEN_EXPIRED',
        statusCode: 401,
      });

      expect(sessionRepository.revoke).toHaveBeenCalledWith('session-123');
    });

    it('should throw error if user not found', async () => {
      const futureDate = new Date(Date.now() + 86_400_000);
      const mockSession = {
        id: 'session-123',
        user_id: 'user-123',
        token_hash: 'hash',
        expires_at: futureDate,
        revoked_at: null,
        created_at: new Date(),
      };

      vi.mocked(sessionRepository.findByTokenHash).mockResolvedValue(mockSession);
      vi.mocked(userRepository.findById).mockResolvedValue(undefined);

      await expect(authService.refresh(mockFastify, 'token')).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        statusCode: 401,
      });
    });
  });

  describe('logout', () => {
    it('should revoke session on logout', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-123',
        token_hash: 'hash',
        expires_at: new Date(),
        revoked_at: null,
        created_at: new Date(),
      };

      vi.mocked(sessionRepository.findByTokenHash).mockResolvedValue(mockSession);

      await authService.logout('valid-refresh-token');

      expect(sessionRepository.revoke).toHaveBeenCalledWith('session-123');
    });

    it('should not throw error for invalid token on logout', async () => {
      vi.mocked(sessionRepository.findByTokenHash).mockResolvedValue(undefined);

      await expect(authService.logout('invalid-token')).resolves.toBeUndefined();
      expect(sessionRepository.revoke).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data', async () => {
      const mockUser = createMockUser({
        password_hash: 'hash',
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        email_verified: true,
        is_verified: true,
        created_at: new Date('2024-01-01'),
      });

      vi.mocked(userRepository.findById).mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser('user-123');

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
      expect(result.displayName).toBe('Test User');
      expect(result.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(result.emailVerified).toBe(true);
      expect(result.isVerified).toBe(true);
      expect(result.createdAt).toEqual(new Date('2024-01-01'));
    });

    it('should throw error if user not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(undefined);

      await expect(authService.getCurrentUser('non-existent')).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        statusCode: 404,
      });
    });
  });
});
