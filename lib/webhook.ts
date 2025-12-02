/**
 * Webhook Service
 * 
 * Provides webhook notification capabilities for external integrations.
 * Used by donations and other features to notify external systems.
 */

import { logger } from './logger';
import { prisma } from './db';

// ===== Types =====

export interface WebhookConfig {
  url: string;
  secret?: string;
  enabled: boolean;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  tenantId: string;
  data: Record<string, any>;
}

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  error?: string;
}

// ===== Webhook Events =====

export const WebhookEvents = {
  DONATION_CREATED: 'donation.created',
  DONATION_UPDATED: 'donation.updated',
  MEMBER_APPROVED: 'member.approved',
  MEMBER_REJECTED: 'member.rejected',
  FUND_CREATED: 'fund.created',
  FUND_UPDATED: 'fund.updated',
  FUND_ARCHIVED: 'fund.archived',
} as const;

export type WebhookEvent = typeof WebhookEvents[keyof typeof WebhookEvents];

// ===== Configuration =====

/**
 * Get webhook configuration for a tenant from donation settings.
 * Webhook URL is stored in tenant settings donationSettings JSON.
 */
export async function getWebhookConfig(tenantId: string): Promise<WebhookConfig | null> {
  try {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      return null;
    }

    const donationSettings = settings.donationSettings as Record<string, any> | null;
    
    if (!donationSettings?.webhookUrl) {
      return null;
    }

    return {
      url: donationSettings.webhookUrl,
      secret: donationSettings.webhookSecret,
      enabled: donationSettings.webhookEnabled !== false, // Default to enabled if URL exists
    };
  } catch (error) {
    logger.error('Failed to get webhook config', { tenantId, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

// ===== Signature Generation =====

/**
 * Generate HMAC signature for webhook payload.
 * Uses SHA-256 and returns hex-encoded signature.
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ===== Core Webhook Service =====

/**
 * Send a webhook to the configured endpoint.
 * Includes signature header if secret is configured.
 */
export async function sendWebhook(
  tenantId: string,
  event: WebhookEvent,
  data: Record<string, any>
): Promise<WebhookResult> {
  const config = await getWebhookConfig(tenantId);

  if (!config || !config.enabled || !config.url) {
    logger.debug('Webhook skipped - not configured or disabled', { tenantId, event });
    return { success: true }; // Not an error - just not configured
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    tenantId,
    data,
  };

  const payloadString = JSON.stringify(payload);

  logger.info('Sending webhook', { tenantId, event, url: config.url });

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event,
      'X-Webhook-Timestamp': payload.timestamp,
    };

    // Add signature header if secret is configured
    if (config.secret) {
      const signature = await generateSignature(payloadString, config.secret);
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.error('Webhook request failed', {
        tenantId,
        event,
        statusCode: response.status,
        error: errorText,
      });

      return {
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    logger.info('Webhook sent successfully', { tenantId, event, statusCode: response.status });

    return {
      success: true,
      statusCode: response.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Webhook send error', {
      tenantId,
      event,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ===== Convenience Methods =====

/**
 * Send a donation created webhook.
 */
export async function sendDonationCreatedWebhook(
  tenantId: string,
  donation: {
    id: string;
    amount: number;
    currency: string;
    fundId: string;
    fundName?: string;
    displayName: string;
    isAnonymous: boolean;
    donatedAt: Date | string;
  }
): Promise<WebhookResult> {
  return sendWebhook(tenantId, WebhookEvents.DONATION_CREATED, {
    donationId: donation.id,
    amount: donation.amount,
    currency: donation.currency,
    fundId: donation.fundId,
    fundName: donation.fundName,
    displayName: donation.isAnonymous ? 'Anonymous' : donation.displayName,
    isAnonymous: donation.isAnonymous,
    donatedAt: typeof donation.donatedAt === 'string' ? donation.donatedAt : donation.donatedAt.toISOString(),
  });
}

/**
 * Send a member approved webhook.
 */
export async function sendMemberApprovedWebhook(
  tenantId: string,
  member: {
    userId: string;
    displayName?: string;
    email?: string;
  }
): Promise<WebhookResult> {
  return sendWebhook(tenantId, WebhookEvents.MEMBER_APPROVED, {
    userId: member.userId,
    displayName: member.displayName,
    email: member.email,
    approvedAt: new Date().toISOString(),
  });
}

export default {
  sendWebhook,
  sendDonationCreatedWebhook,
  sendMemberApprovedWebhook,
  getWebhookConfig,
  WebhookEvents,
};
