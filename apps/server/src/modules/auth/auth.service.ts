/**
 * Auth Service
 *
 * Business logic for authentication.
 */

import { AppError } from '@games/types';
import type { LoginInput, RegisterInput } from '@games/validation';
import type { FastifyInstance } from 'fastify';

import { createEmailQueue } from '../email/email.queue';
import {
  emailTokenRepository,
  generateCode,
  generateToken,
  hashToken,
} from '../email/email.repository';
import { sessionRepository, userRepository } from './auth.repository';
import { checkPasswordStrength, hashPassword, needsRehash, verifyPassword } from './utils/password';
import {
  type AccessTokenPayload,
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashRefreshToken,
  TOKEN_EXPIRY,
} from './utils/token';

/**
 * Token expiry for verification email (24 hours)
 */
const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * Session metadata for tracking devices
 */
interface SessionMetadata {
  userAgent?: string | undefined;
  ip?: string | undefined;
}

/**
 * Auth service result types
 */
export interface AuthResult {
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiry: Date;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiry: Date;
}

/**
 * Register a new user
 */
export async function register(
  fastify: FastifyInstance,
  input: RegisterInput,
  _metadata: SessionMetadata,
): Promise<AuthResult> {
  // Check password strength
  const strength = checkPasswordStrength(input.password, [input.email, input.username]);
  if (!strength.isStrong) {
    throw new AppError(
      strength.feedback.warning === '' ? 'Password is too weak' : strength.feedback.warning,
      'WEAK_PASSWORD',
      400,
      true,
      { suggestions: strength.feedback.suggestions },
    );
  }

  // Check if email already exists
  const existingEmail = await userRepository.findByEmail(input.email);
  if (existingEmail !== undefined) {
    throw new AppError('Email is already registered', 'EMAIL_EXISTS', 409, true);
  }

  // Check if username already exists
  const existingUsername = await userRepository.findByUsername(input.username);
  if (existingUsername !== undefined) {
    throw new AppError('Username is already taken', 'USERNAME_EXISTS', 409, true);
  }

  // Hash password
  const passwordHash = await hashPassword(input.password);

  // Create user
  const user = await userRepository.create({
    email: input.email,
    username: input.username,
    password_hash: passwordHash,
    display_name: input.displayName ?? null,
  });

  // Generate tokens
  const accessToken = fastify.jwt.sign(
    { userId: user.id, email: user.email } satisfies AccessTokenPayload,
    { expiresIn: TOKEN_EXPIRY.ACCESS },
  );

  const refreshToken = generateRefreshToken();
  const refreshTokenExpiry = getRefreshTokenExpiry(false);

  // Create session
  await sessionRepository.create({
    user_id: user.id,
    token_hash: hashRefreshToken(refreshToken),
    expires_at: refreshTokenExpiry,
  });

  // Generate verification token and code
  const verificationToken = generateToken();
  const verificationCode = generateCode();

  // Create email token
  await emailTokenRepository.create({
    user_id: user.id,
    token_hash: hashToken(verificationToken),
    code: verificationCode,
    type: 'verification',
    expires_at: new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY),
  });

  // Queue verification email
  const emailQueue = createEmailQueue(fastify);
  await emailQueue.queueVerificationEmail(user.email, user.id, {
    username: user.username,
    token: verificationToken,
    code: verificationCode,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    },
    accessToken,
    refreshToken,
    refreshTokenExpiry,
  };
}

/**
 * Login a user
 */
export async function login(
  fastify: FastifyInstance,
  input: LoginInput,
  _metadata: SessionMetadata,
): Promise<AuthResult> {
  // Find user by email
  const user = await userRepository.findByEmail(input.email);
  if (user === undefined) {
    throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401, true);
  }

  // Verify password
  const isValid = await verifyPassword(user.password_hash, input.password);
  if (!isValid) {
    throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401, true);
  }

  // Check if password needs rehashing (Argon2 options changed)
  if (needsRehash(user.password_hash)) {
    const newHash = await hashPassword(input.password);
    await userRepository.create({ ...user, password_hash: newHash });
  }

  // Update last login
  await userRepository.updateLastLogin(user.id);

  // Generate tokens
  const accessToken = fastify.jwt.sign(
    { userId: user.id, email: user.email } satisfies AccessTokenPayload,
    { expiresIn: TOKEN_EXPIRY.ACCESS },
  );

  const refreshToken = generateRefreshToken();
  const refreshTokenExpiry = getRefreshTokenExpiry(input.rememberMe);

  // Create session
  await sessionRepository.create({
    user_id: user.id,
    token_hash: hashRefreshToken(refreshToken),
    expires_at: refreshTokenExpiry,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    },
    accessToken,
    refreshToken,
    refreshTokenExpiry,
  };
}

/**
 * Refresh access token
 */
export async function refresh(
  fastify: FastifyInstance,
  refreshToken: string,
): Promise<RefreshResult> {
  // Find session by token hash
  const tokenHash = hashRefreshToken(refreshToken);
  const session = await sessionRepository.findByTokenHash(tokenHash);

  if (session === undefined) {
    throw new AppError('Invalid or expired refresh token', 'INVALID_TOKEN', 401, true);
  }

  // Check if session is expired
  if (session.expires_at < new Date()) {
    await sessionRepository.revoke(session.id);
    throw new AppError('Refresh token has expired', 'TOKEN_EXPIRED', 401, true);
  }

  // Get user
  const user = await userRepository.findById(session.user_id);
  if (user === undefined) {
    await sessionRepository.revoke(session.id);
    throw new AppError('User not found', 'USER_NOT_FOUND', 401, true);
  }

  // Revoke old session (token rotation)
  await sessionRepository.revoke(session.id);

  // Generate new tokens
  const accessToken = fastify.jwt.sign(
    { userId: user.id, email: user.email } satisfies AccessTokenPayload,
    { expiresIn: TOKEN_EXPIRY.ACCESS },
  );

  const newRefreshToken = generateRefreshToken();
  // Calculate remaining time for new token (preserve original expiry intent)
  const remainingMs = session.expires_at.getTime() - Date.now();
  const newExpiry = new Date(Date.now() + remainingMs);

  // Create new session
  await sessionRepository.create({
    user_id: user.id,
    token_hash: hashRefreshToken(newRefreshToken),
    expires_at: newExpiry,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    refreshTokenExpiry: newExpiry,
  };
}

/**
 * Logout (revoke session)
 */
export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(refreshToken);
  const session = await sessionRepository.findByTokenHash(tokenHash);

  if (session !== undefined) {
    await sessionRepository.revoke(session.id);
  }
}

/**
 * Get current user by ID
 */
export async function getCurrentUser(userId: string) {
  const user = await userRepository.findById(userId);

  if (user === undefined) {
    throw new AppError('User not found', 'USER_NOT_FOUND', 404, true);
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    emailVerified: user.email_verified,
    isVerified: user.is_verified,
    createdAt: user.created_at,
  };
}
