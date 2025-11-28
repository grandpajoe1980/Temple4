import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { RSVPStatus } from '@/types';
import { unauthorized, forbidden, validationError, handleApiError } from '@/lib/api-response';

const rsvpUpdateSchema = z.object({
    status: z.enum(['GOING', 'INTERESTED', 'NOT_GOING']),
});

// 10.8.1 Update RSVP Status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; eventId: string; userId: string }> }
) {
    const { eventId, tenantId, userId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!currentUserId) {
      return unauthorized();
    }

    // Users can only update their own RSVP
    if (currentUserId !== userId) {
      return forbidden('Forbidden');
    }

    try {
        const body = await request.json();
        const result = rsvpUpdateSchema.safeParse(body);
        if (!result.success) {
          return validationError(result.error.flatten().fieldErrors);
        }

        // Find existing RSVP (compound unique may be named differently after schema changes)
        const existing = await prisma.eventRSVP.findFirst({ where: { userId: userId, eventId } });
        if (!existing) return validationError({ rsvp: ['Not found'] });
        const updatedRsvp = await prisma.eventRSVP.update({ where: { id: existing.id }, data: { status: result.data.status as RSVPStatus } });
        return NextResponse.json(updatedRsvp);
    } catch (error) {
      console.error(`Failed to update RSVP for user ${userId} from event ${eventId}:`, error);
      return handleApiError(error, { route: 'PATCH /api/tenants/[tenantId]/events/[eventId]/rsvps/[userId]', tenantId, eventId, userId });
    }
}

// 10.8 Cancel RSVP
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; eventId: string; userId: string }> }
) {
    const { eventId, tenantId, userId } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;

  if (!currentUserId) {
    return unauthorized();
  }

  // Users can only cancel their own RSVP.
  // Admins could also be allowed, but for now, we'll keep it simple.
  if (currentUserId !== userId) {
    return forbidden('Forbidden');
  }

    try {
      const existing = await prisma.eventRSVP.findFirst({ where: { userId: userId, eventId } });
      if (!existing) return new NextResponse(null, { status: 204 });
      await prisma.eventRSVP.delete({ where: { id: existing.id } });

      return new NextResponse(null, { status: 204 });
    } catch (error) {
    // This will error if the RSVP doesn't exist, which is fine.
    console.error(`Failed to delete RSVP for user ${userId} from event ${eventId}:`, error);
    return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/events/[eventId]/rsvps/[userId]', tenantId, eventId, userId });
  }
}
