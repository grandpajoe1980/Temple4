import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSmallGroupsForTenant, createSmallGroup, getMembershipForUserInTenant } from '@/lib/data';
import { z } from 'zod';
import { handleApiError, unauthorized, forbidden, validationError } from '@/lib/api-response';

const groupSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  meetingSchedule: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// GET: list small groups for a tenant (tenant members only if feature enabled)
export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return unauthorized();

  try {
    const membership = await getMembershipForUserInTenant(userId, tenantId);
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { settings: true } });

    if (!tenant || !tenant.settings || !tenant.settings.enableSmallGroups || !membership) {
      return forbidden('Forbidden');
    }

    const groups = await getSmallGroupsForTenant(tenantId);

    const isPlatformAdmin = Boolean((session?.user as any)?.isSuperAdmin);
    const isTenantAdmin = Boolean(membership.roles?.some((r: any) => r.role === 'ADMIN'));

    // Non-admin tenant members should not see groups that are marked as hidden
    let visibleGroups = groups;
    if (!isPlatformAdmin && !isTenantAdmin) {
      visibleGroups = groups.filter((g: any) => {
        if (!g.isHidden) return true;
        if (g.leaderUserId === userId) return true;
        if (g.members && g.members.some((m: any) => m.id === userId)) return true;
        return false;
      });
    }

    return NextResponse.json({ groups: visibleGroups });
    } catch (error) {
    console.error(`Failed to fetch small groups for tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'GET /api/tenants/[tenantId]/small-groups', tenantId });
  }
}

// POST: create small group (tenant members allowed)
export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) return unauthorized();

  const membership = await getMembershipForUserInTenant(userId, tenantId);
  if (!membership) return forbidden('You must be a member of this tenant to create a group.');

  const result = groupSchema.safeParse(await request.json());
  if (!result.success) return validationError(result.error.flatten().fieldErrors);

  try {
    const group = await createSmallGroup(tenantId, { ...result.data }, userId);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error(`Failed to create small group in tenant ${tenantId}:`, error);
    return handleApiError(error, { route: 'POST /api/tenants/[tenantId]/small-groups', tenantId });
  }
}
