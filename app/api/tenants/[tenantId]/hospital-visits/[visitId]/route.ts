import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type Params = Promise<{ tenantId: string; visitId: string }>;

// GET /api/tenants/[tenantId]/hospital-visits/[visitId] - Get visit
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, visitId } = await params;

    // Verify membership
    const membership = await prisma.userTenantMembership.findFirst({
      where: {
        userId: session.user.id,
        tenantId,
        status: 'APPROVED',
      },
      include: { roles: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const visit = await prisma.hospitalVisit.findFirst({
      where: { id: visitId, tenantId },
      include: {
        member: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        visitor: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        followUpAssignedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    return NextResponse.json(visit);
  } catch (error) {
    console.error('Error fetching hospital visit:', error);
    return NextResponse.json({ error: 'Failed to fetch hospital visit' }, { status: 500 });
  }
}

// PATCH /api/tenants/[tenantId]/hospital-visits/[visitId] - Update visit
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, visitId } = await params;

    // Verify membership with staff role
    const membership = await prisma.userTenantMembership.findFirst({
      where: {
        userId: session.user.id,
        tenantId,
        status: 'APPROVED',
      },
      include: { roles: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isStaffOrAdmin = membership.roles.some((r) =>
      ['ADMIN', 'STAFF', 'LEADER', 'MODERATOR'].includes(r.role)
    );

    if (!isStaffOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const visit = await prisma.hospitalVisit.findFirst({
      where: { id: visitId, tenantId },
    });
    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      hospitalName,
      roomNumber,
      visitDate,
      duration,
      prayerOffered,
      communionGiven,
      familyContacted,
      notes,
      outcome,
      nextSteps,
      followUpDate,
      followUpAssignedToId,
    } = body;

    const updatedVisit = await prisma.hospitalVisit.update({
      where: { id: visitId },
      data: {
        ...(hospitalName !== undefined && { hospitalName }),
        ...(roomNumber !== undefined && { roomNumber }),
        ...(visitDate !== undefined && { visitDate: new Date(visitDate) }),
        ...(duration !== undefined && { duration }),
        ...(prayerOffered !== undefined && { prayerOffered }),
        ...(communionGiven !== undefined && { communionGiven }),
        ...(familyContacted !== undefined && { familyContacted }),
        ...(notes !== undefined && { notes }),
        ...(outcome !== undefined && { outcome }),
        ...(nextSteps !== undefined && { nextSteps }),
        ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
        ...(followUpAssignedToId !== undefined && { followUpAssignedToId }),
      },
      include: {
        member: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        visitor: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        followUpAssignedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    return NextResponse.json(updatedVisit);
  } catch (error) {
    console.error('Error updating hospital visit:', error);
    return NextResponse.json({ error: 'Failed to update hospital visit' }, { status: 500 });
  }
}

// DELETE /api/tenants/[tenantId]/hospital-visits/[visitId] - Delete visit
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, visitId } = await params;

    // Verify membership with staff role
    const membership = await prisma.userTenantMembership.findFirst({
      where: {
        userId: session.user.id,
        tenantId,
        status: 'APPROVED',
      },
      include: { roles: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isStaffOrAdmin = membership.roles.some((r) =>
      ['ADMIN', 'STAFF', 'LEADER', 'MODERATOR'].includes(r.role)
    );

    if (!isStaffOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const visit = await prisma.hospitalVisit.findFirst({
      where: { id: visitId, tenantId },
    });
    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    await prisma.hospitalVisit.delete({
      where: { id: visitId },
    });

    return NextResponse.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting hospital visit:', error);
    return NextResponse.json({ error: 'Failed to delete hospital visit' }, { status: 500 });
  }
}
