import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { TicketStatus, TicketPriority, TicketCategory } from '@prisma/client';

type Params = Promise<{ tenantId: string; ticketId: string }>;

// GET /api/tenants/[tenantId]/tickets/[ticketId] - Get ticket details
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, ticketId } = await params;

    // Verify membership with staff role
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

    if (!isStaffOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        tenantId,
        deletedAt: null,
      },
      include: {
        requester: {
          include: {
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
        assignee: {
          include: {
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
        updates: {
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
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const formattedTicket = {
      ...ticket,
      attachments: ticket.attachments ? JSON.parse(ticket.attachments) : [],
      requester: ticket.requester?.profile ? {
        id: ticket.requester.id,
        displayName: ticket.requester.profile.displayName,
        avatarUrl: ticket.requester.profile.avatarUrl,
      } : null,
      assignee: ticket.assignee?.profile ? {
        id: ticket.assignee.id,
        displayName: ticket.assignee.profile.displayName,
        avatarUrl: ticket.assignee.profile.avatarUrl,
      } : null,
      updates: ticket.updates.map((update) => ({
        ...update,
        attachments: update.attachments ? JSON.parse(update.attachments) : [],
        author: update.author?.profile ? {
          id: update.author.id,
          displayName: update.author.profile.displayName,
          avatarUrl: update.author.profile.avatarUrl,
        } : null,
      })),
    };

    return NextResponse.json(formattedTicket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/tenants/[tenantId]/tickets/[ticketId] - Update a ticket
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, ticketId } = await params;

    // Verify membership with staff role
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

    if (!isStaffOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingTicket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      subject,
      status,
      priority,
      category,
      assigneeId,
    } = body;

    const updateData: Record<string, unknown> = {};
    const statusChanges: string[] = [];

    // Get user profile for activity logging
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });
    const authorName = userProfile?.displayName || session.user.email || 'Staff';

    if (subject !== undefined) {
      updateData.subject = subject.trim();
    }

    if (status !== undefined && status !== existingTicket.status) {
      updateData.status = status as TicketStatus;
      statusChanges.push(`Status changed from ${existingTicket.status} to ${status}`);
      
      // Set resolved/closed timestamps
      if (status === 'RESOLVED' && existingTicket.status !== 'RESOLVED') {
        updateData.resolvedAt = new Date();
      } else if (status === 'CLOSED' && existingTicket.status !== 'CLOSED') {
        updateData.closedAt = new Date();
      }
    }

    if (priority !== undefined && priority !== existingTicket.priority) {
      updateData.priority = priority as TicketPriority;
      statusChanges.push(`Priority changed from ${existingTicket.priority} to ${priority}`);
    }

    if (category !== undefined && category !== existingTicket.category) {
      updateData.category = category as TicketCategory;
      statusChanges.push(`Category changed from ${existingTicket.category} to ${category}`);
    }

    if (assigneeId !== undefined && assigneeId !== existingTicket.assigneeId) {
      updateData.assigneeId = assigneeId || null;
      
      if (assigneeId) {
        const newAssignee = await prisma.userProfile.findUnique({
          where: { userId: assigneeId },
        });
        statusChanges.push(`Assigned to ${newAssignee?.displayName || 'staff member'}`);
      } else {
        statusChanges.push('Unassigned');
      }
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    // Create system update for status changes
    if (statusChanges.length > 0) {
      await prisma.ticketUpdate.create({
        data: {
          ticketId: ticket.id,
          authorId: session.user.id,
          authorName,
          content: statusChanges.join('. '),
          isSystemGenerated: true,
          previousStatus: existingTicket.status,
          newStatus: status || existingTicket.status,
        },
      });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tenants/[tenantId]/tickets/[ticketId] - Soft delete a ticket
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, ticketId } = await params;

    // Verify admin role
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

    const isAdmin = membership.roles.some((r) => r.role === 'ADMIN');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

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

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
