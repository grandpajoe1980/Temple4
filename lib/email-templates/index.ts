/**
 * Email Templates - Helper functions for generating email HTML
 */

import type { User } from '@prisma/client';
import type { Notification } from '@prisma/client';

/**
 * Base email template wrapper
 */
function baseTemplate(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #f59e0b;
    }
    .header h1 {
      margin: 0;
      color: #f59e0b;
      font-size: 28px;
    }
    .content {
      margin-bottom: 32px;
    }
    .button {
      display: inline-block;
      padding: 12px 32px;
      background-color: #f59e0b;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      background-color: #d97706;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏛️ Temple</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent by Temple Platform</p>
      <p>If you didn't request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Password Reset Email Template
 */
export interface PasswordResetEmailData {
  user: Pick<User, 'displayName' | 'email'>;
  token: string;
  resetUrl: string;
}

export function passwordResetEmail(data: PasswordResetEmailData): { html: string; text: string } {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hi ${data.user.displayName},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center;">
      <a href="${data.resetUrl}" class="button">Reset Password</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6b7280;">${data.resetUrl}</p>
    <p><strong>This link will expire in 30 minutes.</strong></p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  `;

  const text = `
Password Reset Request

Hi ${data.user.displayName},

We received a request to reset your password. Click the link below to create a new password:

${data.resetUrl}

This link will expire in 30 minutes.

If you didn't request a password reset, you can safely ignore this email.

---
Temple Platform
`;

  return {
    html: baseTemplate('Password Reset', content),
    text,
  };
}

/**
 * Notification Email Template
 */
export interface NotificationEmailData {
  notification: Pick<Notification, 'title' | 'body' | 'actionUrl'>;
  recipientName: string;
}

export function notificationEmail(data: NotificationEmailData): { html: string; text: string } {
  const content = `
    <h2>📬 New Notification</h2>
    <p>Hi ${data.recipientName},</p>
    <h3>${data.notification.title}</h3>
    <p>${data.notification.body}</p>
    ${data.notification.actionUrl ? `
      <div style="text-align: center;">
        <a href="${data.notification.actionUrl}" class="button">View Details</a>
      </div>
    ` : ''}
  `;

  const text = `
New Notification

Hi ${data.recipientName},

${data.notification.title}

${data.notification.body}

${data.notification.actionUrl ? `View details: ${data.notification.actionUrl}` : ''}

---
Temple Platform
`;

  return {
    html: baseTemplate('New Notification', content),
    text,
  };
}

/**
 * Welcome Email Template
 */
export interface WelcomeEmailData {
  user: Pick<User, 'displayName' | 'email'>;
  loginUrl: string;
}

export function welcomeEmail(data: WelcomeEmailData): { html: string; text: string } {
  const content = `
    <h2>Welcome to Temple! 🎉</h2>
    <p>Hi ${data.user.displayName},</p>
    <p>Thank you for joining Temple, the platform for religious communities to connect and grow together.</p>
    <p>Your account has been created successfully. You can now:</p>
    <ul style="line-height: 2;">
      <li>Explore and join faith communities</li>
      <li>Connect with members</li>
      <li>Participate in events and activities</li>
      <li>Access resources and content</li>
    </ul>
    <div style="text-align: center;">
      <a href="${data.loginUrl}" class="button">Get Started</a>
    </div>
    <p>We're excited to have you as part of our community!</p>
  `;

  const text = `
Welcome to Temple!

Hi ${data.user.displayName},

Thank you for joining Temple, the platform for religious communities to connect and grow together.

Your account has been created successfully. You can now:
- Explore and join faith communities
- Connect with members
- Participate in events and activities
- Access resources and content

Get started: ${data.loginUrl}

We're excited to have you as part of our community!

---
Temple Platform
`;

  return {
    html: baseTemplate('Welcome to Temple', content),
    text,
  };
}

/**
 * Membership Approval Email Template
 */
export interface MembershipApprovalEmailData {
  user: Pick<User, 'displayName'>;
  tenantName: string;
  tenantUrl: string;
}

export function membershipApprovedEmail(data: MembershipApprovalEmailData): { html: string; text: string } {
  const content = `
    <h2>✅ Membership Approved</h2>
    <p>Hi ${data.user.displayName},</p>
    <p>Great news! Your membership request to <strong>${data.tenantName}</strong> has been approved.</p>
    <p>You now have full access to:</p>
    <ul style="line-height: 2;">
      <li>Community posts and announcements</li>
      <li>Events and calendar</li>
      <li>Member directory</li>
      <li>Group conversations</li>
      <li>And more!</li>
    </ul>
    <div style="text-align: center;">
      <a href="${data.tenantUrl}" class="button">Visit Community</a>
    </div>
  `;

  const text = `
Membership Approved

Hi ${data.user.displayName},

Great news! Your membership request to ${data.tenantName} has been approved.

You now have full access to:
- Community posts and announcements
- Events and calendar
- Member directory
- Group conversations
- And more!

Visit community: ${data.tenantUrl}

---
Temple Platform
`;

  return {
    html: baseTemplate('Membership Approved', content),
    text,
  };
}

/**
 * Email Campaign Template
 */
export interface CampaignEmailData {
  subject: string;
  bodyHtml: string;
  tenantName: string;
  unsubscribeUrl?: string;
}

export function campaignEmail(data: CampaignEmailData): { html: string; text: string } {
  const content = `
    <div style="margin-bottom: 16px; color: #6b7280; font-size: 14px;">
      Message from ${data.tenantName}
    </div>
    ${data.bodyHtml}
    ${data.unsubscribeUrl ? `
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
        <p><a href="${data.unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe from these emails</a></p>
      </div>
    ` : ''}
  `;

  const text = `
Message from ${data.tenantName}

${data.bodyHtml.replace(/<[^>]+>/g, '')}

${data.unsubscribeUrl ? `\nUnsubscribe: ${data.unsubscribeUrl}` : ''}

---
Temple Platform
`;

  return {
    html: baseTemplate(data.subject, content),
    text,
  };
}
