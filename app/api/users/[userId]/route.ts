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

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        privacySettings: true,
        accountSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;
    const isSuperAdmin = (session?.user as any)?.isSuperAdmin;

    if (!session || !currentUserId) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // A user can update their own profile, or a super admin can update any profile.
    if (currentUserId !== userId && !isSuperAdmin) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const { profile, privacySettings, accountSettings } = await request.json();

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                profile: {
                    update: profile,
                },
                privacySettings: {
                    update: privacySettings,
                },
                accountSettings: {
                    update: accountSettings,
                },
            },
            include: {
                profile: true,
                privacySettings: true,
                accountSettings: true,
            },
        });

        const { password, ...userWithoutPassword } = updatedUser;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error(`Failed to update user ${userId}:`, error);
        return NextResponse.json({ message: 'Failed to update user' }, { status: 500 });
    }
}
