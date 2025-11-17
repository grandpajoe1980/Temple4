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
    const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, tenantId, 'podcasts');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view this podcast.' }, { status: 403 });
    }

    const podcast = await prisma.podcast.findUnique({
      where: { id: params.podcastId, tenantId: tenantId },
    });

    if (!podcast) {
      return NextResponse.json({ message: 'Podcast not found' }, { status: 404 });
    }

    return NextResponse.json(podcast);
  } catch (error) {
    console.error(`Failed to fetch podcast ${params.podcastId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch podcast' }, { status: 500 });
  }
}

const podcastUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    audioUrl: z.string().url().optional(),
    imageUrl: z.string().url().optional(),
    duration: z.number().int().positive().optional(),
});

// 12.4 Update Podcast
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; podcastId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

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
        const updatedPodcast = await prisma.podcast.update({
            where: { id: params.podcastId, tenantId: tenantId },
            data: result.data,
        });

        return NextResponse.json(updatedPodcast);
    } catch (error) {
        console.error(`Failed to update podcast ${params.podcastId}:`, error);
        return NextResponse.json({ message: 'Failed to update podcast' }, { status: 500 });
    }
}

// 12.5 Delete Podcast
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; podcastId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canDelete = await can(user, tenant, 'canCreatePodcasts');
    if (!canDelete) {
        return NextResponse.json({ message: 'You do not have permission to delete podcasts.' }, { status: 403 });
    }

    try {
        await prisma.podcast.delete({
            where: { id: params.podcastId, tenantId: tenantId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete podcast ${params.podcastId}:`, error);
        return NextResponse.json({ message: 'Failed to delete podcast' }, { status: 500 });
    }
}
