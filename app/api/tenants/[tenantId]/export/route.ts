import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { exportTenantData } from '@/lib/data';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value).replace(/"/g, '""');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue}"`;
  }
  return stringValue;
}

function buildCsv(exportData: NonNullable<Awaited<ReturnType<typeof exportTenantData>>>): string {
  const rows: string[] = [];

  rows.push('dataset,id,label,status_or_type,extra');

  exportData.members.forEach((member) => {
    rows.push(
      [
        'member',
        member.id,
        member.user.email,
        member.status,
        member.roles.join('|'),
      ]
        .map(escapeCsv)
        .join(',')
    );
  });

  exportData.events.forEach((event) => {
    rows.push(
      [
        'event',
        event.id,
        event.title,
        event.startDateTime?.toISOString?.() ?? '',
        event.endDateTime?.toISOString?.() ?? '',
      ]
        .map(escapeCsv)
        .join(',')
    );
  });

  exportData.services.forEach((service) => {
    rows.push(
      [
        'service',
        service.id,
        service.name,
        service.category,
        service.isPublic ? 'public' : 'members-only',
      ]
        .map(escapeCsv)
        .join(',')
    );
  });

  exportData.facilities.forEach((facility) => {
    rows.push(
      [
        'facility',
        facility.id,
        facility.name,
        facility.type,
        facility.isActive ? 'active' : 'inactive',
      ]
        .map(escapeCsv)
        .join(',')
    );
  });

  exportData.contactSubmissions.forEach((submission) => {
    rows.push(
      [
        'contact_submission',
        submission.id,
        submission.email,
        submission.status,
        submission.createdAt.toISOString(),
      ]
        .map(escapeCsv)
        .join(',')
    );
  });

  return rows.join('\n');
}

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;

  if (!userId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const isAdmin = await hasRole(userId, tenantId, [TenantRole.ADMIN]);

  if (!isAdmin) {
    return NextResponse.json({ message: 'You do not have permission to export this tenant.' }, { status: 403 });
  }

  const data = await exportTenantData(tenantId);

  if (!data) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const format = (url.searchParams.get('format') || 'json').toLowerCase();

  if (format === 'csv') {
    const csv = buildCsv(data);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=tenant-${tenantId}-export.csv`,
      },
    });
  }

  return NextResponse.json(data, {
    headers: {
      'Content-Disposition': `attachment; filename=tenant-${tenantId}-export.json`,
    },
  });
}

