import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-response';

const createMemorialSchema = z.object({
  name: z.string().min(1).max(200),
  birthDate: z.string().datetime().optional().nullable(),
  deathDate: z.string().datetime().optional().nullable(),
  story: z.string().max(10000).optional().nullable(),
  photos: z.array(z.string().url()).max(20).default([]),
  tags: z.array(z.string().max(50)).max(10).default([]),
  privacy: z.enum(['PUBLIC', 'MEMBERS_ONLY', 'PRIVATE']).default('PUBLIC'),
  submitterName: z.string().max(100).optional().nullable(),
  submitterEmail: z.string().email().optional().nullable(),
  linkedFundId: z.string().cuid().optional().nullable(),
});

// GET: List memorials (public or based on membership)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const session = await getServerSession(authOptions);
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'APPROVED';
    const tag = url.searchParams.get('tag');
    const search = url.searchParams.get('search');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const cursor = url.searchParams.get('cursor');

    // Check if memorials are enabled
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings?.enableMemorials) {
      return NextResponse.json(
        { error: 'Memorials are not enabled for this community' },
        { status: 403 }
      );
    }

    // Check membership for non-public memorials
    let isMember = false;
    let isAdmin = false;
    if (session?.user?.id) {
      const membership = await prisma.userTenantMembership.findFirst({
        where: { userId: session.user.id, tenantId },
        include: { roles: true },
      });
      isMember = !!membership;
      isAdmin = membership?.roles?.some(r => r.role === 'ADMIN') ?? false;
    }

    // Build query conditions
    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };

    // Status filter - admins can see all, others only approved
    if (isAdmin && status !== 'APPROVED') {
      where.status = status;
    } else {
      where.status = 'APPROVED';
    }

    // Privacy filter
    if (!isMember) {
      where.privacy = 'PUBLIC';
    } else if (!isAdmin) {
      where.privacy = { in: ['PUBLIC', 'MEMBERS_ONLY'] };
    }
    // Admins can see all privacy levels

    // Tag filter
    if (tag) {
      where.tags = { array_contains: tag };
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { story: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Cursor pagination
    if (cursor) {
      where.id = { lt: cursor };
    }

    const memorials = await prisma.memorial.findMany({
      where: where as any,
      include: {
        submitter: {
          select: { profile: { select: { displayName: true, avatarUrl: true } } },
        },
        linkedFund: {
          select: { id: true, name: true },
        },
        _count: {
          select: { tributes: { where: { deletedAt: null, isApproved: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = memorials.length > limit;
    const items = hasMore ? memorials.slice(0, -1) : memorials;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      memorials: items.map(m => ({
        ...m,
        photos: m.photos as string[],
        tags: m.tags as string[],
        submitter: m.submitter?.profile || null,
        tributeCount: m._count.tributes,
      })),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Submit a new memorial
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const session = await getServerSession(authOptions);

    // Check if memorials are enabled
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings?.enableMemorials) {
      return NextResponse.json(
        { error: 'Memorials are not enabled for this community' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = createMemorialSchema.parse(body);

    // Create the memorial
    const memorial = await prisma.memorial.create({
      data: {
        tenantId,
        name: data.name,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        deathDate: data.deathDate ? new Date(data.deathDate) : null,
        story: data.story,
        photos: data.photos,
        tags: data.tags,
        privacy: data.privacy,
        status: 'PENDING', // Always starts as pending for moderation
        submitterId: session?.user?.id || null,
        submitterName: session?.user?.id ? null : data.submitterName,
        submitterEmail: session?.user?.id ? null : data.submitterEmail,
        linkedFundId: data.linkedFundId,
      },
      include: {
        submitter: {
          select: { profile: { select: { displayName: true } } },
        },
      },
    });

    // TODO: Send notification to admins about new memorial submission

    return NextResponse.json({
      memorial: {
        ...memorial,
        photos: memorial.photos as string[],
        tags: memorial.tags as string[],
      },
      message: 'Memorial submitted for review. It will be published once approved.',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
