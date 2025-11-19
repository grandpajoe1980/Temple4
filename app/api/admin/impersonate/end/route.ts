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
    const sessionIdFromClient = (session.user as any).impersonationSessionId as string | undefined | null;

    let sessionIdToEnd = sessionIdFromClient ?? undefined;

    if (!sessionIdToEnd) {
      // Fallback to querying the active session to handle stale client state
      const activeSession = await getActiveImpersonation(userId);
      if (activeSession) {
        sessionIdToEnd = activeSession.id;
      }
    }

    if (!sessionIdToEnd) {
      return NextResponse.json(
        { message: 'No active impersonation session found' },
        { status: 400 }
      );
    }

    const result = await endImpersonation(sessionIdToEnd);

    if (!result.success && result.error !== 'Session already ended') {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.success ? 'Impersonation session ended' : 'Impersonation session was already closed'
    });
  } catch (error) {
    console.error('End impersonation error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
