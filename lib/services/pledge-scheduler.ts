/**
 * Pledge Scheduler Service
 * 
 * This service processes recurring pledges by:
 * 1. Finding all pledges due for charging
 * 2. Attempting to process the charge
 * 3. Recording the charge result
 * 4. Updating the pledge status and next charge date
 * 5. Sending receipts or failure notices
 * 
 * In production, this would be triggered by a cron job or queue worker.
 */

import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// Calculate next charge date based on frequency
function calculateNextChargeDate(fromDate: Date, frequency: string): Date {
  const next = new Date(fromDate);
  switch (frequency) {
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

interface ProcessResult {
  pledgeId: string;
  success: boolean;
  transactionId?: string;
  error?: string;
}

/**
 * Mock payment processor - in production, this would integrate with Stripe/PayPal
 */
async function processPayment(
  paymentMethodToken: string | null,
  amountCents: number,
  currency: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  // Simulate payment processing
  // In production, this would call Stripe or another payment gateway
  
  if (!paymentMethodToken) {
    return { success: false, error: 'No payment method configured' };
  }

  // Simulate 95% success rate
  const isSuccess = Math.random() > 0.05;
  
  if (isSuccess) {
    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  } else {
    const errors = [
      'Card declined',
      'Insufficient funds',
      'Card expired',
      'Payment processing error',
    ];
    return {
      success: false,
      error: errors[Math.floor(Math.random() * errors.length)],
    };
  }
}

/**
 * Process a single pledge charge
 */
async function processPledge(pledgeId: string): Promise<ProcessResult> {
  const pledge = await prisma.pledge.findUnique({
    where: { id: pledgeId },
    include: {
      fund: true,
    },
  });

  if (!pledge) {
    return { pledgeId, success: false, error: 'Pledge not found' };
  }

  // Get tenant settings
  const settings = await prisma.pledgeSettings.findUnique({
    where: { tenantId: pledge.tenantId },
  });
  const maxFailures = settings?.maxFailuresBeforePause ?? 3;

  // Create a pending charge record
  const charge = await prisma.pledgeCharge.create({
    data: {
      pledgeId,
      amountCents: pledge.amountCents,
      currency: pledge.currency,
      status: 'PENDING',
    },
  });

  // Process the payment
  const result = await processPayment(
    pledge.paymentMethodToken,
    pledge.amountCents,
    pledge.currency
  );

  if (result.success) {
    // Update charge as successful
    await prisma.pledgeCharge.update({
      where: { id: charge.id },
      data: {
        status: 'SUCCESS',
        chargedAt: new Date(),
        transactionId: result.transactionId,
      },
    });

    // Create a donation record
    const user = await prisma.user.findUnique({
      where: { id: pledge.userId },
      include: { profile: true },
    });

    await prisma.donationRecord.create({
      data: {
        tenantId: pledge.tenantId,
        userId: pledge.userId,
        fundId: pledge.fundId,
        displayName: pledge.isAnonymous ? 'Anonymous' : (user?.profile?.displayName ?? 'Anonymous'),
        amount: pledge.amountCents / 100,
        currency: pledge.currency,
        isAnonymousOnLeaderboard: pledge.isAnonymous,
        designationNote: pledge.dedicationNote,
        message: `Recurring pledge payment`,
      },
    });

    // Update pledge with success info
    const nextChargeAt = calculateNextChargeDate(new Date(), pledge.frequency);
    
    // Check if pledge has reached its end date
    const shouldComplete = pledge.endDate && new Date(pledge.endDate) <= nextChargeAt;

    await prisma.pledge.update({
      where: { id: pledgeId },
      data: {
        lastChargedAt: new Date(),
        nextChargeAt: shouldComplete ? pledge.nextChargeAt : nextChargeAt,
        totalChargesCount: { increment: 1 },
        totalAmountCents: { increment: pledge.amountCents },
        failureCount: 0, // Reset failure count on success
        status: shouldComplete ? 'COMPLETED' : 'ACTIVE',
      },
    });

    // Send receipt email
    if (user?.email) {
      await sendReceiptEmail(user.email, pledge, result.transactionId!);
    }

    return { pledgeId, success: true, transactionId: result.transactionId };
  } else {
    // Update charge as failed
    await prisma.pledgeCharge.update({
      where: { id: charge.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: result.error,
        attemptCount: { increment: 1 },
      },
    });

    const newFailureCount = pledge.failureCount + 1;
    const shouldPause = newFailureCount >= maxFailures;

    // Update pledge with failure info
    await prisma.pledge.update({
      where: { id: pledgeId },
      data: {
        lastFailedAt: new Date(),
        lastFailureReason: result.error,
        failureCount: newFailureCount,
        status: shouldPause ? 'FAILED' : 'ACTIVE',
      },
    });

    // Send failure notification
    const user = await prisma.user.findUnique({
      where: { id: pledge.userId },
    });

    if (user?.email) {
      await sendFailureEmail(user.email, pledge, result.error!, shouldPause);
    }

    return { pledgeId, success: false, error: result.error };
  }
}

/**
 * Process all due pledges for a tenant or globally
 */
export async function processDuePledges(tenantId?: string): Promise<ProcessResult[]> {
  const now = new Date();

  const where: any = {
    status: 'ACTIVE',
    nextChargeAt: { lte: now },
  };

  if (tenantId) {
    where.tenantId = tenantId;
  }

  const duePledges = await prisma.pledge.findMany({
    where,
    orderBy: { nextChargeAt: 'asc' },
  });

  console.log(`Found ${duePledges.length} pledges due for processing`);

  const results: ProcessResult[] = [];

  for (const pledge of duePledges) {
    try {
      const result = await processPledge(pledge.id);
      results.push(result);
    } catch (error) {
      console.error(`Error processing pledge ${pledge.id}:`, error);
      results.push({
        pledgeId: pledge.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Retry failed pledges within the grace period
 */
export async function retryFailedPledges(tenantId?: string): Promise<ProcessResult[]> {
  const settings = tenantId
    ? await prisma.pledgeSettings.findUnique({ where: { tenantId } })
    : null;
  
  const retryIntervalHours = settings?.retryIntervalHours ?? 24;
  const retryThreshold = new Date();
  retryThreshold.setHours(retryThreshold.getHours() - retryIntervalHours);

  const where: any = {
    status: 'ACTIVE',
    failureCount: { gt: 0 },
    lastFailedAt: { lte: retryThreshold },
  };

  if (tenantId) {
    where.tenantId = tenantId;
  }

  const pledgesToRetry = await prisma.pledge.findMany({
    where,
    orderBy: { lastFailedAt: 'asc' },
  });

  console.log(`Found ${pledgesToRetry.length} pledges to retry`);

  const results: ProcessResult[] = [];

  for (const pledge of pledgesToRetry) {
    try {
      const result = await processPledge(pledge.id);
      results.push(result);
    } catch (error) {
      console.error(`Error retrying pledge ${pledge.id}:`, error);
      results.push({
        pledgeId: pledge.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// Email helper functions
async function sendReceiptEmail(
  email: string,
  pledge: any,
  transactionId: string
): Promise<void> {
  try {
    await sendEmail({
      to: email,
      subject: `Receipt for your recurring donation - ${pledge.fund?.name}`,
      text: `
Thank you for your recurring donation!

Amount: $${(pledge.amountCents / 100).toFixed(2)} ${pledge.currency}
Fund: ${pledge.fund?.name}
Transaction ID: ${transactionId}
Date: ${new Date().toLocaleDateString()}

Your next scheduled charge will be on ${new Date(pledge.nextChargeAt).toLocaleDateString()}.

Thank you for your continued support!
      `.trim(),
      html: `
<h2>Thank you for your recurring donation!</h2>
<p><strong>Amount:</strong> $${(pledge.amountCents / 100).toFixed(2)} ${pledge.currency}</p>
<p><strong>Fund:</strong> ${pledge.fund?.name}</p>
<p><strong>Transaction ID:</strong> ${transactionId}</p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p>Your next scheduled charge will be on ${new Date(pledge.nextChargeAt).toLocaleDateString()}.</p>
<p>Thank you for your continued support!</p>
      `.trim(),
    });
  } catch (error) {
    console.error('Failed to send receipt email:', error);
  }
}

async function sendFailureEmail(
  email: string,
  pledge: any,
  error: string,
  isPaused: boolean
): Promise<void> {
  try {
    const subject = isPaused
      ? `Action required: Your recurring donation has been paused`
      : `Payment issue with your recurring donation`;

    await sendEmail({
      to: email,
      subject,
      text: `
We were unable to process your recurring donation.

Amount: $${(pledge.amountCents / 100).toFixed(2)} ${pledge.currency}
Fund: ${pledge.fund?.name}
Reason: ${error}

${isPaused 
  ? 'Your recurring donation has been paused after multiple failed attempts. Please update your payment method to resume.'
  : 'We will automatically retry your payment. If the issue persists, please update your payment method.'}

Please log in to your account to update your payment information.
      `.trim(),
      html: `
<h2>Payment Issue</h2>
<p>We were unable to process your recurring donation.</p>
<p><strong>Amount:</strong> $${(pledge.amountCents / 100).toFixed(2)} ${pledge.currency}</p>
<p><strong>Fund:</strong> ${pledge.fund?.name}</p>
<p><strong>Reason:</strong> ${error}</p>
${isPaused 
  ? '<p><strong>Your recurring donation has been paused</strong> after multiple failed attempts. Please update your payment method to resume.</p>'
  : '<p>We will automatically retry your payment. If the issue persists, please update your payment method.</p>'}
<p>Please log in to your account to update your payment information.</p>
      `.trim(),
    });
  } catch (error) {
    console.error('Failed to send failure email:', error);
  }
}

// Export for API route to trigger manually
export { processPledge };
