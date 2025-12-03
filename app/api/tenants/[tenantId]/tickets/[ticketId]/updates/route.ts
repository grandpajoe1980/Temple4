import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

type Params = Promise<{ tenantId: string; ticketId: string }>;

// GET /api/tenants/[tenantId]/tickets/[ticketId]/updates - Get ticket updates
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, ticketId } = await params;

    // Verify membership
    const membership = await prisma.userTenantMembership.findFirst({
      where: {
        userId: session.user.id,
        tenantId,
        status: 'APPROVED',
      },
      include: {
        roles: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isStaffOrAdmin = membership.roles.some((r) => 
      ['ADMIN', 'STAFF', 'CLERGY', 'MODERATOR'].includes(r.role)
    );

    // Verify ticket exists
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Non-staff can only see their own tickets
    if (!isStaffOrAdmin && ticket.requesterId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = await prisma.ticketUpdate.findMany({
      where: {
        ticketId,
        // Non-staff cannot see internal notes
        ...(isStaffOrAdmin ? {} : { isInternal: false }),
      },
      include: {
        author: {
          include: {
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formattedUpdates = updates.map((update) => ({
      ...update,
      attachments: update.attachments ? JSON.parse(update.attachments) : [],
      author: update.author?.profile ? {
        id: update.author.id,
        displayName: update.author.profile.displayName,
        avatarUrl: update.author.profile.avatarUrl,
      } : null,
    }));

    return NextResponse.json(formattedUpdates);
  } catch (error) {
    console.error('Error fetching updates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tenants/[tenantId]/tickets/[ticketId]/updates - Add a reply/update
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, ticketId } = await params;

    // Verify membership
    const membership = await prisma.userTenantMembership.findFirst({
      where: {
        userId: session.user.id,
        tenantId,
        status: 'APPROVED',
      },
      include: {
        roles: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isStaffOrAdmin = membership.roles.some((r) => 
      ['ADMIN', 'STAFF', 'CLERGY', 'MODERATOR'].includes(r.role)
    );

    // Verify ticket exists
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Non-staff can only reply to their own tickets
    if (!isStaffOrAdmin && ticket.requesterId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { content, isInternal = false } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Only staff can create internal notes
    if (isInternal && !isStaffOrAdmin) {
      return NextResponse.json({ error: 'Cannot create internal notes' }, { status: 403 });
    }

    // Get author name
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });
    const authorName = userProfile?.displayName || session.user.email || 'User';

    const update = await prisma.ticketUpdate.create({
      data: {
        ticketId,
        authorId: session.user.id,
        authorName,
        content: content.trim(),
        isInternal,
      },
      include: {
        author: {
          include: {
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Update ticket's firstResponseAt if this is staff's first reply
    if (isStaffOrAdmin && !ticket.firstResponseAt && !isInternal) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { firstResponseAt: new Date() },
      });
    }

    // If closed ticket gets a reply, reopen it
    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { 
          status: 'IN_PROGRESS',
          resolvedAt: null,
          closedAt: null,
        },
      });
    }

    const formattedUpdate = {
      ...update,
      attachments: [],
      author: update.author?.profile ? {
        id: update.author.id,
        displayName: update.author.profile.displayName,
        avatarUrl: update.author.profile.avatarUrl,
      } : null,
    };

    return NextResponse.json(formattedUpdate, { status: 201 });
  } catch (error) {
    console.error('Error creating update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
