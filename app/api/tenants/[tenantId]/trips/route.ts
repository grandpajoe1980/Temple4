import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTripsForTenant, createTrip, getMembershipForUserInTenant } from '@/lib/data';
import { z } from 'zod';
import { unauthorized, forbidden, validationError, handleApiError } from '@/lib/api-response';

const tripSchema = z.object({
  name: z.string().min(3),
  summary: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  departureLocation: z.string().optional(),
  destination: z.string().optional(),
  meetingPoint: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  waitlistEnabled: z.boolean().optional(),
  costCents: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().min(3).max(5).optional(),
  depositCents: z.number().int().nonnegative().nullable().optional(),
  allowPartialPayments: z.boolean().optional(),
  allowScholarships: z.boolean().optional(),
  waiverRequired: z.boolean().optional(),
  waiverUrl: z.string().url().optional(),
  formUrl: z.string().url().optional(),
  fundraisingEnabled: z.boolean().optional(),
  fundraisingGoalCents: z.number().int().nonnegative().nullable().optional(),
  fundraisingDeadline: z.string().datetime().optional(),
  fundraisingVisibility: z.string().optional(),
  allowSponsorship: z.boolean().optional(),
  colorHex: z.string().optional(),
  joinPolicy: z.enum(['OPEN', 'APPROVAL']).optional(),
  isPublic: z.boolean().optional(),
});

// GET: list trips for a tenant (tenant members only if feature enabled)
export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return unauthorized();

  try {
    const membership = await getMembershipForUserInTenant(userId, tenantId);
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { settings: true } });

    if (!tenant || !tenant.settings || !tenant.settings.enableTrips || !membership) {
      return forbidden('Forbidden');
    }

    const trips = await getTripsForTenant(tenantId);

    const isPlatformAdmin = Boolean((session?.user as any)?.isSuperAdmin);
    const isTenantAdmin = Boolean(membership.roles?.some((r: any) => r.role === 'ADMIN'));

    let visibleTrips = trips;
    if (!isPlatformAdmin && !isTenantAdmin) {
      visibleTrips = trips.filter((t: any) => {
        if (!t.isHidden) return true;
        if (t.leaderUserId === userId || t.coLeaderUserId === userId) return true;
        if (Array.isArray(t.members) && t.members.some((m: any) => m.user?.id === userId)) return true;
        return false;
      });
    }

    return NextResponse.json({ trips: visibleTrips });
  } catch (error) {
    console.error(`Failed to fetch trips for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/trips', tenantId });
  }
}

// POST: create trip (tenant members allowed)
export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return unauthorized();

  const membership = await getMembershipForUserInTenant(userId, tenantId);
  const isPlatformAdmin = Boolean((session?.user as any)?.isSuperAdmin);
  const membershipRoles = membership?.roles?.map((r: any) => r.role) || [];
  const isTenantManager = membershipRoles.some((role: string) => ['ADMIN', 'OWNER', 'STAFF', 'CLERGY'].includes(role));

  if (!membership && !isPlatformAdmin) {
    return forbidden('You must be a member of this tenant to create a trip.');
  }
  if (!isPlatformAdmin && !isTenantManager) {
    return forbidden('You do not have permission to create trips.');
  }

  const result = tripSchema.safeParse(await request.json());
  if (!result.success) return validationError(result.error.flatten().fieldErrors);

  try {
    const trip = await createTrip(tenantId, { ...result.data }, userId);
    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error(`Failed to create trip in tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/trips', tenantId });
  }
}
