import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { endImpersonation, getActiveImpersonation } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userId = (session.user as any).realUserId || (session.user as any).id;

    // Get active impersonation session
    const activeSession = await getActiveImpersonation(userId);

    if (!activeSession) {
      return NextResponse.json({ 
        message: 'No active impersonation session found' 
      }, { status: 400 });
    }

    const result = await endImpersonation(activeSession.id);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Impersonation session ended' 
    });
  } catch (error) {
    console.error('End impersonation error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
