import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';

// 11.3 Get Single Sermon
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; sermonId: string }> }
) {
    const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, params.tenantId, 'sermons');
    if (!canView) {
      return NextResponse.json({ message: 'You do not have permission to view this sermon.' }, { status: 403 });
    }

    const sermon = await prisma.mediaItem.findFirst({
      where: { 
        id: params.sermonId, 
        tenantId: params.tenantId,
        type: 'SERMON_VIDEO'
      },
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
    embedUrl: z.string().url().optional(),
});

// 11.4 Update Sermon
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; sermonId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

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
        const updatedSermon = await prisma.mediaItem.updateMany({
            where: { 
                id: params.sermonId, 
                tenantId: params.tenantId,
                type: 'SERMON_VIDEO'
            },
            data: result.data,
        });

        if (updatedSermon.count === 0) {
            return NextResponse.json({ message: 'Sermon not found' }, { status: 404 });
        }

        const sermon = await prisma.mediaItem.findUnique({ where: { id: params.sermonId } });
        return NextResponse.json(sermon);
    } catch (error) {
        console.error(`Failed to update sermon ${params.sermonId}:`, error);
        return NextResponse.json({ message: 'Failed to update sermon' }, { status: 500 });
    }
}

// 11.5 Delete Sermon
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; sermonId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
        return NextResponse.json({ message: 'Invalid user or tenant' }, { status: 400 });
    }

    const canDelete = await can(user, tenant, 'canCreateSermons');
    if (!canDelete) {
        return NextResponse.json({ message: 'You do not have permission to delete sermons.' }, { status: 403 });
    }

    try {
        await prisma.mediaItem.deleteMany({
            where: { 
                id: params.sermonId, 
                tenantId: params.tenantId,
                type: 'SERMON_VIDEO'
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete sermon ${params.sermonId}:`, error);
        return NextResponse.json({ message: 'Failed to delete sermon' }, { status: 500 });
    }
}
