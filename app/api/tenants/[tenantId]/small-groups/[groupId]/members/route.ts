import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getMembershipForUserInTenant } from '@/lib/data';
import { z } from 'zod';

const prisma = new PrismaClient();

// 14.6 List Group Members
export async function GET(
  request: Request,
  { params }: { params: { tenantId: string; groupId: string } }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    try {
        const membership = await getMembershipForUserInTenant(userId, params.tenantId);
        if (!membership) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const group = await prisma.smallGroup.findUnique({
            where: { id: params.groupId },
            include: { members: true }
        });

        if (!group) {
            return NextResponse.json({ message: 'Group not found' }, { status: 404 });
        }

        const isMember = group.members.some((m: any) => m.userId === userId);
        if (!group.isPublic && !isMember) {
            return NextResponse.json({ message: 'This is a private group.' }, { status: 403 });
        }

        const members = await prisma.smallGroupMember.findMany({
            where: { smallGroupId: params.groupId },
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
        console.error(`Failed to fetch group members for group ${params.groupId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch group members' }, { status: 500 });
    }
}

const addMemberSchema = z.object({
    userId: z.string(),
});

// 14.7 Add Group Member
export async function POST(
  request: Request,
  { params }: { params: { tenantId: string; groupId: string } }
) {
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
            where: { id: params.groupId },
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
        const existingMembership = await prisma.smallGroupMember.findFirst({
            where: { smallGroupId: params.groupId, userId: userId }
        });

        if (existingMembership) {
            return NextResponse.json({ message: 'User is already a member of this group.' }, { status: 409 });
        }

        const newMember = await prisma.smallGroupMember.create({
            data: {
                smallGroupId: params.groupId,
                userId: userId,
                role: 'MEMBER', // Defaults to member, leaders can change this later
            }
        });

        return NextResponse.json(newMember, { status: 201 });
    } catch (error) {
        console.error(`Failed to add member to group ${params.groupId}:`, error);
        return NextResponse.json({ message: 'Failed to add member' }, { status: 500 });
    }
}
