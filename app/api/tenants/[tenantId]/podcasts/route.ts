import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';

const prisma = new PrismaClient();

// 12.1 List Podcasts
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, params.tenantId, 'podcasts');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view podcasts.' }, { status: 403 });
    }

    const podcasts = await prisma.podcast.findMany({
      where: { tenantId: params.tenantId },
      orderBy: { publishedDate: 'desc' },
    });

    return NextResponse.json(podcasts);
  } catch (error) {
    console.error(`Failed to fetch podcasts for tenant ${params.tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch podcasts' }, { status: 500 });
  }
}

const podcastSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    audioUrl: z.string().url(),
    publishedDate: z.string().datetime(),
    series: z.string().optional(),
});

// 12.2 Create Podcast
export async function POST(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId }, include: { permissions: true } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canCreate = await can(user, tenant, 'canCreatePodcasts');
    if (!canCreate) {
        return NextResponse.json({ message: 'You do not have permission to create podcasts.' }, { status: 403 });
    }

    const result = podcastSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const newPodcast = await prisma.podcast.create({
            data: {
                ...result.data,
                tenantId: params.tenantId,
            },
        });

        return NextResponse.json(newPodcast, { status: 201 });
    } catch (error) {
        console.error(`Failed to create podcast in tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to create podcast' }, { status: 500 });
    }
}
