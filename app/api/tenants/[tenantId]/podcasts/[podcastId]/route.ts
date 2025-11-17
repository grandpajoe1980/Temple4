import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';


// 12.3 Get Single Podcast
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; podcastId: string }> }
) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, resolvedParams.tenantId, 'podcasts');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view this podcast.' }, { status: 403 });
    }

    const podcast = await prisma.mediaItem.findFirst({
      where: { 
        id: resolvedParams.podcastId, 
        tenantId: resolvedParams.tenantId,
        type: 'PODCAST_AUDIO'
      },
    });

    if (!podcast) {
      return NextResponse.json({ message: 'Podcast not found' }, { status: 404 });
    }

    return NextResponse.json(podcast);
  } catch (error) {
    console.error(`Failed to fetch podcast ${resolvedParams.podcastId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch podcast' }, { status: 500 });
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
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: resolvedParams.tenantId } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canUpdate = await can(user, tenant, 'canCreatePodcasts');
    if (!canUpdate) {
        return NextResponse.json({ message: 'You do not have permission to update podcasts.' }, { status: 403 });
    }

    const result = podcastUpdateSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const updatedPodcast = await prisma.mediaItem.updateMany({
            where: { 
              id: resolvedParams.podcastId, 
              tenantId: resolvedParams.tenantId,
              type: 'PODCAST_AUDIO'
            },
            data: result.data,
        });

        if (updatedPodcast.count === 0) {
            return NextResponse.json({ message: 'Podcast not found' }, { status: 404 });
        }

        const podcast = await prisma.mediaItem.findUnique({ where: { id: resolvedParams.podcastId } });
        return NextResponse.json(podcast);
    } catch (error) {
        console.error(`Failed to update podcast ${resolvedParams.podcastId}:`, error);
        return NextResponse.json({ message: 'Failed to update podcast' }, { status: 500 });
    }
}

// 12.5 Delete Podcast
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; podcastId: string }> }
) {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: resolvedParams.tenantId } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canDelete = await can(user, tenant, 'canCreatePodcasts');
    if (!canDelete) {
        return NextResponse.json({ message: 'You do not have permission to delete podcasts.' }, { status: 403 });
    }

    try {
        const podcast = await prisma.mediaItem.findFirst({
            where: { 
              id: resolvedParams.podcastId, 
              tenantId: resolvedParams.tenantId,
              type: 'PODCAST_AUDIO'
            },
        });
        
        if (!podcast) {
            return NextResponse.json({ message: 'Podcast not found' }, { status: 404 });
        }

        await prisma.mediaItem.delete({
            where: { id: resolvedParams.podcastId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete podcast ${resolvedParams.podcastId}:`, error);
        return NextResponse.json({ message: 'Failed to delete podcast' }, { status: 500 });
    }
}
