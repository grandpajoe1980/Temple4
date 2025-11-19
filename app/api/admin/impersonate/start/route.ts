import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { startImpersonation } from '@/lib/session';
import { z } from 'zod';

const startImpersonationSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
  tenantId: z.string().optional(),
  reason: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userId = (session.user as any).realUserId || (session.user as any).id;
    const isSuperAdmin = (session.user as any).isSuperAdmin;

    if (!isSuperAdmin) {
      return NextResponse.json({ 
        message: 'Only super admins can impersonate users' 
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate input
    const validation = startImpersonationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        message: 'Validation failed',
        errors: validation.error.issues.map(e => ({ field: e.path[0], message: e.message }))
      }, { status: 400 });
    }

    const { targetUserId, tenantId, reason } = validation.data;

    const result = await startImpersonation(userId, targetUserId, tenantId, reason);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      session: result.session 
    });
  } catch (error) {
    console.error('Start impersonation error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
