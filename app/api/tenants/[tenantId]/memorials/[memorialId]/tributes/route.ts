import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-response';

const createTributeSchema = z.object({
  message: z.string().min(1).max(2000),
  relationship: z.string().max(100).optional(),
});

// GET: List tributes for a memorial
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; memorialId: string }> }
) {
  try {
    const { tenantId, memorialId } = await context.params;
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Check memorial exists and is accessible
    const memorial = await prisma.memorial.findFirst({
      where: { id: memorialId, tenantId, deletedAt: null },
    });

    if (!memorial) {
      return NextResponse.json({ error: 'Memorial not found' }, { status: 404 });
    }

    // Determine if user can see all tributes (including pending) or just approved
    let showPending = false;
    if (session?.user?.id) {
      const membership = await prisma.userTenantMembership.findFirst({
        where: { userId: session.user.id, tenantId },
        include: { roles: true },
      });
      const isAdmin = membership?.roles?.some(r => r.role === 'ADMIN') ?? false;
      const isSubmitter = memorial.submitterId === session.user.id;
      showPending = isAdmin || isSubmitter;
    }

    const whereClause = {
      memorialId,
      memorial: { tenantId },
      deletedAt: null,
      ...(showPending ? {} : { isApproved: true }),
    };

    const [tributes, total] = await Promise.all([
      prisma.memorialTribute.findMany({
        where: whereClause,
        include: {
          user: {
            select: { profile: { select: { displayName: true, avatarUrl: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.memorialTribute.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      tributes: tributes.map(t => ({
        ...t,
        user: t.user?.profile || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Create a new tribute
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; memorialId: string }> }
) {
  try {
    const { tenantId, memorialId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Must be signed in to leave a tribute' }, { status: 401 });
    }

    // Verify memorial exists and is approved
    const memorial = await prisma.memorial.findFirst({
      where: { 
        id: memorialId, 
        tenantId, 
        status: 'APPROVED',
        deletedAt: null,
      },
    });

    if (!memorial) {
      return NextResponse.json({ error: 'Memorial not found or not published' }, { status: 404 });
    }

    // Check user has membership (for MEMBERS_ONLY memorials)
    const membership = await prisma.userTenantMembership.findFirst({
      where: { userId: session.user.id, tenantId },
    });

    if (memorial.privacy === 'MEMBERS_ONLY' && !membership) {
      return NextResponse.json({ error: 'This memorial is only visible to members' }, { status: 403 });
    }

    if (memorial.privacy === 'PRIVATE') {
      return NextResponse.json({ error: 'Cannot add tributes to private memorials' }, { status: 403 });
    }

    const body = await req.json();
    const data = createTributeSchema.parse(body);

    // Check tenant settings for auto-approve
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    
    // Default: auto-approve tributes from members
    const settings = tenant?.settings as Record<string, unknown> | null;
    const autoApproveTributes = settings?.autoApproveTributes !== false;

    const tribute = await prisma.memorialTribute.create({
      data: {
        memorialId,
        userId: session.user.id,
        content: data.message,
        isApproved: autoApproveTributes,
      },
      include: {
        user: {
          select: { profile: { select: { displayName: true, avatarUrl: true } } },
        },
      },
    });

    return NextResponse.json({
      tribute: {
        ...tribute,
        user: tribute.user?.profile || null,
      },
      message: autoApproveTributes 
        ? 'Tribute added successfully' 
        : 'Tribute submitted for review',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
