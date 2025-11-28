import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';
import { unauthorized, forbidden, handleApiError } from '@/lib/api-response';

function toCsvRow(values: Array<string | number | null | undefined>) {
  return values
    .map((v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      // wrap in quotes if contains comma, newline, or quote
      if (/[,\n"]/ .test(s)) return `"${s}"`;
      return s;
    })
    .join(',');
}

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string; eventId: string }> }) {
  const { tenantId, eventId } = await params;
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;
    if (!currentUserId) return unauthorized();

    const ok = await hasRole(currentUserId, tenantId, [TenantRole.ADMIN, TenantRole.STAFF]);
    if (!ok) return forbidden('Insufficient permissions');

    const rows = await prisma.eventRSVP.findMany({
      where: { eventId },
      include: { user: { select: { email: true, profile: true } }, volunteerRole: { select: { roleName: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // CSV header
    const header = ['Name', 'Email', 'Status', 'Role', 'VolunteerRole', 'Notes', 'CheckInTime', 'CreatedAt'];
    const lines = [toCsvRow(header)];

    for (const r of rows) {
      const name = r.user ? (r.user.profile?.displayName || r.user.email) : (r.guestName || '');
      const email = r.user ? r.user.email : (r.guestEmail || '');
      const status = r.status;
      const role = r.role || '';
      const volunteerRole = r.volunteerRole?.roleName || '';
      const notes = r.notes || '';
      const checkInTime = r.checkInTime ? new Date(r.checkInTime).toISOString() : '';
      const createdAt = r.createdAt ? new Date(r.createdAt).toISOString() : '';
      lines.push(toCsvRow([name, email, status, role, volunteerRole, notes, checkInTime, createdAt]));
    }

    const csv = lines.join('\n');
    const filename = `attendees-${eventId}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export attendees CSV', error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/events/[eventId]/attendees/export', tenantId, eventId });
  }
}
