import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        privacySettings: true,
        accountSettings: true,
        memberships: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            roles: {
              select: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    // Format memberships for easier consumption
    const tenantMemberships = user.memberships.map((membership: any) => ({
      tenantId: membership.tenant.id,
      tenantName: membership.tenant.name,
      tenantSlug: membership.tenant.slug,
      status: membership.status,
      roles: membership.roles.map((r: any) => r.role),
    }));

    return NextResponse.json({
      ...userWithoutPassword,
      tenantMemberships,
    });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ message: 'Failed to fetch user' }, { status: 500 });
  }
}
