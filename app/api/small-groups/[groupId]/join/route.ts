import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/small-groups/[groupId]/join - Convenience endpoint to join a small group
export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    // Fetch the group
    const group = await prisma.smallGroup.findUnique({
      where: { id: groupId },
      include: {
        members: true,
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    // Check if user is a member of the tenant
    const membership = await prisma.userTenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: group.tenantId
        }
      }
    });

    if (!membership || membership.status !== 'APPROVED') {
      return NextResponse.json(
        { message: 'You must be an approved member of this tenant to join groups' },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.smallGroupMembership.findFirst({
      where: {
        groupId,
        userId
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { message: 'You are already a member of this group' },
        { status: 400 }
      );
    }

    // Add user as a member
    const newMembership = await prisma.smallGroupMembership.create({
      data: {
        groupId,
        userId,
        role: 'MEMBER'
      },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        }
      }
    });

    return NextResponse.json(newMembership, { status: 201 });
  } catch (error) {
    console.error(`Failed to join group ${groupId}:`, error);
    return NextResponse.json({ message: 'Failed to join group' }, { status: 500 });
  }
}
