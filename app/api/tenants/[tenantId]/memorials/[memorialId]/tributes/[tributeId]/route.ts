import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-response';

const moderateTributeSchema = z.object({
  action: z.enum(['approve', 'reject', 'delete']),
});

// PATCH: Moderate a tribute (approve/reject/delete)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; memorialId: string; tributeId: string }> }
) {
  try {
    const { tenantId, memorialId, tributeId } = await context.params;
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

    const tribute = await prisma.memorialTribute.findFirst({
      where: { 
        id: tributeId, 
        memorialId, 
        deletedAt: null,
        memorial: { tenantId },
      },
    });

    if (!tribute) {
      return NextResponse.json({ error: 'Tribute not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action } = moderateTributeSchema.parse(body);

    if (action === 'delete') {
      await prisma.memorialTribute.update({
        where: { id: tributeId },
        data: { deletedAt: new Date() },
      });
      return NextResponse.json({ success: true, message: 'Tribute deleted' });
    }

    const updated = await prisma.memorialTribute.update({
      where: { id: tributeId },
      data: {
        isApproved: action === 'approve',
      },
    });

    return NextResponse.json({
      tribute: updated,
      message: action === 'approve' ? 'Tribute approved' : 'Tribute rejected',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}

// DELETE: User can delete their own tribute
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; memorialId: string; tributeId: string }> }
) {
  try {
    const { tenantId, memorialId, tributeId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tribute = await prisma.memorialTribute.findFirst({
      where: { 
        id: tributeId, 
        memorialId, 
        deletedAt: null,
        memorial: { tenantId },
      },
    });

    if (!tribute) {
      return NextResponse.json({ error: 'Tribute not found' }, { status: 404 });
    }

    // Check if user owns this tribute or is admin
    const membership = await prisma.userTenantMembership.findFirst({
      where: { userId: session.user.id, tenantId },
      include: { roles: true },
    });
    
    const isAdmin = membership?.roles?.some(r => r.role === 'ADMIN') ?? false;
    const isOwner = tribute.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Not authorized to delete this tribute' }, { status: 403 });
    }

    await prisma.memorialTribute.update({
      where: { id: tributeId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Tribute deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
