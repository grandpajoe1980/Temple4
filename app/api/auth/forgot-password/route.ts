import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email-helpers';

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
      include: {
        profile: true,
      },
    });

    if (user && user.profile) {
      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration to 30 minutes from now (security best practice)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      
      // Store token in database
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      // Send password reset email
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
      
      await sendPasswordResetEmail({
        user: {
          displayName: user.profile.displayName,
          email: user.email,
        },
        token,
        resetUrl,
      });

      console.log(`Password reset email sent to ${email}`);
    } else {
      console.log(`Password reset requested for non-existent email: ${email}. No action taken.`);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
