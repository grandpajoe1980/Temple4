/**
 * Email Helper Functions - High-level functions for sending common email types
 */

import { sendEmail } from './email';
import {
  passwordResetEmail,
  notificationEmail,
  welcomeEmail,
  membershipApprovedEmail,
  campaignEmail,
  type PasswordResetEmailData,
  type NotificationEmailData,
  type WelcomeEmailData,
  type MembershipApprovalEmailData,
  type CampaignEmailData,
} from './email-templates';

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  const { html, text } = passwordResetEmail(data);
  
  return sendEmail({
    to: data.user.email,
    subject: 'Password Reset Request - Temple',
    html,
    text,
  });
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(
  data: NotificationEmailData,
  recipientEmail: string,
  tenantId?: string
) {
  const { html, text } = notificationEmail(data);
  
  return sendEmail({
    to: recipientEmail,
    subject: `Notification: ${data.notification.title}`,
    html,
    text,
    tenantId,
  });
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const { html, text } = welcomeEmail(data);
  
  return sendEmail({
    to: data.user.email,
    subject: 'Welcome to Temple! 🎉',
    html,
    text,
  });
}

/**
 * Send membership approval notification
 */
export async function sendMembershipApprovedEmail(
  data: MembershipApprovalEmailData,
  recipientEmail: string,
  tenantId: string
) {
  const { html, text } = membershipApprovedEmail(data);
  
  return sendEmail({
    to: recipientEmail,
    subject: `Your membership to ${data.tenantName} has been approved`,
    html,
    text,
    tenantId,
  });
}

/**
 * Send email campaign to list of recipients
 */
export async function sendCampaignEmail(
  data: CampaignEmailData,
  recipients: string[],
  tenantId: string
) {
  const { html, text } = campaignEmail(data);
  
  // Send to all recipients (could be done in batches for large lists)
  const results = await Promise.allSettled(
    recipients.map(recipient =>
      sendEmail({
        to: recipient,
        subject: data.subject,
        html,
        text,
        tenantId,
      })
    )
  );
  
  // Aggregate results
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;
  
  return {
    total: results.length,
    successful,
    failed,
  };
}

/**
 * Send bulk notification emails (used for announcements)
 */
export async function sendBulkNotificationEmails(
  notification: NotificationEmailData['notification'],
  recipients: Array<{ email: string; displayName: string }>,
  tenantId?: string
) {
  const results = await Promise.allSettled(
    recipients.map(recipient =>
      sendNotificationEmail(
        {
          notification,
          recipientName: recipient.displayName,
        },
        recipient.email,
        tenantId
      )
    )
  );
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;
  
  return {
    total: results.length,
    successful,
    failed,
  };
}
