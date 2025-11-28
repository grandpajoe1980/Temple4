import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { handleApiError, notFound, forbidden } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolved = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: resolved.tenantId },
      include: { settings: true },
    });

    if (!tenant) {
      return notFound('Tenant');
    }

    // Check membership
    const membership = userId ? await prisma.userTenantMembership.findUnique({
      where: { userId_tenantId: { userId, tenantId: tenant.id } },
    }) : null;

    if (!tenant.settings?.isPublic && !membership) {
      return forbidden('You do not have permission to view this tenant.');
    }

    const photos = await prisma.mediaItem.findMany({
      where: { tenantId: tenant.id, type: 'PHOTO', deletedAt: null },
      orderBy: { uploadedAt: 'desc' },
      include: { author: { include: { profile: true } } },
    });

    const mapped = photos.map((p: any) => ({
      id: p.id,
      tenantId: p.tenantId,
      authorUserId: p.authorUserId,
      title: p.title,
      storageKey: p.storageKey,
      mimeType: p.mimeType,
      fileSize: p.fileSize,
      uploadedAt: p.uploadedAt,
      authorDisplayName: p.author?.profile?.displayName || 'Unknown',
      authorAvatarUrl: p.author?.profile?.avatarUrl || undefined,
    }));

    return NextResponse.json({ photos: mapped });
  } catch (error) {
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/photos', tenantId: resolved.tenantId, userId: userId });
  }
}
