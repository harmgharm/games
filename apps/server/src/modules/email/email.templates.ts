/**
 * Email Templates
 *
 * HTML email templates for various email types.
 */

/**
 * Base email layout
 */
function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gaming Platform</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #f0f0f0;
    }
    .content {
      padding: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #4F46E5;
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 4px;
      color: #4F46E5;
      padding: 20px;
      background: #f8f8f8;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      border-top: 2px solid #f0f0f0;
      color: #666;
      font-size: 12px;
    }
    .muted {
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Gaming Platform</h1>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>This email was sent by Gaming Platform.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  </div>
</body>
</html>
`.trim();
}

/**
 * Verification email template
 */
export function verificationEmail(data: { username: string; verifyUrl: string; code: string }): {
  subject: string;
  html: string;
} {
  const content = `
    <h2>Verify your email address</h2>
    <p>Hi ${data.username},</p>
    <p>Thanks for signing up! Please verify your email address to complete your registration.</p>

    <p><a href="${data.verifyUrl}" class="button">Verify Email</a></p>

    <p>Or enter this code manually:</p>
    <div class="code">${data.code}</div>

    <p class="muted">This link and code will expire in 24 hours.</p>
    <p class="muted">If the button doesn't work, copy and paste this link into your browser:</p>
    <p class="muted" style="word-break: break-all;">${data.verifyUrl}</p>
  `;

  return {
    subject: 'Verify your email address',
    html: baseLayout(content),
  };
}

/**
 * Password reset email template
 */
export function passwordResetEmail(data: { username: string; resetUrl: string; code: string }): {
  subject: string;
  html: string;
} {
  const content = `
    <h2>Reset your password</h2>
    <p>Hi ${data.username},</p>
    <p>We received a request to reset your password. Click the button below to create a new password.</p>

    <p><a href="${data.resetUrl}" class="button">Reset Password</a></p>

    <p>Or enter this code manually:</p>
    <div class="code">${data.code}</div>

    <p class="muted">This link and code will expire in 1 hour.</p>
    <p class="muted">If you didn't request this, you can safely ignore this email.</p>
    <p class="muted">If the button doesn't work, copy and paste this link into your browser:</p>
    <p class="muted" style="word-break: break-all;">${data.resetUrl}</p>
  `;

  return {
    subject: 'Reset your password',
    html: baseLayout(content),
  };
}

/**
 * Welcome email template (sent after verification)
 */
export function welcomeEmail(data: { username: string; loginUrl: string }): {
  subject: string;
  html: string;
} {
  const content = `
    <h2>Welcome to Gaming Platform!</h2>
    <p>Hi ${data.username},</p>
    <p>Your email has been verified and your account is now fully activated.</p>

    <p>Here's what you can do next:</p>
    <ul>
      <li>Complete your profile</li>
      <li>Add friends and start chatting</li>
      <li>Join matches and compete</li>
      <li>Climb the leaderboards</li>
    </ul>

    <p><a href="${data.loginUrl}" class="button">Go to Dashboard</a></p>

    <p>Happy gaming!</p>
    <p>The Gaming Platform Team</p>
  `;

  return {
    subject: 'Welcome to Gaming Platform!',
    html: baseLayout(content),
  };
}

/**
 * Account recovery confirmation email template
 */
export function accountRecoveryEmail(data: { username: string; loginUrl: string }): {
  subject: string;
  html: string;
} {
  const content = `
    <h2>Account Recovered Successfully</h2>
    <p>Hi ${data.username},</p>
    <p>Your account has been successfully recovered and is now active again.</p>

    <p>All your data, including your:</p>
    <ul>
      <li>Match history and statistics</li>
      <li>Friends and social connections</li>
      <li>Achievements and rankings</li>
    </ul>

    <p>has been restored.</p>

    <p><a href="${data.loginUrl}" class="button">Log In</a></p>

    <p class="muted">If you didn't request this recovery, please contact support immediately.</p>

    <p>Welcome back!</p>
    <p>The Gaming Platform Team</p>
  `;

  return {
    subject: 'Account Recovered Successfully',
    html: baseLayout(content),
  };
}
