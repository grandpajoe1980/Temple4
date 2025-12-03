import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-response';

const createAssetSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(['EQUIPMENT', 'FURNITURE', 'VEHICLE', 'BUILDING', 'SUPPLIES', 'INSTRUMENTS', 'LITURGICAL', 'KITCHEN', 'GROUNDS', 'OTHER']).default('OTHER'),
  serialNumber: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'UNKNOWN']).default('GOOD'),
  conditionNotes: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  storageLocation: z.string().max(200).optional(),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().min(0).optional(),
  purchasedFrom: z.string().max(200).optional(),
  warrantyExpires: z.string().datetime().optional(),
  currentValue: z.number().min(0).optional(),
  usefulLifeYears: z.number().int().min(1).optional(),
  salvageValue: z.number().min(0).optional(),
  photos: z.array(z.string().url()).optional(),
  documents: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
});

// GET: List assets for tenant
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership
    const membership = await prisma.userTenantMembership.findFirst({
      where: { userId: session.user.id, tenantId },
      include: { roles: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this tenant' }, { status: 403 });
    }

    const isAdmin = membership.roles?.some(r => r.role === 'ADMIN') ?? false;
    const isStaff = membership.roles?.some(r => ['ADMIN', 'STAFF', 'CLERGY'].includes(r.role)) ?? false;

    // Only staff and admins can view assets
    if (!isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if feature is enabled
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });

    const settings = tenant?.settings as Record<string, unknown> | null;
    if (!settings?.enableAssetManagement) {
      return NextResponse.json({ error: 'Asset management is not enabled for this tenant' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const condition = searchParams.get('condition');
    const assignedToMe = searchParams.get('assignedToMe') === 'true';
    const needsMaintenance = searchParams.get('needsMaintenance') === 'true';

    const whereClause: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { serialNumber: { contains: search } },
        { barcode: { contains: search } },
        { location: { contains: search } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    if (status) {
      whereClause.status = status;
    }

    if (condition) {
      whereClause.condition = condition;
    }

    if (assignedToMe) {
      whereClause.assignedToId = session.user.id;
    }

    if (needsMaintenance) {
      whereClause.nextMaintenanceAt = { lte: new Date() };
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where: whereClause,
        include: {
          assignedTo: {
            select: { profile: { select: { displayName: true, avatarUrl: true } } },
          },
          _count: { select: { events: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.asset.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      assets: assets.map(a => ({
        ...a,
        assignedTo: a.assignedTo?.profile || null,
        eventCount: a._count.events,
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

// POST: Create a new asset
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
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

    // Check if feature is enabled
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });

    const settings = tenant?.settings as Record<string, unknown> | null;
    if (!settings?.enableAssetManagement) {
      return NextResponse.json({ error: 'Asset management is not enabled for this tenant' }, { status: 403 });
    }

    const body = await req.json();
    const data = createAssetSchema.parse(body);

    // Check barcode uniqueness if provided
    if (data.barcode) {
      const existingBarcode = await prisma.asset.findFirst({
        where: { tenantId, barcode: data.barcode, deletedAt: null },
      });
      if (existingBarcode) {
        return NextResponse.json({ error: 'An asset with this barcode already exists' }, { status: 409 });
      }
    }

    const asset = await prisma.asset.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        category: data.category,
        serialNumber: data.serialNumber,
        barcode: data.barcode,
        model: data.model,
        manufacturer: data.manufacturer,
        condition: data.condition,
        conditionNotes: data.conditionNotes,
        location: data.location,
        storageLocation: data.storageLocation,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchasePrice: data.purchasePrice,
        purchasedFrom: data.purchasedFrom,
        warrantyExpires: data.warrantyExpires ? new Date(data.warrantyExpires) : null,
        currentValue: data.currentValue ?? data.purchasePrice,
        usefulLifeYears: data.usefulLifeYears,
        salvageValue: data.salvageValue,
        photos: data.photos ?? [],
        documents: data.documents ?? [],
        tags: data.tags ?? [],
        createdBy: session.user.id,
        status: 'AVAILABLE',
      },
    });

    // Create creation event
    await prisma.assetEvent.create({
      data: {
        assetId: asset.id,
        eventType: 'CREATED',
        description: 'Asset created',
        performedBy: session.user.id,
        newStatus: 'AVAILABLE',
        newCondition: data.condition,
      },
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
