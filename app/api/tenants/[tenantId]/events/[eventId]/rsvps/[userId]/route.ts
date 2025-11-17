import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';


// 10.8 Cancel RSVP
export async function DELETE(
  request: Request,
  { params }: { params: { tenantId: string; eventId: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;

  if (!currentUserId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  // Users can only cancel their own RSVP.
  // Admins could also be allowed, but for now, we'll keep it simple.
  if (currentUserId !== params.userId) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.eventRSVP.delete({
      where: {
        userId_eventId: {
          userId: params.userId,
          eventId: params.eventId,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // This will error if the RSVP doesn't exist, which is fine.
    console.error(`Failed to delete RSVP for user ${params.userId} from event ${params.eventId}:`, error);
    return NextResponse.json({ message: 'Failed to cancel RSVP' }, { status: 500 });
  }
}
