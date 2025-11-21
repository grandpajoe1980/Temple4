import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getMembershipForUserInTenant } from '@/lib/data';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

// 14.3 Get Single Small Group
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string }> }
) {
    const { groupId, tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const membership = userId ? await getMembershipForUserInTenant(userId, tenantId) : null;

    const group = await prisma.smallGroup.findUnique({
      where: { id: groupId },
      include: {
          members: {
              include: {
                  user: { select: { id: true, profile: true } }
              }
          }
      }
    });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    if (group.tenantId !== tenantId) return NextResponse.json({ message: 'Tenant mismatch' }, { status: 400 });

    // If group is not public, only approved tenant members / group members can see it
    if (!group.isPublic) {
        if (!membership || membership.status !== 'APPROVED') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
        const isMember = group.members.some((m: any) => m.userId === userId);
        if (!isMember) return NextResponse.json({ message: 'This is a private group.' }, { status: 403 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error(`Failed to fetch group ${groupId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch group' }, { status: 500 });
  }
}

const groupUpdateSchema = z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    isPublic: z.boolean().optional(),
    isHidden: z.boolean().optional(),
    leaderUserId: z.string().optional(),
    meetingSchedule: z.string().optional(),
    isActive: z.boolean().optional(),
});

// 14.4 Update Small Group
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string }> }
) {
    const { groupId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const result = groupUpdateSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    try {
        // Only a group leader or tenant admin (or platform super-admin) can update the group
        const groupMembership = await prisma.smallGroupMembership.findUnique({
            where: { groupId_userId: { groupId: groupId, userId: userId } }
        });

        const userRecord = await prisma.user.findUnique({ where: { id: userId } });
        const isSuperAdmin = !!userRecord?.isSuperAdmin;
        const isAdmin = isSuperAdmin || await hasRole(userId, tenantId, [TenantRole.ADMIN]);
        if (groupMembership?.role !== 'LEADER' && !isAdmin) {
            return NextResponse.json({ message: 'Only group leaders, tenant admins, or platform super-admins can update the group.' }, { status: 403 });
        }

        // If leaderUserId is provided, ensure the leader membership exists and is APPROVED/LEADER
        const dataToUpdate: any = { ...result.data };

        // Perform update first (so updatedAt etc. are set)
        const updatedGroup = await prisma.smallGroup.update({
            where: { id: groupId },
            data: dataToUpdate,
        });

        if (result.data.leaderUserId) {
            try {
                await prisma.smallGroupMembership.upsert({
                    where: { groupId_userId: { groupId, userId: result.data.leaderUserId } },
                    create: {
                        groupId,
                        userId: result.data.leaderUserId,
                        role: 'LEADER',
                        status: 'APPROVED',
                        addedByUserId: userId,
                    },
                    update: {
                        role: 'LEADER',
                        status: 'APPROVED',
                    }
                });
            } catch (e) {
                console.error(`Failed to ensure leader membership for ${result.data.leaderUserId} on group ${groupId}:`, e);
            }
        }

        return NextResponse.json(updatedGroup);
    } catch (error) {
        console.error(`Failed to update group ${groupId}:`, error);
        return NextResponse.json({ message: 'Failed to update group' }, { status: 500 });
    }
}

// 14.5 Delete Small Group
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string }> }
) {
    const { groupId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Only a group leader or tenant admin can archive the group
        const groupMembership = await prisma.smallGroupMembership.findUnique({
            where: { groupId_userId: { groupId: groupId, userId: userId } }
        });

        // Allow platform super-admins to archive groups as well
        const userRecord = await prisma.user.findUnique({ where: { id: userId } });
        const isSuperAdmin = !!userRecord?.isSuperAdmin;
        const isAdminDelete = isSuperAdmin || await hasRole(userId, tenantId, [TenantRole.ADMIN]);
        if (groupMembership?.role !== 'LEADER' && !isAdminDelete) {
            return NextResponse.json({ message: 'Only group leaders, tenant admins, or platform super-admins can archive the group.' }, { status: 403 });
        }

        await prisma.smallGroup.update({
            where: { id: groupId },
            data: { archivedAt: new Date(), isActive: false },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete group ${groupId}:`, error);
        return NextResponse.json({ message: 'Failed to delete group' }, { status: 500 });
    }
}
