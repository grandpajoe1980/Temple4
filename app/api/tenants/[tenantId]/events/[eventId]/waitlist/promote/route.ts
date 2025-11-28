import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { promoteWaitlisted } from '@/lib/services/event-service';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { handleApiError, unauthorized, forbidden, validationError } from '@/lib/api-response';

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string; eventId: string }> }) {
  const { tenantId, eventId } = await params;
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;
    if (!currentUserId) return unauthorized();

    // Require admin/staff role to promote
    const ok = await hasRole(currentUserId, tenantId, [TenantRole.ADMIN, TenantRole.STAFF]);
    if (!ok) return forbidden('Insufficient permissions');

    const body = await request.json();
    if (!body || !body.rsvpId) return validationError({ rsvpId: ['required'] });

    const promoted = await promoteWaitlisted(tenantId, eventId, body.rsvpId, { force: !!body.force });
    return NextResponse.json(promoted);
  } catch (error) {
    console.error('Failed promoting waitlisted RSVP:', error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/events/[eventId]/waitlist/promote', tenantId, eventId });
  }
}
