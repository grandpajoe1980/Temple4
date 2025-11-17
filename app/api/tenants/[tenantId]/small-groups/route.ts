import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMembershipForUserInTenant } from '@/lib/data';
import { z } from 'zod';

// 14.1 List Small Groups
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Any member of a tenant can see the list of small groups if the feature is enabled
    const membership = await getMembershipForUserInTenant(userId, params.tenantId);
    const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId }, include: { settings: true } });

    if (!tenant?.settings?.enableSmallGroups || !membership) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const groups = await prisma.smallGroup.findMany({
      where: { tenantId: params.tenantId },
      include: {
          _count: {
              select: { members: true }
          }
      }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error(`Failed to fetch small groups for tenant ${params.tenantId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch small groups' }, { status: 500 });
  }
}

const groupSchema = z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    isPublic: z.boolean().optional(),
});

// 14.2 Create Small Group
export async function POST(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    // Any member can create a small group
    const membership = await getMembershipForUserInTenant(userId, params.tenantId);
    if (!membership) {
        return NextResponse.json({ message: 'You must be a member of this tenant to create a group.' }, { status: 403 });
    }

    const result = groupSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        const newGroup = await prisma.smallGroup.create({
            data: {
                ...result.data,
                tenantId: params.tenantId,
                // The creator automatically becomes the leader
                members: {
                    create: {
                        userId,
                        role: 'LEADER',
                    }
                }
            },
        });

        return NextResponse.json(newGroup, { status: 201 });
    } catch (error) {
        console.error(`Failed to create small group in tenant ${params.tenantId}:`, error);
        return NextResponse.json({ message: 'Failed to create small group' }, { status: 500 });
    }
}
