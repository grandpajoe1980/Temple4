import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { forbidden, notFound, handleApiError, unauthorized } from '@/lib/api-response';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; photoId: string }> }
) {
  const { tenantId, photoId } = await params;

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return unauthorized();
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!user || !tenant) {
      return notFound('Tenant or user');
    }

    const mediaItem = await prisma.mediaItem.findUnique({ where: { id: photoId } });

    if (!mediaItem || mediaItem.tenantId !== tenantId || mediaItem.type !== 'PHOTO') {
      return notFound('Photo');
    }

    // Permission: admin/moderator or owner
    const isAdmin = await can(user, tenant, 'canBanMembers');
    const isModerator = await can(user, tenant, 'canModeratePosts');
    const isOwner = mediaItem.authorUserId === userId;

    if (!isAdmin && !isModerator && !isOwner) {
      return forbidden('You do not have permission to delete this photo.');
    }

    await prisma.mediaItem.deleteMany({
      where: { id: photoId, tenantId, type: 'PHOTO' },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/photos/[photoId]', tenantId, photoId });
  }
}
