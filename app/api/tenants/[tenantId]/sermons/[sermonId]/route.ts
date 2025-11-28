import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';
import { forbidden, notFound, handleApiError, unauthorized, validationError } from '@/lib/api-response';

// 11.3 Get Single Sermon
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; sermonId: string }> }
) {
    const { sermonId, tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, tenantId, 'sermons');
    if (!canView) {
      return forbidden('You do not have permission to view this sermon.');
    }

    const sermon = await prisma.mediaItem.findFirst({
      where: { 
        id: sermonId, 
        tenantId: tenantId,
        type: 'SERMON_VIDEO'
      },
    });

    if (!sermon) {
      return notFound('Sermon');
    }

    return NextResponse.json(sermon);
  } catch (error) {
    console.error(`Failed to fetch sermon ${sermonId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/sermons/[sermonId]', sermonId, tenantId });
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
    const { sermonId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return unauthorized();
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
      return validationError({ request: ['Invalid user or tenant'] });
    }

    const canUpdate = await can(user, tenant, 'canCreateSermons');
    if (!canUpdate) {
      return forbidden('You do not have permission to update sermons.');
    }

    const result = sermonUpdateSchema.safeParse(await request.json());
    if (!result.success) {
      return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const updatedSermon = await prisma.mediaItem.updateMany({
            where: { 
                id: sermonId, 
                tenantId: tenantId,
                type: 'SERMON_VIDEO'
            },
            data: result.data,
        });

        if (updatedSermon.count === 0) {
          return notFound('Sermon');
        }

        const sermon = await prisma.mediaItem.findUnique({ where: { id: sermonId } });
        return NextResponse.json(sermon);
    } catch (error) {
      console.error(`Failed to update sermon ${sermonId}:`, error);
      return handleApiError(error, { route: 'PUT /api/tenants/[tenantId]/sermons/[sermonId]', sermonId, tenantId });
    }
}

// 11.5 Delete Sermon
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; sermonId: string }> }
) {
    const { sermonId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return unauthorized();
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
      return validationError({ request: ['Invalid user or tenant'] });
    }

    const canDelete = await can(user, tenant, 'canCreateSermons');
    if (!canDelete) {
      return forbidden('You do not have permission to delete sermons.');
    }

    try {
        await prisma.mediaItem.deleteMany({
            where: { 
                id: sermonId, 
                tenantId: tenantId,
                type: 'SERMON_VIDEO'
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error(`Failed to delete sermon ${sermonId}:`, error);
      return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/sermons/[sermonId]', sermonId, tenantId });
    }
}
