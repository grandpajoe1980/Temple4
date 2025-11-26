import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMembershipForUserInTenant } from '@/lib/data';
import { z } from 'zod';
import { hasRole } from '@/lib/permissions';
import { TenantRole } from '@/types';

// 14.6 List Group Members
export async function GET(
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
        const membership = userId ? await getMembershipForUserInTenant(userId, tenantId) : null;
        const isTenantAdmin = userId ? await hasRole(userId, tenantId, [TenantRole.ADMIN]) : false;

        const group = await prisma.smallGroup.findUnique({
            where: { id: groupId },
            include: { members: true }
        });

        if (!group) {
            return NextResponse.json({ message: 'Group not found' }, { status: 404 });
        }

        const isMember = group.members.some((m: any) => m.userId === userId);
        const isLeader = group.members.some((m: any) => m.userId === userId && (m.role === 'LEADER' || m.role === 'CO_LEADER'));
        const isSuperAdmin = !!(session as any)?.user?.isSuperAdmin;

        if (!group.isPublic && !isMember && !isTenantAdmin && !isSuperAdmin && !isLeader) {
            return NextResponse.json({ message: 'This is a private group.' }, { status: 403 });
        }

        if (!membership && !isTenantAdmin && !isSuperAdmin && !isLeader) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const members = await prisma.smallGroupMembership.findMany({
            where: { groupId: groupId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profile: true,
                    }
                }
            }
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error(`Failed to fetch group members for group ${groupId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch group members' }, { status: 500 });
    }
}

const addMemberSchema = z.object({
    userId: z.string(),
});

// 14.7 Add Group Member
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string }> }
) {
    const { groupId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    if (!currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const result = addMemberSchema.safeParse(await request.json());
    if (!result.success) {
        return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }
    const { userId } = result.data;

    try {
        // A user can request to join, or a leader can add them.
        const group = await prisma.smallGroup.findUnique({
            where: { id: groupId },
            include: { members: true }
        });

        if (!group) {
            return NextResponse.json({ message: 'Group not found' }, { status: 404 });
        }

        const userRecord = await prisma.user.findUnique({ where: { id: currentUserId } });
        const isSuperAdmin = !!userRecord?.isSuperAdmin;
        const isTenantAdmin = await hasRole(currentUserId, tenantId, [TenantRole.ADMIN]);
        const isLeader = group.members.some((m: any) => m.userId === currentUserId && (m.role === 'LEADER' || m.role === 'CO_LEADER'));
        const canManage = isLeader || isTenantAdmin || isSuperAdmin;

        // If not a manager, user can only add themselves
        if (!canManage && currentUserId !== userId) {
            return NextResponse.json({ message: 'You can only request to join for yourself.' }, { status: 403 });
        }

        // Check if user is already a member
        const existingMembership = await prisma.smallGroupMembership.findUnique({
            where: { groupId_userId: { groupId: groupId, userId: userId } }
        });

        if (existingMembership) {
            return NextResponse.json({ message: 'User is already a member of this group.' }, { status: 409 });
        }

        // Ensure target user is an approved tenant member when inviting/adding
        const targetTenantMembership = await getMembershipForUserInTenant(userId, tenantId);
        if (!targetTenantMembership || targetTenantMembership.status !== 'APPROVED') {
            return NextResponse.json({ message: 'Invites can only be sent to approved tenant members.' }, { status: 400 });
        }

        // If a manager is adding someone else, treat it as an invitation that immediately approves membership
        if (canManage && currentUserId !== userId) {
            const created = await prisma.smallGroupMembership.create({
                data: {
                    groupId,
                    userId,
                    role: 'MEMBER',
                    status: 'APPROVED',
                    addedByUserId: currentUserId,
                }
            });
            return NextResponse.json(created, { status: 201 });
        }

        // Otherwise this is a self-join; verify tenant membership (already checked above) and honor joinPolicy
        const membership = await (async () => {
            // reuse the helper in lib/data.ts
            const { joinSmallGroup } = await Promise.resolve(require('@/lib/data'));
            return joinSmallGroup(tenantId, groupId, userId);
        })();

        return NextResponse.json(membership, { status: 201 });
    } catch (error) {
        console.error(`Failed to add member to group ${groupId}:`, error);
        return NextResponse.json({ message: 'Failed to add member' }, { status: 500 });
    }
}
