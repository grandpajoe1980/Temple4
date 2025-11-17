import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMembershipForUserInTenant } from '@/lib/data';
import { z } from 'zod';

// 14.3 Get Single Small Group
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string }> }
) {
    const { tenantId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  try {
    const membership = await getMembershipForUserInTenant(userId, params.tenantId);
    if (!membership) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const group = await prisma.smallGroup.findUnique({
      where: { id: params.groupId, tenantId: params.tenantId },
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

    // If group is not public, only members can see it
    const isMember = group.members.some((m: { userId: string }) => m.userId === userId);
    if (!group.isPublic && !isMember) {
        return NextResponse.json({ message: 'This is a private group.' }, { status: 403 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error(`Failed to fetch group ${params.groupId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch group' }, { status: 500 });
  }
}

const groupUpdateSchema = z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    isPublic: z.boolean().optional(),
});

// 14.4 Update Small Group
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string }> }
) {
    const { tenantId } = await params;
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
        // Only a group leader can update the group
        const groupMembership = await prisma.smallGroupMember.findUnique({
            where: { userId_smallGroupId: { userId, smallGroupId: params.groupId } }
        });

        if (groupMembership?.role !== 'LEADER') {
            return NextResponse.json({ message: 'Only group leaders can update the group.' }, { status: 403 });
        }

        const updatedGroup = await prisma.smallGroup.update({
            where: { id: params.groupId, tenantId: params.tenantId },
            data: result.data,
        });

        return NextResponse.json(updatedGroup);
    } catch (error) {
        console.error(`Failed to update group ${params.groupId}:`, error);
        return NextResponse.json({ message: 'Failed to update group' }, { status: 500 });
    }
}

// 14.5 Delete Small Group
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; groupId: string }> }
) {
    const { tenantId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Only a group leader can delete the group
        const groupMembership = await prisma.smallGroupMember.findUnique({
            where: { userId_smallGroupId: { userId, smallGroupId: params.groupId } }
        });

        if (groupMembership?.role !== 'LEADER') {
            return NextResponse.json({ message: 'Only group leaders can delete the group.' }, { status: 403 });
        }

        await prisma.smallGroup.delete({
            where: { id: params.groupId, tenantId: params.tenantId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Failed to delete group ${params.groupId}:`, error);
        return NextResponse.json({ message: 'Failed to delete group' }, { status: 500 });
    }
}
