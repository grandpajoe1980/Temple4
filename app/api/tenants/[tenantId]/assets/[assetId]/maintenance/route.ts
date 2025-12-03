import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-response';

const maintenanceSchema = z.object({
  action: z.enum(['schedule', 'start', 'complete']),
  scheduledDate: z.string().datetime().optional(), // For schedule
  notes: z.string().max(1000).optional(),
  cost: z.number().min(0).optional(), // For complete
  vendor: z.string().max(200).optional(), // For complete
  conditionAfter: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'UNKNOWN']).optional(), // For complete
});

// POST: Manage maintenance for an asset
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
    const data = maintenanceSchema.parse(body);

    if (data.action === 'schedule') {
      // Schedule maintenance
      if (!data.scheduledDate) {
        return NextResponse.json({ error: 'scheduledDate is required for scheduling' }, { status: 400 });
      }

      const updatedAsset = await prisma.asset.update({
        where: { id: assetId },
        data: {
          nextMaintenanceAt: new Date(data.scheduledDate),
          maintenanceNotes: data.notes || asset.maintenanceNotes,
        },
      });

      await prisma.assetEvent.create({
        data: {
          assetId,
          eventType: 'MAINTENANCE_SCHEDULED',
          description: `Maintenance scheduled for ${new Date(data.scheduledDate).toLocaleDateString()}`,
          notes: data.notes,
          performedBy: session.user.id,
        },
      });

      return NextResponse.json({
        asset: updatedAsset,
        message: 'Maintenance scheduled successfully',
      });

    } else if (data.action === 'start') {
      // Start maintenance - asset goes into maintenance status
      if (asset.status === 'IN_USE') {
        return NextResponse.json({ 
          error: 'Asset is currently checked out. Please check it in first.' 
        }, { status: 400 });
      }

      const updatedAsset = await prisma.asset.update({
        where: { id: assetId },
        data: {
          status: 'MAINTENANCE',
          maintenanceNotes: data.notes || asset.maintenanceNotes,
        },
      });

      await prisma.assetEvent.create({
        data: {
          assetId,
          eventType: 'MAINTENANCE_SCHEDULED', // Using this for start as well
          description: 'Maintenance started',
          notes: data.notes,
          previousStatus: asset.status,
          newStatus: 'MAINTENANCE',
          performedBy: session.user.id,
        },
      });

      return NextResponse.json({
        asset: updatedAsset,
        message: 'Maintenance started - asset is now in maintenance status',
      });

    } else {
      // Complete maintenance
      if (asset.status !== 'MAINTENANCE') {
        return NextResponse.json({ 
          error: 'Asset is not currently in maintenance' 
        }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {
        status: 'AVAILABLE',
        lastMaintenanceAt: new Date(),
        nextMaintenanceAt: null, // Clear scheduled maintenance
        maintenanceNotes: data.notes || null,
      };

      if (data.conditionAfter) {
        updateData.condition = data.conditionAfter;
      }

      const updatedAsset = await prisma.asset.update({
        where: { id: assetId },
        data: updateData,
      });

      await prisma.assetEvent.create({
        data: {
          assetId,
          eventType: 'MAINTENANCE_COMPLETED',
          description: 'Maintenance completed',
          notes: data.notes,
          previousStatus: 'MAINTENANCE',
          newStatus: 'AVAILABLE',
          previousCondition: asset.condition,
          newCondition: data.conditionAfter || asset.condition,
          maintenanceCost: data.cost,
          maintenanceVendor: data.vendor,
          performedBy: session.user.id,
        },
      });

      return NextResponse.json({
        asset: updatedAsset,
        message: 'Maintenance completed - asset is now available',
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
