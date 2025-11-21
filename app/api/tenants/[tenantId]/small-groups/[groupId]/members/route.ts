import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMembershipForUserInTenant } from '@/lib/data';
import { z } from 'zod';

// 14.6 List Group Members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string }> }
) {
    const { groupId, tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    try {
        const membership = await getMembershipForUserInTenant(userId, tenantId);
        if (!membership) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const group = await prisma.smallGroup.findUnique({
            where: { id: groupId },
            include: { members: true }
        });

        if (!group) {
            return NextResponse.json({ message: 'Group not found' }, { status: 404 });
        }

        const isMember = group.members.some((m: any) => m.userId === userId);
        if (!group.isPublic && !isMember) {
            return NextResponse.json({ message: 'This is a private group.' }, { status: 403 });
        }

        const members = await prisma.smallGroupMembership.findMany({
            where: { groupId: groupId },
            include: {
                user: {
                    select: {
                        id: true,
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

        const isLeader = group.members.some((m: any) => m.userId === currentUserId && m.role === 'LEADER');

        // If not the leader, user can only add themselves
        if (!isLeader && currentUserId !== userId) {
            return NextResponse.json({ message: 'You can only request to join for yourself.' }, { status: 403 });
        }

        // Check if user is already a member
        const existingMembership = await prisma.smallGroupMembership.findUnique({
            where: { groupId_userId: { groupId: groupId, userId: userId } }
        });

        if (existingMembership) {
            return NextResponse.json({ message: 'User is already a member of this group.' }, { status: 409 });
        }

        // If leader is adding someone, create APPROVED membership immediately
        if (isLeader && currentUserId !== userId) {
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

        // Otherwise this is a self-join; verify tenant membership
        const tenantMembership = await getMembershipForUserInTenant(userId, tenantId);
        if (!tenantMembership || tenantMembership.status !== 'APPROVED') {
            return NextResponse.json({ message: 'You must be an approved tenant member to join groups' }, { status: 403 });
        }

        // Use shared business logic to create membership respecting joinPolicy
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
