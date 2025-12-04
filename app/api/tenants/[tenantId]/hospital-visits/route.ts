import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type Params = Promise<{ tenantId: string }>;

// GET /api/tenants/[tenantId]/hospital-visits - List hospital visits
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;
    const isSuperAdmin = Boolean((session.user as any)?.isSuperAdmin);

    // Platform admins have full access
    let isStaffOrAdmin = isSuperAdmin;

    if (!isSuperAdmin) {
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

      isStaffOrAdmin = membership.roles.some((r) =>
        ['ADMIN', 'STAFF', 'LEADER', 'MODERATOR'].includes(r.role)
      );

      if (!isStaffOrAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Check if feature is enabled (skip for platform admins)
    if (!isSuperAdmin) {
      const settings = await prisma.tenantSettings.findUnique({
        where: { tenantId },
      });

      if (!settings?.enableMemberNotes) {
        return NextResponse.json({ error: 'Member notes feature is not enabled' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const visitorId = searchParams.get('visitorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const needsFollowUp = searchParams.get('needsFollowUp');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { tenantId };

    if (memberId) where.memberId = memberId;
    if (visitorId) where.visitorId = visitorId;
    if (startDate || endDate) {
      where.visitDate = {};
      if (startDate) (where.visitDate as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.visitDate as Record<string, Date>).lte = new Date(endDate);
    }
    if (needsFollowUp === 'true') {
      where.followUpDate = { not: null };
      where.followUpAssignedToId = { not: null };
    }

    const [visits, total] = await Promise.all([
      prisma.hospitalVisit.findMany({
        where,
        include: {
          member: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
          visitor: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
          followUpAssignedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        },
        orderBy: { visitDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.hospitalVisit.count({ where }),
    ]);

    // Transform visits to flatten profile data
    const transformedVisits = visits.map((visit) => ({
      ...visit,
      member: {
        id: visit.member.id,
        displayName: visit.member.profile?.displayName || 'Unknown',
        avatarUrl: visit.member.profile?.avatarUrl,
      },
      visitor: {
        id: visit.visitor.id,
        displayName: visit.visitor.profile?.displayName || 'Unknown',
        avatarUrl: visit.visitor.profile?.avatarUrl,
      },
      followUpAssignedTo: visit.followUpAssignedTo ? {
        id: visit.followUpAssignedTo.id,
        displayName: visit.followUpAssignedTo.profile?.displayName || 'Unknown',
        avatarUrl: visit.followUpAssignedTo.profile?.avatarUrl,
      } : null,
    }));

    return NextResponse.json({
      visits: transformedVisits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching hospital visits:', error);
    return NextResponse.json({ error: 'Failed to fetch hospital visits' }, { status: 500 });
  }
}

// POST /api/tenants/[tenantId]/hospital-visits - Create hospital visit
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;
    const isSuperAdmin = Boolean((session.user as any)?.isSuperAdmin);

    // Platform admins have full access
    let isStaffOrAdmin = isSuperAdmin;

    if (!isSuperAdmin) {
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

      isStaffOrAdmin = membership.roles.some((r) =>
        ['ADMIN', 'STAFF', 'LEADER', 'MODERATOR'].includes(r.role)
      );

      if (!isStaffOrAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Check if feature is enabled (skip for platform admins)
    if (!isSuperAdmin) {
      const settings = await prisma.tenantSettings.findUnique({
        where: { tenantId },
      });

      if (!settings?.enableMemberNotes) {
        return NextResponse.json({ error: 'Member notes feature is not enabled' }, { status: 403 });
      }
    }

    const body = await request.json();
    const {
      memberId,
      hospitalName,
      roomNumber,
      visitDate,
      duration,
      supportOffered,
      serviceProvided,
      familyContacted,
      notes,
      outcome,
      nextSteps,
      followUpDate,
      followUpAssignedToId,
    } = body;

    if (!memberId || !visitDate) {
      return NextResponse.json({ error: 'Member ID and visit date are required' }, { status: 400 });
    }

    // Verify member exists in tenant
    const member = await prisma.userTenantMembership.findFirst({
      where: { tenantId, userId: memberId },
    });
    if (!member) {
      return NextResponse.json({ error: 'Member not found in tenant' }, { status: 404 });
    }

    const visit = await prisma.hospitalVisit.create({
      data: {
        tenantId,
        memberId,
        visitorId: session.user.id,
        hospitalName,
        roomNumber,
        visitDate: new Date(visitDate),
        duration,
        supportOffered: supportOffered || false,
        serviceProvided: serviceProvided || false,
        familyContacted: familyContacted || false,
        notes,
        outcome,
        nextSteps,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        followUpAssignedToId,
      },
      include: {
        member: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        visitor: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        followUpAssignedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    // Transform visit to flatten profile data
    const transformedVisit = {
      ...visit,
      member: {
        id: visit.member.id,
        displayName: visit.member.profile?.displayName || 'Unknown',
        avatarUrl: visit.member.profile?.avatarUrl,
      },
      visitor: {
        id: visit.visitor.id,
        displayName: visit.visitor.profile?.displayName || 'Unknown',
        avatarUrl: visit.visitor.profile?.avatarUrl,
      },
      followUpAssignedTo: visit.followUpAssignedTo ? {
        id: visit.followUpAssignedTo.id,
        displayName: visit.followUpAssignedTo.profile?.displayName || 'Unknown',
        avatarUrl: visit.followUpAssignedTo.profile?.avatarUrl,
      } : null,
    };

    return NextResponse.json(transformedVisit, { status: 201 });
  } catch (error) {
    console.error('Error creating hospital visit:', error);
    return NextResponse.json({ error: 'Failed to create hospital visit' }, { status: 500 });
  }
}
