/**
 * Email Service
 *
 * Handles sending emails via Postmark (console.log in development).
 */

import { createLogger } from '@games/utils';
import { ServerClient } from 'postmark';

import { env } from '../../config/env';
import { passwordResetEmail, verificationEmail, welcomeEmail } from './email.templates';

const log = createLogger('Email');

// Initialize Postmark client (only if API key is provided)
const postmarkClient =
  env.POSTMARK_API_KEY !== undefined && env.POSTMARK_API_KEY !== ''
    ? new ServerClient(env.POSTMARK_API_KEY)
    : null;

/**
 * Send an email
 */
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // In development, log to console
  if (env.NODE_ENV === 'development' || postmarkClient === null) {
    log.info('\n========== EMAIL ==========');
    log.info(`To: ${to}`);
    log.info(`Subject: ${subject}`);
    log.info('HTML: [See below]');
    log.info('================================\n');
    // Log a simplified version of the HTML
    const textContent = html
      .replaceAll(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // eslint-disable-next-line sonarjs/slow-regex -- Dev-only logging, safe for controlled HTML
      .replaceAll(/<[^>]*>/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();
    log.info(textContent);
    log.info('\n================================\n');
    return;
  }

  // Send via Postmark in production
  await postmarkClient.sendEmail({
    From: env.EMAIL_FROM,
    To: to,
    Subject: subject,
    HtmlBody: html,
  });
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  to: string,
  data: {
    username: string;
    token: string;
    code: string;
  },
): Promise<void> {
  const verifyUrl = `${env.APP_URL}/verify-email?token=${data.token}`;
  const email = verificationEmail({
    username: data.username,
    verifyUrl,
    code: data.code,
  });

  await sendEmail(to, email.subject, email.html);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  data: {
    username: string;
    token: string;
    code: string;
  },
): Promise<void> {
  const resetUrl = `${env.APP_URL}/reset-password?token=${data.token}`;
  const email = passwordResetEmail({
    username: data.username,
    resetUrl,
    code: data.code,
  });

  await sendEmail(to, email.subject, email.html);
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  to: string,
  data: {
    username: string;
  },
): Promise<void> {
  const loginUrl = `${env.APP_URL}/dashboard`;
  const email = welcomeEmail({
    username: data.username,
    loginUrl,
  });

  await sendEmail(to, email.subject, email.html);
}
