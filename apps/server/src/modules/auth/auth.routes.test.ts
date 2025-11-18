import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildServer } from '../../app';
import { emailTokenRepository } from '../email/email.repository';
import { sessionRepository, userRepository } from './auth.repository';
import { hashPassword } from './utils/password';

// Mock env before any imports that use it
vi.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3000,
    HOST: '0.0.0.0',
    LOG_LEVEL: 'silent',
    CORS_ORIGIN: 'http://localhost:3000',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-secret-key-for-testing-purposes-only',
    JWT_ISSUER: 'test',
    JWT_AUDIENCE: 'test',
  },
}));

// Mock the repositories
vi.mock('./auth.repository', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findByUsername: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateLastLogin: vi.fn(),
    updateLoginInfo: vi.fn(),
    updateEmailVerified: vi.fn(),
    updatePassword: vi.fn(),
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

// Mock the lockout service
vi.mock('./lockout.service', () => ({
  createLockoutService: vi.fn().mockReturnValue({
    checkLockout: vi.fn().mockResolvedValue({ isLocked: false }),
    recordFailedAttempt: vi.fn().mockResolvedValue({ isLocked: false }),
    clearFailedAttempts: vi.fn().mockResolvedValue(undefined),
    getFailedAttemptCount: vi.fn().mockResolvedValue(0),
  }),
  formatLockoutTime: vi.fn().mockImplementation((seconds) => `${seconds} seconds`),
}));

// Mock Redis using ioredis-mock
vi.mock('ioredis', async () => {
  const RedisMock = await import('ioredis-mock');
  return {
    default: RedisMock.default,
  };
});

// Mock the email repositories
vi.mock('../email/email.repository', () => ({
  hashToken: vi.fn().mockReturnValue(Buffer.from('mock-hash')),
  generateToken: vi.fn().mockReturnValue('mock-token-123'),
  generateCode: vi.fn().mockReturnValue('123456'),
  emailTokenRepository: {
    create: vi.fn().mockResolvedValue({
      id: 'token-123',
      user_id: 'user-123',
      type: 'verification',
      token_hash: Buffer.from('mock-hash'),
      code: '123456',
      expires_at: new Date(Date.now() + 86400000),
      created_at: new Date(),
      used_at: null,
    }),
    findByHash: vi.fn(),
    findByToken: vi.fn(),
    findByCode: vi.fn(),
    markUsed: vi.fn(),
    invalidateForUser: vi.fn(),
    deleteExpired: vi.fn(),
  },
}));

// Mock the email queue
vi.mock('../email/email.queue', () => ({
  createEmailQueue: vi.fn().mockReturnValue({
    queueVerificationEmail: vi.fn().mockResolvedValue(undefined),
    queuePasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    queueWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  }),
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
    display_name: null as string | null,
    bio: null as string | null,
    avatar_url: null as string | null,
    email_verified: false,
    identity_verified: false,
    last_login_at: null as Date | null,
    last_login_ip: null as string | null,
    login_count: 0,
    locked_until: null as Date | null,
    status: 'active' as const,
    is_public: true,
    created_at: new Date(),
    updated_at: new Date() as Date | null,
    deleted_at: null as Date | null,
    ...overrides,
  };
}

describe('auth routes', () => {
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

  describe('POST /api/v1/auth/register', () => {
    const validPayload = {
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

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: validPayload,
      });

      expect(response.statusCode).toBe(201);

      const body = JSON.parse(response.body);
      expect(body.data.user.id).toBe('user-123');
      expect(body.data.user.email).toBe('test@example.com');
      expect(body.data.accessToken).toBeDefined();
    });

    it('should return 400 for weak password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { ...validPayload, password: 'password' },
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('WEAK_PASSWORD');
    });

    it('should return 400 for invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { ...validPayload, email: 'invalid-email' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for short username', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { ...validPayload, username: 'ab' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 409 if email already exists', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        createMockUser({ id: 'existing', username: 'existing' }),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: validPayload,
      });

      expect(response.statusCode).toBe(409);

      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should set refresh token cookie', async () => {
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

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: validPayload,
      });

      const cookies = response.cookies;
      const refreshCookie = cookies.find((c) => c.name === 'refresh_token');

      expect(refreshCookie).toBeDefined();
      expect(refreshCookie?.httpOnly).toBe(true);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const loginPayload = {
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

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: loginPayload,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.data.user.id).toBe('user-123');
      expect(body.data.accessToken).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const passwordHash = await hashPassword('different-password');
      const mockUser = createMockUser({ password_hash: passwordHash });

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: loginPayload,
      });

      expect(response.statusCode).toBe(401);

      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent email', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: loginPayload,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const futureDate = new Date(Date.now() + 86_400_000);
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

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        cookies: {
          refresh_token: 'valid-refresh-token',
        },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.data.accessToken).toBeDefined();
    });

    it('should return 401 for missing refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-123',
        token_hash: 'hash',
        expires_at: new Date(),
        revoked_at: null,
        created_at: new Date(),
      };

      vi.mocked(sessionRepository.findByTokenHash).mockResolvedValue(mockSession);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        cookies: {
          refresh_token: 'valid-token',
        },
      });

      expect(response.statusCode).toBe(204);
      expect(sessionRepository.revoke).toHaveBeenCalledWith('session-123');
    });

    it('should clear refresh token cookie', async () => {
      vi.mocked(sessionRepository.findByTokenHash).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        cookies: {
          refresh_token: 'any-token',
        },
      });

      expect(response.statusCode).toBe(204);

      const cookies = response.cookies;
      const refreshCookie = cookies.find((c) => c.name === 'refresh_token');
      expect(refreshCookie).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const mockToken = {
        id: 'token-123',
        user_id: 'user-123',
        type: 'verification' as const,
        token_hash: Buffer.from('mock-hash'),
        code: '123456',
        expires_at: new Date(Date.now() + 86400000),
        created_at: new Date(),
        used_at: null,
      };

      vi.mocked(emailTokenRepository.findByHash).mockResolvedValue(mockToken);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify-email',
        payload: { token: 'valid-token' },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.data.message).toBe('Email verified successfully');
      expect(userRepository.updateEmailVerified).toHaveBeenCalledWith('user-123', true);
      expect(emailTokenRepository.markUsed).toHaveBeenCalledWith('token-123');
    });

    it('should return 400 for invalid token', async () => {
      vi.mocked(emailTokenRepository.findByHash).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify-email',
        payload: { token: 'invalid-token' },
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 400 for expired token', async () => {
      const mockToken = {
        id: 'token-123',
        user_id: 'user-123',
        type: 'verification' as const,
        token_hash: Buffer.from('mock-hash'),
        code: '123456',
        expires_at: new Date(Date.now() - 86400000), // Expired
        created_at: new Date(),
        used_at: null,
      };

      vi.mocked(emailTokenRepository.findByHash).mockResolvedValue(mockToken);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify-email',
        payload: { token: 'expired-token' },
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('should return 400 for missing token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify-email',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return success for existing email', async () => {
      const mockUser = createMockUser();
      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/forgot-password',
        payload: { email: 'test@example.com' },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.data.message).toContain('password reset email has been sent');
      expect(emailTokenRepository.invalidateForUser).toHaveBeenCalledWith(
        'user-123',
        'password_reset',
      );
      expect(emailTokenRepository.create).toHaveBeenCalled();
    });

    it('should return success for non-existing email (prevent enumeration)', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/forgot-password',
        payload: { email: 'nonexistent@example.com' },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.data.message).toContain('password reset email has been sent');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/forgot-password',
        payload: { email: 'invalid-email' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const mockToken = {
        id: 'token-123',
        user_id: 'user-123',
        type: 'password_reset' as const,
        token_hash: Buffer.from('mock-hash'),
        code: '123456',
        expires_at: new Date(Date.now() + 3600000),
        created_at: new Date(),
        used_at: null,
      };

      const mockUser = createMockUser();

      vi.mocked(emailTokenRepository.findByHash).mockResolvedValue(mockToken);
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/reset-password',
        payload: {
          token: 'valid-token',
          password: 'NewStr0ngP@ssword!2024',
        },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.data.message).toBe('Password reset successfully');
      expect(userRepository.updatePassword).toHaveBeenCalled();
      expect(emailTokenRepository.markUsed).toHaveBeenCalledWith('token-123');
      expect(sessionRepository.revokeAllForUser).toHaveBeenCalledWith('user-123');
    });

    it('should return 400 for invalid token', async () => {
      vi.mocked(emailTokenRepository.findByHash).mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/reset-password',
        payload: {
          token: 'invalid-token',
          password: 'NewStr0ngP@ssword!2024',
        },
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 400 for weak password', async () => {
      const mockToken = {
        id: 'token-123',
        user_id: 'user-123',
        type: 'password_reset' as const,
        token_hash: Buffer.from('mock-hash'),
        code: '123456',
        expires_at: new Date(Date.now() + 3600000),
        created_at: new Date(),
        used_at: null,
      };

      const mockUser = createMockUser();

      vi.mocked(emailTokenRepository.findByHash).mockResolvedValue(mockToken);
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/reset-password',
        payload: {
          token: 'valid-token',
          password: 'password123', // Common weak password
        },
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('WEAK_PASSWORD');
    });

    it('should return 400 for expired token', async () => {
      const mockToken = {
        id: 'token-123',
        user_id: 'user-123',
        type: 'password_reset' as const,
        token_hash: Buffer.from('mock-hash'),
        code: '123456',
        expires_at: new Date(Date.now() - 3600000), // Expired
        created_at: new Date(),
        used_at: null,
      };

      vi.mocked(emailTokenRepository.findByHash).mockResolvedValue(mockToken);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/reset-password',
        payload: {
          token: 'expired-token',
          password: 'NewStr0ngP@ssword!2024',
        },
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 without auth token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return user data with valid token', async () => {
      const mockUser = createMockUser({
        password_hash: 'hash',
        display_name: 'Test User',
        email_verified: true,
      });

      vi.mocked(userRepository.findById).mockResolvedValue(mockUser);

      // Generate a valid token
      const token = app.jwt.sign({ userId: 'user-123', email: 'test@example.com' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.data.id).toBe('user-123');
      expect(body.data.email).toBe('test@example.com');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
    });
  });
});
