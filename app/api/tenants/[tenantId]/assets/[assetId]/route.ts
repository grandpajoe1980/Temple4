import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-response';

const updateAssetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  category: z.enum(['EQUIPMENT', 'FURNITURE', 'VEHICLE', 'BUILDING', 'SUPPLIES', 'INSTRUMENTS', 'LITURGICAL', 'KITCHEN', 'GROUNDS', 'OTHER']).optional(),
  serialNumber: z.string().max(100).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  manufacturer: z.string().max(100).optional().nullable(),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RESERVED', 'RETIRED', 'DISPOSED']).optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'UNKNOWN']).optional(),
  conditionNotes: z.string().max(500).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  storageLocation: z.string().max(200).optional().nullable(),
  purchaseDate: z.string().datetime().optional().nullable(),
  purchasePrice: z.number().min(0).optional().nullable(),
  purchasedFrom: z.string().max(200).optional().nullable(),
  warrantyExpires: z.string().datetime().optional().nullable(),
  currentValue: z.number().min(0).optional().nullable(),
  usefulLifeYears: z.number().int().min(1).optional().nullable(),
  salvageValue: z.number().min(0).optional().nullable(),
  nextMaintenanceAt: z.string().datetime().optional().nullable(),
  maintenanceNotes: z.string().max(1000).optional().nullable(),
  photos: z.array(z.string().url()).optional(),
  documents: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
});

// GET: Get asset details
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; assetId: string }> }
) {
  try {
    const { tenantId, assetId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership
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
      include: {
        assignedTo: {
          select: { profile: { select: { displayName: true, avatarUrl: true } } },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            user: {
              select: { profile: { select: { displayName: true, avatarUrl: true } } },
            },
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({
      asset: {
        ...asset,
        assignedTo: asset.assignedTo?.profile || null,
        events: asset.events.map(e => ({
          ...e,
          user: e.user?.profile || null,
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH: Update asset
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; assetId: string }> }
) {
  try {
    const { tenantId, assetId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    const membership = await prisma.userTenantMembership.findFirst({
      where: { userId: session.user.id, tenantId },
      include: { roles: true },
    });

    const isAdmin = membership?.roles?.some(r => r.role === 'ADMIN') ?? false;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingAsset = await prisma.asset.findFirst({
      where: { id: assetId, tenantId, deletedAt: null },
    });

    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const body = await req.json();
    const data = updateAssetSchema.parse(body);

    // Check barcode uniqueness if changed
    if (data.barcode && data.barcode !== existingAsset.barcode) {
      const existingBarcode = await prisma.asset.findFirst({
        where: { tenantId, barcode: data.barcode, deletedAt: null, id: { not: assetId } },
      });
      if (existingBarcode) {
        return NextResponse.json({ error: 'An asset with this barcode already exists' }, { status: 409 });
      }
    }

    // Track changes for audit
    const changes: string[] = [];
    let statusChanged = false;
    let conditionChanged = false;
    let locationChanged = false;

    if (data.status && data.status !== existingAsset.status) {
      statusChanged = true;
      changes.push(`Status: ${existingAsset.status} → ${data.status}`);
    }

    if (data.condition && data.condition !== existingAsset.condition) {
      conditionChanged = true;
      changes.push(`Condition: ${existingAsset.condition} → ${data.condition}`);
    }

    if (data.location !== undefined && data.location !== existingAsset.location) {
      locationChanged = true;
      changes.push(`Location: ${existingAsset.location || 'None'} → ${data.location || 'None'}`);
    }

    const asset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.model !== undefined && { model: data.model }),
        ...(data.manufacturer !== undefined && { manufacturer: data.manufacturer }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.condition !== undefined && { condition: data.condition }),
        ...(data.conditionNotes !== undefined && { conditionNotes: data.conditionNotes }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.storageLocation !== undefined && { storageLocation: data.storageLocation }),
        ...(data.purchaseDate !== undefined && { purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null }),
        ...(data.purchasePrice !== undefined && { purchasePrice: data.purchasePrice }),
        ...(data.purchasedFrom !== undefined && { purchasedFrom: data.purchasedFrom }),
        ...(data.warrantyExpires !== undefined && { warrantyExpires: data.warrantyExpires ? new Date(data.warrantyExpires) : null }),
        ...(data.currentValue !== undefined && { currentValue: data.currentValue }),
        ...(data.usefulLifeYears !== undefined && { usefulLifeYears: data.usefulLifeYears }),
        ...(data.salvageValue !== undefined && { salvageValue: data.salvageValue }),
        ...(data.nextMaintenanceAt !== undefined && { nextMaintenanceAt: data.nextMaintenanceAt ? new Date(data.nextMaintenanceAt) : null }),
        ...(data.maintenanceNotes !== undefined && { maintenanceNotes: data.maintenanceNotes }),
        ...(data.photos !== undefined && { photos: data.photos }),
        ...(data.documents !== undefined && { documents: data.documents }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.status === 'RETIRED' && { retiredAt: new Date() }),
        ...(data.status === 'DISPOSED' && { disposedAt: new Date() }),
      },
    });

    // Create event for significant changes
    if (changes.length > 0) {
      let eventType: string = 'UPDATED';
      if (statusChanged && data.status === 'RETIRED') eventType = 'RETIRED';
      else if (statusChanged && data.status === 'DISPOSED') eventType = 'DISPOSED';
      else if (conditionChanged) eventType = 'CONDITION_UPDATED';
      else if (locationChanged) eventType = 'LOCATION_CHANGED';

      await prisma.assetEvent.create({
        data: {
          assetId,
          eventType: eventType as any,
          description: changes.join('; '),
          performedBy: session.user.id,
          previousStatus: statusChanged ? existingAsset.status : undefined,
          newStatus: statusChanged ? data.status : undefined,
          previousCondition: conditionChanged ? existingAsset.condition : undefined,
          newCondition: conditionChanged ? data.condition : undefined,
          previousLocation: locationChanged ? existingAsset.location : undefined,
          newLocation: locationChanged ? data.location : undefined,
        },
      });
    }

    return NextResponse.json({ asset });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}

// DELETE: Soft delete asset
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string; assetId: string }> }
) {
  try {
    const { tenantId, assetId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    const membership = await prisma.userTenantMembership.findFirst({
      where: { userId: session.user.id, tenantId },
      include: { roles: true },
    });

    const isAdmin = membership?.roles?.some(r => r.role === 'ADMIN') ?? false;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingAsset = await prisma.asset.findFirst({
      where: { id: assetId, tenantId, deletedAt: null },
    });

    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    await prisma.asset.update({
      where: { id: assetId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
