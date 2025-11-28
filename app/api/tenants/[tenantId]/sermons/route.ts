import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { canUserViewContent, can } from '@/lib/permissions';
import { z } from 'zod';
import { forbidden, handleApiError, unauthorized, validationError } from '@/lib/api-response';

// 11.1 List Sermons
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const canView = await canUserViewContent(userId, resolvedParams.tenantId, 'sermons');
    if (!canView) {
      return forbidden('You do not have permission to view sermons.');
    }

    const sermons = await prisma.mediaItem.findMany({
      where: { 
        tenantId: resolvedParams.tenantId,
        type: 'SERMON_VIDEO',
        deletedAt: null, // Filter out soft-deleted sermons
      },
      orderBy: { publishedAt: 'desc' },
    });

    return NextResponse.json(sermons);
  } catch (error) {
    console.error(`Failed to fetch sermons for tenant ${resolvedParams.tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/sermons', tenantId: resolvedParams.tenantId });
  }
}

const sermonSchema = z.object({
    title: z.string().min(1),
    description: z.string(),
    embedUrl: z.string().url(),
});

// 11.2 Create Sermon
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return unauthorized();
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: resolvedParams.tenantId }, select: { id: true, name: true, slug: true, creed: true, street: true, city: true, state: true, country: true, postalCode: true, contactEmail: true, phoneNumber: true, description: true, permissions: true } });

    if (!user || !tenant) {
      return validationError({ request: ['Invalid user or tenant'] });
    }

    const canCreate = await can(user, tenant, 'canCreateSermons');
    if (!canCreate) {
      return forbidden('You do not have permission to create sermons.');
    }

    const result = sermonSchema.safeParse(await request.json());
    if (!result.success) {
      return validationError(result.error.flatten().fieldErrors);
    }

    try {
        const newSermon = await prisma.mediaItem.create({
            data: {
                ...result.data,
                tenantId: resolvedParams.tenantId,
                authorUserId: userId,
                type: 'SERMON_VIDEO',
            },
        });

        return NextResponse.json(newSermon, { status: 201 });
    } catch (error) {
      console.error(`Failed to create sermon in tenant ${resolvedParams.tenantId}:`, error);
      return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/sermons', tenantId: resolvedParams.tenantId });
    }
}
