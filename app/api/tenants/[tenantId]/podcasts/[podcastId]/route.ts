import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';
import { handleApiError, unauthorized, forbidden, notFound, validationError } from '@/lib/api-response';

// 12.3 Get Single Podcast
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; podcastId: string }> }
) {
    const { podcastId, tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, tenantId, 'podcasts');
    if (!canView) {
      return forbidden('You do not have permission to view this podcast.');
    }

    const podcast = await prisma.mediaItem.findUnique({ where: { id: podcastId } });
    if (!podcast || podcast.tenantId !== tenantId) {
      return notFound('Podcast');
    }

    return NextResponse.json(podcast);
  } catch (error) {
    console.error(`Failed to fetch podcast ${podcastId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/podcasts/[podcastId]', tenantId, podcastId });
  }
}

const podcastUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  embedUrl: z.string().url().optional(),
});

// 12.4 Update Podcast
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; podcastId: string }> }
) {
    const { podcastId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return unauthorized();
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
      return validationError({ tenant: ['Invalid user or tenant'] });
    }

    const canUpdate = await can(user, tenant, 'canCreatePodcasts');
    if (!canUpdate) {
      return forbidden('You do not have permission to update podcasts.');
    }

    const result = podcastUpdateSchema.safeParse(await request.json());
    if (!result.success) {
      return validationError(result.error.flatten().fieldErrors);
    }

    try {
        // ensure podcast exists and belongs to tenant
        const existing = await prisma.mediaItem.findUnique({ where: { id: podcastId } });
        if (!existing || existing.tenantId !== tenantId) {
          return notFound('Podcast');
        }

        const updatedPodcast = await prisma.mediaItem.update({
            where: { id: podcastId },
            data: {
              title: result.data.title,
              description: result.data.description,
              embedUrl: result.data.embedUrl,
            },
        });

        return NextResponse.json(updatedPodcast);
    } catch (error) {
      console.error(`Failed to update podcast ${podcastId}:`, error);
      return handleApiError(error, { route: 'PUT /api/tenants/[tenantId]/podcasts/[podcastId]', tenantId, podcastId });
    }
}

// 12.5 Delete Podcast
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; podcastId: string }> }
) {
    const { podcastId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return unauthorized();
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
      return validationError({ tenant: ['Invalid user or tenant'] });
    }

    const canDelete = await can(user, tenant, 'canCreatePodcasts');
    if (!canDelete) {
      return forbidden('You do not have permission to delete podcasts.');
    }

    try {
        // Use deleteMany to avoid throwing when record not found and ensure tenant scoping
        const del = await prisma.mediaItem.deleteMany({ where: { id: podcastId, tenantId: tenantId } });
        if (del.count === 0) {
          return notFound('Podcast');
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error(`Failed to delete podcast ${podcastId}:`, error);
      return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/podcasts/[podcastId]', tenantId, podcastId });
    }
}
