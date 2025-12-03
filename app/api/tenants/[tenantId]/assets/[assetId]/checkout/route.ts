import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-response';

const checkoutSchema = z.object({
  action: z.enum(['checkout', 'checkin']),
  assigneeId: z.string().optional(), // For checkout, who gets it
  dueBackAt: z.string().datetime().optional(), // For checkout, when it's due back
  notes: z.string().max(500).optional(),
  conditionOnReturn: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'UNKNOWN']).optional(), // For checkin
});

// POST: Check out or check in an asset
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; assetId: string }> }
) {
  try {
    const { tenantId, assetId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check staff access
    const membership = await prisma.userTenantMembership.findFirst({
      where: { userId: session.user.id, tenantId },
      include: { roles: true },
    });

    const isStaff = membership?.roles?.some(r => ['ADMIN', 'STAFF', 'CLERGY'].includes(r.role)) ?? false;
    if (!isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const asset = await prisma.asset.findFirst({
      where: { id: assetId, tenantId, deletedAt: null },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const body = await req.json();
    const data = checkoutSchema.parse(body);

    if (data.action === 'checkout') {
      // Can only checkout if available or reserved
      if (!['AVAILABLE', 'RESERVED'].includes(asset.status)) {
        return NextResponse.json({ 
          error: `Asset cannot be checked out - current status: ${asset.status}` 
        }, { status: 400 });
      }

      const assigneeId = data.assigneeId || session.user.id;

      // Verify assignee exists and is a member
      const assigneeMembership = await prisma.userTenantMembership.findFirst({
        where: { userId: assigneeId, tenantId },
      });

      if (!assigneeMembership) {
        return NextResponse.json({ error: 'Assignee is not a member of this tenant' }, { status: 400 });
      }

      const updatedAsset = await prisma.asset.update({
        where: { id: assetId },
        data: {
          status: 'IN_USE',
          assignedToId: assigneeId,
          assignedAt: new Date(),
          dueBackAt: data.dueBackAt ? new Date(data.dueBackAt) : null,
        },
      });

      // Create checkout event
      await prisma.assetEvent.create({
        data: {
          assetId,
          eventType: 'CHECKED_OUT',
          description: data.notes || 'Asset checked out',
          userId: assigneeId,
          previousStatus: asset.status,
          newStatus: 'IN_USE',
          performedBy: session.user.id,
          dueBackAt: data.dueBackAt ? new Date(data.dueBackAt) : null,
        },
      });

      return NextResponse.json({
        asset: updatedAsset,
        message: 'Asset checked out successfully',
      });

    } else {
      // Check in
      if (asset.status !== 'IN_USE') {
        return NextResponse.json({ 
          error: `Asset is not currently checked out - status: ${asset.status}` 
        }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {
        status: 'AVAILABLE',
        assignedToId: null,
        assignedAt: null,
        dueBackAt: null,
      };

      if (data.conditionOnReturn) {
        updateData.condition = data.conditionOnReturn;
      }

      const updatedAsset = await prisma.asset.update({
        where: { id: assetId },
        data: updateData,
      });

      // Create checkin event
      await prisma.assetEvent.create({
        data: {
          assetId,
          eventType: 'CHECKED_IN',
          description: data.notes || 'Asset checked in',
          notes: data.notes,
          userId: asset.assignedToId,
          previousStatus: 'IN_USE',
          newStatus: 'AVAILABLE',
          previousCondition: asset.condition,
          newCondition: data.conditionOnReturn || asset.condition,
          performedBy: session.user.id,
        },
      });

      return NextResponse.json({
        asset: updatedAsset,
        message: 'Asset checked in successfully',
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
