import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        message: 'Invalid email address' 
      }, { status: 400 });
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });

    if (user) {
      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      // Store token in database
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      // Send password reset email (Phase F3)
      try {
        const emailResult = await sendPasswordResetEmail({
          email: user.email,
          token,
          displayName: user.profile?.displayName,
        });

        if (!emailResult.success) {
          logger.error('Failed to send password reset email', {
            email: user.email,
            error: emailResult.error,
          });
        } else {
          logger.info('Password reset email sent', {
            email: user.email,
            providerId: emailResult.providerId,
          });
        }
      } catch (emailError) {
        logger.error('Error sending password reset email', {
          email: user.email,
          error: emailError,
        });
        // Don't fail the request if email fails - token is still created
      }
    } else {
      logger.info('Password reset requested for non-existent email', { email });
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    logger.error('Forgot password error', { error });
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
