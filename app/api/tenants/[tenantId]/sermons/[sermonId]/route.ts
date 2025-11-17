import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';

// 11.3 Get Single Sermon
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string; sermonId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, params.tenantId, 'sermons');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view this sermon.' }, { status: 403 });
    }

    const sermon = await prisma.sermon.findUnique({
      where: { id: params.sermonId, tenantId: params.tenantId },
    });

    if (!sermon) {
      return NextResponse.json({ message: 'Sermon not found' }, { status: 404 });
    }

    return NextResponse.json(sermon);
  } catch (error) {
    console.error(`Failed to fetch sermon ${params.sermonId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch sermon' }, { status: 500 });
  }
}

const sermonUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    speaker: z.string().min(1).optional(),
    date: z.string().datetime().optional(),
    videoUrl: z.string().url().optional(),
    audioUrl: z.string().url().optional(),
    series: z.string().optional(),
});

// 11.4 Update Sermon
export async function PUT(
  request: Request,
  { params }: { params: { tenantId: string; sermonId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId }, select: { id: true, name: true, permissions: true } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canUpdate = await can(user, tenant, 'canCreateSermons');
    if (!canUpdate) {
        return NextResponse.json({ message: 'You do not have permission to update sermons.' }, { status: 403 });
    }

    const result = sermonUpdateSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const updatedSermon = await prisma.sermon.update({
            where: { id: params.sermonId, tenantId: params.tenantId },
            data: result.data,
        });

        return NextResponse.json(updatedSermon);
    } catch (error) {
        console.error(`Failed to update sermon ${params.sermonId}:`, error);
        return NextResponse.json({ message: 'Failed to update sermon' }, { status: 500 });
    }
}

// 11.5 Delete Sermon
export async function DELETE(
  request: Request,
  { params }: { params: { tenantId: string; sermonId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId }, select: { id: true, name: true, permissions: true } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canDelete = await can(user, tenant, 'canCreateSermons');
    if (!canDelete) {
        return NextResponse.json({ message: 'You do not have permission to delete sermons.' }, { status: 403 });
    }

    try {
        await prisma.sermon.delete({
            where: { id: params.sermonId, tenantId: params.tenantId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete sermon ${params.sermonId}:`, error);
        return NextResponse.json({ message: 'Failed to delete sermon' }, { status: 500 });
    }
}
