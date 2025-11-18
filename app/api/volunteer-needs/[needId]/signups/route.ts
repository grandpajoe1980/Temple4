import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/volunteer-needs/[needId]/signups - Sign up for a volunteer need
export async function POST(
  request: Request,
  { params }: { params: Promise<{ needId: string }> }
) {
  const { needId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    // Fetch the volunteer need
    const need = await prisma.volunteerNeed.findUnique({
      where: { id: needId },
      include: {
        signups: {
          where: {
            status: 'CONFIRMED'
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!need) {
      return NextResponse.json({ message: 'Volunteer need not found' }, { status: 404 });
    }

    // Check if user is a member of the tenant
    const membership = await prisma.userTenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: need.tenantId
        }
      }
    });

    if (!membership || membership.status !== 'APPROVED') {
      return NextResponse.json(
        { message: 'You must be an approved member to sign up for volunteer needs' },
        { status: 403 }
      );
    }

    // Check if user is already signed up
    const existingSignup = await prisma.volunteerSignup.findUnique({
      where: {
        needId_userId: {
          needId,
          userId
        }
      }
    });

    if (existingSignup) {
      if (existingSignup.status === 'CANCELED') {
        // Reactivate canceled signup
        const updatedSignup = await prisma.volunteerSignup.update({
          where: {
            id: existingSignup.id
          },
          data: {
            status: 'CONFIRMED',
            signedUpAt: new Date()
          },
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        });

        return NextResponse.json(updatedSignup);
      }

      return NextResponse.json(
        { message: 'You are already signed up for this volunteer need' },
        { status: 400 }
      );
    }

    // Check if slots are still available
    if (need.signups.length >= need.slotsNeeded) {
      return NextResponse.json(
        { message: 'All volunteer slots are filled' },
        { status: 400 }
      );
    }

    // Create signup
    const signup = await prisma.volunteerSignup.create({
      data: {
        needId,
        userId,
        status: 'CONFIRMED'
      },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        need: {
          select: {
            title: true,
            date: true,
          }
        }
      }
    });

    return NextResponse.json(signup, { status: 201 });
  } catch (error) {
    console.error(`Failed to sign up for volunteer need ${needId}:`, error);
    return NextResponse.json({ message: 'Failed to sign up' }, { status: 500 });
  }
}

// DELETE /api/volunteer-needs/[needId]/signups - Cancel volunteer signup
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ needId: string }> }
) {
  const { needId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    // Find the user's signup
    const signup = await prisma.volunteerSignup.findUnique({
      where: {
        needId_userId: {
          needId,
          userId
        }
      }
    });

    if (!signup) {
      return NextResponse.json({ message: 'Signup not found' }, { status: 404 });
    }

    if (signup.status === 'CANCELED') {
      return NextResponse.json({ message: 'Signup is already canceled' }, { status: 400 });
    }

    // Mark as canceled instead of deleting
    await prisma.volunteerSignup.update({
      where: {
        id: signup.id
      },
      data: {
        status: 'CANCELED'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to cancel signup for volunteer need ${needId}:`, error);
    return NextResponse.json({ message: 'Failed to cancel signup' }, { status: 500 });
  }
}
