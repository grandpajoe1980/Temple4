import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit';
import { ActionType } from '@/types';
import { logger } from '@/lib/logger';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password too long'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        message: 'Validation failed',
        errors: validation.error.issues.map(e => ({ field: e.path[0], message: e.message }))
      }, { status: 400 });
    }

    const { token, password } = validation.data;

    // Find the token in database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json({ message: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Check if token has been used
    if (resetToken.used) {
      return NextResponse.json({ message: 'This reset token has already been used' }, { status: 400 });
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json({ message: 'This reset token has expired' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { used: true },
      }),
    ]);

    // Log audit event
    await logAuditEvent({
      actorUserId: resetToken.userId,
      actionType: ActionType.USER_PROFILE_UPDATED,
      entityType: 'USER',
      entityId: resetToken.userId,
      metadata: { action: 'password_reset' },
    });

    logger.info('Password reset successful', {
      userId: resetToken.userId,
      email: resetToken.user.email,
    });

    return NextResponse.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error('Reset password error', { error });
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
