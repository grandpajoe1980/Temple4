import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { unauthorized, forbidden, validationError, handleApiError } from '@/lib/api-response';

export async function PATCH(request: Request, { params }: { params: Promise<{ tenantId: string; eventId: string; roleId: string }> }) {
  const { tenantId, eventId, roleId } = await params;
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;
    if (!currentUserId) return unauthorized();

    const allowed = await hasRole(currentUserId, tenantId, [TenantRole.ADMIN, TenantRole.STAFF]);
    if (!allowed) return forbidden('Insufficient permissions');

    const body = await request.json();
    if (!body) return validationError({ request: ['Invalid body'] });

    const role = await prisma.eventVolunteerRole.findUnique({ where: { id: roleId } });
    if (!role || role.eventId !== eventId) return validationError({ role: ['Not found'] });

    const updated = await prisma.eventVolunteerRole.update({ where: { id: roleId }, data: { roleName: body.roleName ?? role.roleName, capacity: typeof body.capacity === 'number' ? body.capacity : role.capacity } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update volunteer role', error);
    return handleApiError(error, { route: 'PATCH /api/tenants/[tenantId]/events/[eventId]/volunteer-roles/[roleId]', tenantId, eventId, roleId });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tenantId: string; eventId: string; roleId: string }> }) {
  const { tenantId, eventId, roleId } = await params;
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;
    if (!currentUserId) return unauthorized();

    const allowed = await hasRole(currentUserId, tenantId, [TenantRole.ADMIN, TenantRole.STAFF]);
    if (!allowed) return forbidden('Insufficient permissions');

    const role = await prisma.eventVolunteerRole.findUnique({ where: { id: roleId } });
    if (!role || role.eventId !== eventId) return validationError({ role: ['Not found'] });

    // Prevent delete if there are confirmed signups
    const confirmed = await prisma.eventRSVP.count({ where: { volunteerRoleId: roleId, status: 'GOING' } });
    if (confirmed > 0) return validationError({ role: ['Role has confirmed signups and cannot be deleted'] });

    await prisma.eventVolunteerRole.delete({ where: { id: roleId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete volunteer role', error);
    return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/events/[eventId]/volunteer-roles/[roleId]', tenantId, eventId, roleId });
  }
}
