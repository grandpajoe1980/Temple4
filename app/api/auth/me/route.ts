import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = session.user.id;

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

    const formatAlertChannels = (channels: any) => {
      if (Array.isArray(channels)) {
        return channels.filter((entry: any): entry is string => typeof entry === 'string');
      }

      if (typeof channels === 'string') {
        try {
          const parsed = JSON.parse(channels);
          if (Array.isArray(parsed)) {
            return parsed.filter((entry: any): entry is string => typeof entry === 'string');
          }
        } catch {
          // fall through to empty array
        }
      }

      return [];
    };

    // Format memberships for easier consumption
    const tenantMemberships = user.memberships.map((membership: any) => ({
      tenantId: membership.tenant.id,
      tenantName: membership.tenant.name,
      tenantSlug: membership.tenant.slug,
      status: membership.status,
      roles: membership.roles.map((r: any) => r.role),
      welcomePacketUrl: membership.welcomePacketUrl,
      welcomePacketVersion: membership.welcomePacketVersion,
      onboardingStatus: membership.onboardingStatus,
      alertSentAt: membership.alertSentAt,
      alertChannels: formatAlertChannels(membership.alertChannels),
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

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const prefs = body?.notificationPreferences;
    if (!prefs) {
      return NextResponse.json({ message: 'No preferences provided' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: prefs as any,
      },
    });

    const { password, ...userWithoutPassword } = updated;
    return NextResponse.json({ ...userWithoutPassword });
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return NextResponse.json({ message: 'Failed to update preferences' }, { status: 500 });
  }
}
