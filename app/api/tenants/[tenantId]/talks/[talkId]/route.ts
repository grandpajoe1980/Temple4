import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';
import { forbidden, notFound, handleApiError, unauthorized, validationError } from '@/lib/api-response';

// 11.3 Get Single Talk
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; talkId: string }> }
) {
    const { talkId, tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, tenantId, 'talks');
    if (!canView) {
      return forbidden('You do not have permission to view this talk.');
    }

    const talk = await prisma.mediaItem.findFirst({
      where: { 
        id: talkId, 
        tenantId: tenantId,
        type: 'TALK_VIDEO'
      },
    });

    if (!talk) {
      return notFound('Talk');
    }

    return NextResponse.json(talk);
  } catch (error) {
    console.error(`Failed to fetch talk ${talkId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/talks/[talkId]', talkId, tenantId });
  }
}

const talkUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    embedUrl: z.string().url().optional(),
});

// 11.4 Update Talk
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; talkId: string }> }
) {
    const { talkId, tenantId } = await params;
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

    const canUpdate = await can(user, tenant, 'canCreateTalks');
    if (!canUpdate) {
      return forbidden('You do not have permission to update talks.');
    }

    const result = talkUpdateSchema.safeParse(await request.json());
    if (!result.success) {
      return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const updatedTalk = await prisma.mediaItem.updateMany({
            where: { 
                id: talkId, 
                tenantId: tenantId,
                type: 'TALK_VIDEO'
            },
            data: result.data,
        });

        if (updatedTalk.count === 0) {
          return notFound('Talk');
        }

        const talk = await prisma.mediaItem.findUnique({ where: { id: talkId } });
        return NextResponse.json(talk);
    } catch (error) {
      console.error(`Failed to update talk ${talkId}:`, error);
      return handleApiError(error, { route: 'PUT /api/tenants/[tenantId]/talks/[talkId]', talkId, tenantId });
    }
}

// 11.5 Delete Talk
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; talkId: string }> }
) {
    const { talkId, tenantId } = await params;
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

    const canDelete = await can(user, tenant, 'canCreateTalks');
    if (!canDelete) {
      return forbidden('You do not have permission to delete talks.');
    }

    try {
        await prisma.mediaItem.deleteMany({
            where: { 
                id: talkId, 
                tenantId: tenantId,
                type: 'TALK_VIDEO'
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error(`Failed to delete talk ${talkId}:`, error);
      return handleApiError(error, { route: 'DELETE /api/tenants/[tenantId]/talks/[talkId]', talkId, tenantId });
    }
}
