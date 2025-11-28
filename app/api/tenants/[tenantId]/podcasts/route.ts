import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';
import { handleApiError, unauthorized, forbidden, validationError } from '@/lib/api-response';

// 12.1 List Podcasts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, tenantId, 'podcasts');
    if (!canView) {
      return forbidden('You do not have permission to view podcasts.');
    }

    const podcasts = await prisma.mediaItem.findMany({
      where: {
        tenantId: tenantId,
        type: 'PODCAST_AUDIO',
        deletedAt: null, // Filter out soft-deleted podcasts
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });

    return NextResponse.json(
      podcasts.map((podcast) => ({
        ...podcast,
        authorDisplayName: podcast.author.profile?.displayName || 'Unknown',
        authorAvatarUrl: podcast.author.profile?.avatarUrl || undefined,
      }))
    );
  } catch (error) {
    console.error(`Failed to fetch podcasts for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/podcasts', tenantId });
  }
}

const podcastSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    embedUrl: z.string().url(),
});

// 12.2 Create Podcast
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return unauthorized();
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ 
        where: { id: tenantId },
        select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true }
    });

    if (!user || !tenant) {
      return validationError({ tenant: ['Invalid user or tenant'] });
    }

    const canCreate = await can(user, tenant, 'canCreatePodcasts');
    if (!canCreate) {
      return forbidden('You do not have permission to create podcasts.');
    }

    const result = podcastSchema.safeParse(await request.json());
    if (!result.success) {
      return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const newPodcast = await prisma.mediaItem.create({
            data: {
                title: result.data.title,
                description: result.data.description || '',
                embedUrl: result.data.embedUrl,
                tenantId: tenantId,
                authorUserId: userId,
                type: 'PODCAST_AUDIO',
            },
        });

        return NextResponse.json(newPodcast, { status: 201 });
    } catch (error) {
      console.error(`Failed to create podcast in tenant ${tenantId}:`, error);
      return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/podcasts', tenantId });
    }
}
