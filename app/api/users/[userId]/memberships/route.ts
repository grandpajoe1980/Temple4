import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const currentUserId = (session.user as { id: string }).id;
  const isSuperAdmin = (session.user as { isSuperAdmin?: boolean }).isSuperAdmin;

  // Users can only see their own memberships, unless they're a super admin
  if (currentUserId !== userId && !isSuperAdmin) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const memberships = await prisma.userTenantMembership.findMany({
      where: { userId },
      include: {
        tenant: {
          include: {
            settings: true,
            branding: true,
          },
        },
        roles: true,
      },
    });

    return NextResponse.json(memberships);
  } catch (error) {
    console.error(`Failed to fetch memberships for user ${userId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch memberships' }, { status: 500 });
  }
}
