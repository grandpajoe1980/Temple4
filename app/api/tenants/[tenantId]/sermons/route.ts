import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';

const prisma = new PrismaClient();

// 11.1 List Sermons
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, params.tenantId, 'sermons');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view sermons.' }, { status: 403 });
    }

    const sermons = await prisma.sermon.findMany({
      where: { tenantId: params.tenantId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(sermons);
  } catch (error) {
    console.error(`Failed to fetch sermons for tenant ${params.tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch sermons' }, { status: 500 });
  }
}

const sermonSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    speaker: z.string().min(1),
    date: z.string().datetime(),
    videoUrl: z.string().url().optional(),
    audioUrl: z.string().url().optional(),
    series: z.string().optional(),
});

// 11.2 Create Sermon
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

    const canCreate = await can(user, tenant, 'canCreateSermons');
    if (!canCreate) {
        return NextResponse.json({ message: 'You do not have permission to create sermons.' }, { status: 403 });
    }

    const result = sermonSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const newSermon = await prisma.sermon.create({
            data: {
                ...result.data,
                tenantId: params.tenantId,
            },
        });

        return NextResponse.json(newSermon, { status: 201 });
    } catch (error) {
        console.error(`Failed to create sermon in tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to create sermon' }, { status: 500 });
    }
}
