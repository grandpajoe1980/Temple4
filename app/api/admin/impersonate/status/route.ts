import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getActiveImpersonation } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const isSuperAdmin = (session.user as any).isSuperAdmin;
    if (!isSuperAdmin) {
      return NextResponse.json({ message: 'Forbidden - Super Admin access required' }, { status: 403 });
    }

    const userId = (session.user as any).realUserId || (session.user as any).id;

    // Get active impersonation session
    const activeSession = await getActiveImpersonation(userId);

    if (!activeSession) {
      return NextResponse.json({ 
        active: false,
        session: null 
      });
    }

    // Cast to include the effectiveUser relation
    const sessionWithUser = activeSession as typeof activeSession & {
      effectiveUser: {
        id: string;
        email: string;
        profile: {
          displayName: string;
        } | null;
      };
    };

    return NextResponse.json({ 
      active: true,
      session: {
        id: sessionWithUser.id,
        effectiveUser: {
          id: sessionWithUser.effectiveUser.id,
          email: sessionWithUser.effectiveUser.email,
          displayName: sessionWithUser.effectiveUser.profile?.displayName,
        },
        startedAt: sessionWithUser.startedAt,
        tenantId: sessionWithUser.tenantId,
      }
    });
  } catch (error) {
    console.error('Get impersonation status error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
