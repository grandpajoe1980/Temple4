import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, unauthorized, forbidden, validationError } from '@/lib/api-response';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string; eventId: string }> }) {
  const { tenantId, eventId } = await params;
  try {
    const roles = await prisma.eventVolunteerRole.findMany({ where: { eventId } });
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Failed to fetch volunteer roles for event', eventId, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/events/[eventId]/volunteer-roles', tenantId, eventId });
  }
}

// Create a volunteer role (admins/staff only)
export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string; eventId: string }> }) {
  const { tenantId, eventId } = await params;
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;
    if (!currentUserId) return unauthorized();

    const allowed = await hasRole(currentUserId, tenantId, [TenantRole.ADMIN, TenantRole.STAFF]);
    if (!allowed) return forbidden('Insufficient permissions');

    const body = await request.json();
    if (!body || !body.roleName) return validationError({ roleName: ['required'] });
    const capacity = Number(body.capacity || 1) || 1;

    const created = await prisma.eventVolunteerRole.create({ data: { eventId, roleName: String(body.roleName), capacity } });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create volunteer role', error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/events/[eventId]/volunteer-roles', tenantId, eventId });
  }
}
