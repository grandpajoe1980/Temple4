import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-response';

const updateMemorialSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  birthDate: z.string().datetime().optional().nullable(),
  deathDate: z.string().datetime().optional().nullable(),
  story: z.string().max(10000).optional().nullable(),
  photos: z.array(z.string().url()).max(20).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  privacy: z.enum(['PUBLIC', 'MEMBERS_ONLY', 'PRIVATE']).optional(),
  linkedFundId: z.string().cuid().optional().nullable(),
});

const moderationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

// GET: Get a single memorial
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; memorialId: string }> }
) {
  try {
    const { tenantId, memorialId } = await context.params;
    const session = await getServerSession(authOptions);

    const memorial = await prisma.memorial.findFirst({
      where: {
        id: memorialId,
        tenantId,
        deletedAt: null,
      },
      include: {
        submitter: {
          select: { profile: { select: { displayName: true, avatarUrl: true } } },
        },
        approvedBy: {
          select: { profile: { select: { displayName: true } } },
        },
        linkedFund: {
          select: { id: true, name: true },
        },
        tributes: {
          where: { deletedAt: null, isApproved: true },
          include: {
            user: {
              select: { profile: { select: { displayName: true, avatarUrl: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!memorial) {
      return NextResponse.json({ error: 'Memorial not found' }, { status: 404 });
    }

    // Check access permissions
    let canView = memorial.status === 'APPROVED' && memorial.privacy === 'PUBLIC';
    
    if (session?.user?.id) {
      const membership = await prisma.userTenantMembership.findFirst({
        where: { userId: session.user.id, tenantId },
        include: { roles: true },
      });
      
      const isAdmin = membership?.roles?.some(r => r.role === 'ADMIN') ?? false;
      const isMember = !!membership;
      const isSubmitter = memorial.submitterId === session.user.id;

      if (isAdmin || isSubmitter) {
        canView = true;
      } else if (isMember && memorial.status === 'APPROVED') {
        canView = memorial.privacy !== 'PRIVATE';
      }
    }

    if (!canView) {
      return NextResponse.json({ error: 'Not authorized to view this memorial' }, { status: 403 });
    }

    // Increment view count (don't await to not slow down response)
    prisma.memorial.update({
      where: { id: memorialId },
      data: { viewCount: { increment: 1 } },
    }).catch(console.error);

    return NextResponse.json({
      memorial: {
        ...memorial,
        photos: memorial.photos as string[],
        tags: memorial.tags as string[],
        submitter: memorial.submitter?.profile || null,
        approvedBy: memorial.approvedBy?.profile || null,
        tributes: memorial.tributes.map(t => ({
          ...t,
          user: t.user?.profile || null,
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT: Update a memorial
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; memorialId: string }> }
) {
  try {
    const { tenantId, memorialId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memorial = await prisma.memorial.findFirst({
      where: { id: memorialId, tenantId, deletedAt: null },
    });

    if (!memorial) {
      return NextResponse.json({ error: 'Memorial not found' }, { status: 404 });
    }

    // Check permissions
    const membership = await prisma.userTenantMembership.findFirst({
      where: { userId: session.user.id, tenantId },
      include: { roles: true },
    });
    
    const isAdmin = membership?.roles?.some(r => r.role === 'ADMIN') ?? false;
    const isSubmitter = memorial.submitterId === session.user.id;

    if (!isAdmin && !isSubmitter) {
      return NextResponse.json({ error: 'Not authorized to edit this memorial' }, { status: 403 });
    }

    const body = await req.json();
    const data = updateMemorialSchema.parse(body);

    const updated = await prisma.memorial.update({
      where: { id: memorialId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.birthDate !== undefined && { birthDate: data.birthDate ? new Date(data.birthDate) : null }),
        ...(data.deathDate !== undefined && { deathDate: data.deathDate ? new Date(data.deathDate) : null }),
        ...(data.story !== undefined && { story: data.story }),
        ...(data.photos && { photos: data.photos }),
        ...(data.tags && { tags: data.tags }),
        ...(data.privacy && { privacy: data.privacy }),
        ...(data.linkedFundId !== undefined && { linkedFundId: data.linkedFundId }),
      },
    });

    return NextResponse.json({
      memorial: {
        ...updated,
        photos: updated.photos as string[],
        tags: updated.tags as string[],
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}

// PATCH: Moderate (approve/reject) a memorial
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; memorialId: string }> }
) {
  try {
    const { tenantId, memorialId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const membership = await prisma.userTenantMembership.findFirst({
      where: { userId: session.user.id, tenantId },
      include: { roles: true },
    });

    const isAdmin = membership?.roles?.some(r => r.role === 'ADMIN') ?? false;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const memorial = await prisma.memorial.findFirst({
      where: { id: memorialId, tenantId, deletedAt: null },
    });

    if (!memorial) {
      return NextResponse.json({ error: 'Memorial not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action, rejectionReason } = moderationSchema.parse(body);

    const updated = await prisma.memorial.update({
      where: { id: memorialId },
      data: action === 'approve'
        ? {
            status: 'APPROVED',
            approvedById: session.user.id,
            approvedAt: new Date(),
            rejectedById: null,
            rejectedAt: null,
            rejectionReason: null,
          }
        : {
            status: 'REJECTED',
            rejectedById: session.user.id,
            rejectedAt: new Date(),
            rejectionReason: rejectionReason || null,
            approvedById: null,
            approvedAt: null,
          },
    });

    // TODO: Send notification to submitter about approval/rejection

    return NextResponse.json({
      memorial: {
        ...updated,
        photos: updated.photos as string[],
        tags: updated.tags as string[],
      },
      message: action === 'approve' ? 'Memorial approved and published' : 'Memorial rejected',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}

// DELETE: Soft delete a memorial
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; memorialId: string }> }
) {
  try {
    const { tenantId, memorialId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memorial = await prisma.memorial.findFirst({
      where: { id: memorialId, tenantId, deletedAt: null },
    });

    if (!memorial) {
      return NextResponse.json({ error: 'Memorial not found' }, { status: 404 });
    }

    // Check permissions
    const membership = await prisma.userTenantMembership.findFirst({
      where: { userId: session.user.id, tenantId },
      include: { roles: true },
    });
    
    const isAdmin = membership?.roles?.some(r => r.role === 'ADMIN') ?? false;
    const isSubmitter = memorial.submitterId === session.user.id;

    if (!isAdmin && !isSubmitter) {
      return NextResponse.json({ error: 'Not authorized to delete this memorial' }, { status: 403 });
    }

    await prisma.memorial.update({
      where: { id: memorialId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Memorial deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
