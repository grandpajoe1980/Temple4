/**
 * Email Service (Phase F3)
 * 
 * Provides email sending capabilities with:
 * - Pluggable provider architecture (Resend, SendGrid, Mock)
 * - Template helpers for common email types
 * - Email logging for debugging and tracking
 * - Mock mode for development/testing
 */

import { prisma } from './db';
import { logger } from './logger';
import nodemailer from 'nodemailer';

// ===== Types =====

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tenantId?: string;
}

export interface EmailSendResult {
  success: boolean;
  providerId?: string;
  error?: string;
}

// ===== ENV-based SMTP (only supported provider) =====
async function sendViaEnvSmtp(params: SendEmailParams): Promise<EmailSendResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return { success: false, error: 'ENV SMTP not configured' };
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
  const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@temple.example.com';
  const fromName = process.env.SMTP_FROM_NAME || process.env.EMAIL_FROM_NAME || 'Temple Platform';

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    return { success: true, providerId: (info as any).messageId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ===== Core Email Service (SMTP only) =====
export async function sendEmail(params: SendEmailParams): Promise<EmailSendResult> {
  logger.info('Sending email', {
    to: params.to,
    subject: params.subject,
    provider: 'SMTP',
  });

  try {
    const result = await sendViaEnvSmtp(params);

    // Log the email attempt
    await prisma.emailLog.create({
      data: {
        tenantId: params.tenantId,
        recipient: params.to,
        subject: params.subject,
        status: result?.success ? 'SENT' : 'FAILED',
        provider: 'SMTP',
        providerId: result?.providerId,
        error: result?.error,
      },
    });

    if (!result?.success) {
      logger.error('Email send failed', { to: params.to, error: result?.error });
    }

    return result || { success: false, error: 'No provider result' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Email send error', { to: params.to, error: errorMessage });
    try {
      await prisma.emailLog.create({
        data: {
          tenantId: params.tenantId,
          recipient: params.to,
          subject: params.subject,
          status: 'FAILED',
          provider: 'SMTP',
          error: errorMessage,
        },
      });
    } catch (logError) {
      logger.error('Failed to log email error', { error: logError });
    }

    return { success: false, error: errorMessage };
  }
}

// ===== Template Helpers =====

/**
 * Send a password reset email to a user.
 */
export async function sendPasswordResetEmail(params: {
  email: string;
  token: string;
  displayName?: string;
}): Promise<EmailSendResult> {
  const { email, token, displayName } = params;
  const baseForReset = (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.includes('localhost'))
    ? 'http://asembli.org'
    : (process.env.NEXTAUTH_URL || 'http://asembli.org');

  const resetUrl = `${baseForReset}/auth/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f59e0b; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Temple Platform</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #1f2937;">Password Reset Request</h2>
          ${displayName ? `<p>Hi ${displayName},</p>` : '<p>Hi there,</p>'}
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #9ca3af; font-size: 12px; word-break: break-all;">${resetUrl}</p>
        </div>
      </body>
    </html>
  `;

  const text = `
    Temple Platform - Password Reset Request

    ${displayName ? `Hi ${displayName},` : 'Hi there,'}

    We received a request to reset your password. Click the link below to create a new password:

    ${resetUrl}

    If you didn't request this, you can safely ignore this email.
    This link will expire in 1 hour.
  `.trim();

  return sendEmail({
    to: email,
    subject: 'Reset Your Password',
    html,
    text,
  });
}

/**
 * Send a notification email to a user.
 */
export async function sendNotificationEmail(params: {
  email: string;
  displayName?: string;
  message: string;
  link?: string;
  tenantId?: string;
}): Promise<EmailSendResult> {
  const { email, displayName, message, link, tenantId } = params;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f59e0b; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Temple Platform</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #1f2937;">New Notification</h2>
          ${displayName ? `<p>Hi ${displayName},</p>` : '<p>Hi there,</p>'}
          <p>${message}</p>
          ${link ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Details</a>
            </div>
          ` : ''}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px;">You're receiving this because you have notifications enabled on Temple Platform.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
    Temple Platform - New Notification

    ${displayName ? `Hi ${displayName},` : 'Hi there,'}

    ${message}

    ${link ? `View details: ${link}` : ''}

    You're receiving this because you have notifications enabled on Temple Platform.
  `.trim();

  return sendEmail({
    to: email,
    subject: 'New Notification',
    html,
    text,
    tenantId,
  });
}

/**
 * Send a welcome email to a new user.
 */
export async function sendWelcomeEmail(params: {
  email: string;
  displayName?: string;
}): Promise<EmailSendResult> {
  const { email, displayName } = params;
  const loginUrl = `${process.env.NEXTAUTH_URL}/auth/login`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Temple Platform</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f59e0b; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Temple Platform</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #1f2937;">Welcome to Temple Platform!</h2>
          ${displayName ? `<p>Hi ${displayName},</p>` : '<p>Hi there,</p>'}
          <p>Thank you for joining Temple Platform! We're excited to have you as part of our community.</p>
          <p>With Temple Platform, you can:</p>
          <ul>
            <li>Connect with religious organizations worldwide</li>
            <li>Participate in events and activities</li>
            <li>Access sermons, books, and resources</li>
            <li>Engage with community members</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Get Started</a>
          </div>
          <p>If you have any questions, feel free to reach out to us.</p>
          <p>Best regards,<br>The Temple Platform Team</p>
        </div>
      </body>
    </html>
  `;

  const text = `
    Welcome to Temple Platform!

    ${displayName ? `Hi ${displayName},` : 'Hi there,'}

    Thank you for joining Temple Platform! We're excited to have you as part of our community.

    With Temple Platform, you can:
    - Connect with religious organizations worldwide
    - Participate in events and activities
    - Access sermons, books, and resources
    - Engage with community members

    Get started: ${loginUrl}

    If you have any questions, feel free to reach out to us.

    Best regards,
    The Temple Platform Team
  `.trim();

  return sendEmail({
    to: email,
    subject: 'Welcome to Temple Platform',
    html,
    text,
  });
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Send a welcome packet email to a new member.
 */
export async function sendWelcomePacketEmail(params: {
  email: string;
  displayName?: string;
  tenantName: string;
  welcomePacketUrl?: string | null;
  tenantId?: string;
}): Promise<EmailSendResult> {
  const { email, displayName, tenantName, welcomePacketUrl, tenantId } = params;

  // Sanitize all user-provided content
  const safeTenantName = escapeHtml(tenantName);
  const safeDisplayName = displayName ? escapeHtml(displayName) : undefined;
  const safeWelcomePacketUrl = welcomePacketUrl ? encodeURI(welcomePacketUrl) : null;

  const welcomePacketSection = safeWelcomePacketUrl
    ? `
      <div style="margin: 20px 0; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
        <h3 style="color: #92400e; margin: 0 0 10px 0;">📦 Welcome Packet</h3>
        <p style="margin: 0 0 15px 0;">We've prepared a welcome packet to help you get started:</p>
        <a href="${safeWelcomePacketUrl}" style="background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Welcome Packet</a>
      </div>
    `
    : '';

  const welcomePacketText = safeWelcomePacketUrl
    ? `\n\nWelcome Packet: ${safeWelcomePacketUrl}\n`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${safeTenantName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f59e0b; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${safeTenantName}</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #1f2937;">🎉 Your Membership Has Been Approved!</h2>
          ${safeDisplayName ? `<p>Hi ${safeDisplayName},</p>` : '<p>Hi there,</p>'}
          <p>Great news! Your membership request to <strong>${safeTenantName}</strong> has been approved. You're now an official member of our community!</p>
          ${welcomePacketSection}
          <p>As a member, you can now:</p>
          <ul>
            <li>Access member-only content and resources</li>
            <li>Participate in events and activities</li>
            <li>Connect with other members</li>
            <li>Receive important announcements</li>
          </ul>
          <p>We're excited to have you with us!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px;">You're receiving this because your membership at ${safeTenantName} was approved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
    Welcome to ${tenantName}!

    ${displayName ? `Hi ${displayName},` : 'Hi there,'}

    Great news! Your membership request to ${tenantName} has been approved. You're now an official member of our community!
    ${welcomePacketText}
    As a member, you can now:
    - Access member-only content and resources
    - Participate in events and activities
    - Connect with other members
    - Receive important announcements

    We're excited to have you with us!

    You're receiving this because your membership at ${tenantName} was approved.
  `.trim();

  return sendEmail({
    to: email,
    subject: `Welcome to ${tenantName}! Your Membership Has Been Approved`,
    html,
    text,
    tenantId,
  });
}

/**
 * Send bulk emails (stub for Phase G campaigns).
 * For now, this is a placeholder that sends individual emails.
 * In Phase G, this will be optimized for batch sending.
 */
export async function sendBulkEmail(params: {
  recipients: string[];
  subject: string;
  html: string;
  text?: string;
  tenantId?: string;
}): Promise<{ sent: number; failed: number }> {
  const { recipients, subject, html, text, tenantId } = params;
  
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendEmail({
      to: recipient,
      subject,
      html,
      text,
      tenantId,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  logger.info('Bulk email complete', { sent, failed, total: recipients.length });

  return { sent, failed };
}
