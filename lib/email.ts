/**
 * Email Service - Provider abstraction for sending emails
 * 
 * Supports multiple providers:
 * - MOCK: For development and testing (logs to console)
 * - RESEND: For production (requires API key)
 * - SENDGRID: For production (requires API key)
 */

import { prisma } from './db';

// Email provider types
export type EmailProvider = 'MOCK' | 'RESEND' | 'SENDGRID';

// Email status types
export type EmailStatus = 'SENT' | 'FAILED' | 'BOUNCED';

// Email send options
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  tenantId?: string;
}

// Email send result
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email configuration from environment
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER as EmailProvider) || 'MOCK';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@temple.app';

/**
 * Mock email provider - logs emails to console
 */
async function sendWithMockProvider(options: SendEmailOptions): Promise<SendEmailResult> {
  console.log('📧 [MOCK EMAIL]');
  console.log('To:', options.to);
  console.log('From:', options.from || EMAIL_FROM);
  console.log('Subject:', options.subject);
  console.log('HTML:', options.html.substring(0, 200) + '...');
  if (options.text) {
    console.log('Text:', options.text.substring(0, 200) + '...');
  }
  console.log('---');
  
  return {
    success: true,
    messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  };
}

/**
 * Resend email provider
 * Documentation: https://resend.com/docs/send-with-nodejs
 */
async function sendWithResend(options: SendEmailOptions): Promise<SendEmailResult> {
  if (!EMAIL_API_KEY) {
    return {
      success: false,
      error: 'RESEND API key not configured',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to send email via Resend',
      };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * SendGrid email provider
 * Documentation: https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */
async function sendWithSendGrid(options: SendEmailOptions): Promise<SendEmailResult> {
  if (!EMAIL_API_KEY) {
    return {
      success: false,
      error: 'SENDGRID API key not configured',
    };
  }

  try {
    const recipients = Array.isArray(options.to) 
      ? options.to.map(email => ({ email }))
      : [{ email: options.to }];

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: recipients,
        }],
        from: {
          email: options.from || EMAIL_FROM,
        },
        subject: options.subject,
        content: [
          {
            type: 'text/html',
            value: options.html,
          },
          ...(options.text ? [{
            type: 'text/plain',
            value: options.text,
          }] : []),
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.errors?.[0]?.message || 'Failed to send email via SendGrid',
      };
    }

    // SendGrid returns 202 with no body on success
    const messageId = response.headers.get('x-message-id') || undefined;

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log email to database
 */
async function logEmail(
  options: SendEmailOptions,
  result: SendEmailResult,
  provider: EmailProvider
): Promise<void> {
  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    // Log each recipient separately
    for (const recipient of recipients) {
      await prisma.emailLog.create({
        data: {
          tenantId: options.tenantId || null,
          recipient,
          subject: options.subject,
          status: result.success ? 'SENT' : 'FAILED',
          provider,
          providerId: result.messageId || null,
          error: result.error || null,
        },
      });
    }
  } catch (error) {
    console.error('Failed to log email:', error);
    // Don't throw - logging failure shouldn't break email sending
  }
}

/**
 * Send an email using the configured provider
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  let result: SendEmailResult;

  // Select provider
  switch (EMAIL_PROVIDER) {
    case 'RESEND':
      result = await sendWithResend(options);
      break;
    case 'SENDGRID':
      result = await sendWithSendGrid(options);
      break;
    case 'MOCK':
    default:
      result = await sendWithMockProvider(options);
      break;
  }

  // Log to database
  await logEmail(options, result, EMAIL_PROVIDER);

  return result;
}

/**
 * Get email provider configuration info (for debugging)
 */
export function getEmailConfig() {
  return {
    provider: EMAIL_PROVIDER,
    fromAddress: EMAIL_FROM,
    apiKeyConfigured: !!EMAIL_API_KEY,
  };
}
