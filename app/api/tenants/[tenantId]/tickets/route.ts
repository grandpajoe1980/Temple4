import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { TicketStatus, TicketPriority, TicketCategory, TicketSource } from '@prisma/client';

type Params = Promise<{ tenantId: string }>;

// GET /api/tenants/[tenantId]/tickets - List all tickets with filters
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;

    // Verify membership with staff or admin role
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
      ['ADMIN', 'STAFF', 'LEADER', 'MODERATOR'].includes(r.role)
    );

    if (!isStaffOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if ticketing is enabled
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings?.enableTicketing) {
      return NextResponse.json({ error: 'Ticketing is not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const assigneeId = searchParams.get('assigneeId');
    const search = searchParams.get('search');
    const myTickets = searchParams.get('myTickets') === 'true';
    const unassigned = searchParams.get('unassigned') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const whereClause: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };

    if (status) {
      whereClause.status = status as TicketStatus;
    }

    if (priority) {
      whereClause.priority = priority as TicketPriority;
    }

    if (category) {
      whereClause.category = category as TicketCategory;
    }

    if (assigneeId) {
      whereClause.assigneeId = assigneeId;
    }

    if (myTickets) {
      whereClause.assigneeId = session.user.id;
    }

    if (unassigned) {
      whereClause.assigneeId = null;
    }

    if (search) {
      whereClause.OR = [
        { subject: { contains: search } },
        { description: { contains: search } },
        { requesterName: { contains: search } },
        { requesterEmail: { contains: search } },
        { ticketNumber: !isNaN(parseInt(search)) ? parseInt(search) : undefined },
      ].filter((c) => c.ticketNumber !== undefined || !c.ticketNumber);
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: whereClause,
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
          _count: {
            select: { updates: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticket.count({ where: whereClause }),
    ]);

    const formattedTickets = tickets.map((ticket) => ({
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
      updateCount: ticket._count.updates,
    }));

    return NextResponse.json({
      tickets: formattedTickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tenants/[tenantId]/tickets - Create a new ticket
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tenantId } = await params;

    // Check if ticketing is enabled
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings?.enableTicketing) {
      return NextResponse.json({ error: 'Ticketing is not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const {
      subject,
      description,
      category = 'GENERAL',
      priority = 'NORMAL',
      requesterName,
      requesterEmail,
      requesterPhone,
      source = 'WEB_FORM',
    } = body;

    if (!subject?.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    if (!requesterEmail?.trim()) {
      return NextResponse.json({ error: 'Requester email is required' }, { status: 400 });
    }

    // Get session if user is logged in
    const session = await getServerSession(authOptions);
    let requesterId: string | null = null;
    let finalRequesterName = requesterName;

    if (session?.user?.id) {
      requesterId = session.user.id;
      // Get user's display name if not provided
      if (!finalRequesterName) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { profile: true },
        });
        finalRequesterName = user?.profile?.displayName || requesterEmail;
      }
    }

    // Get next ticket number for tenant
    const lastTicket = await prisma.ticket.findFirst({
      where: { tenantId },
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    });

    const ticketNumber = (lastTicket?.ticketNumber || 0) + 1;

    // Calculate SLA based on priority
    const now = new Date();
    let slaResponseDue: Date | null = null;
    let slaResolveDue: Date | null = null;

    switch (priority) {
      case 'URGENT':
        slaResponseDue = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour
        slaResolveDue = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
        break;
      case 'HIGH':
        slaResponseDue = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
        slaResolveDue = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        break;
      case 'NORMAL':
        slaResponseDue = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours
        slaResolveDue = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours
        break;
      case 'LOW':
        slaResponseDue = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        slaResolveDue = new Date(now.getTime() + 168 * 60 * 60 * 1000); // 1 week
        break;
    }

    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        ticketNumber,
        subject: subject.trim(),
        description: description.trim(),
        category: category as TicketCategory,
        priority: priority as TicketPriority,
        source: source as TicketSource,
        requesterId,
        requesterName: finalRequesterName || requesterEmail,
        requesterEmail: requesterEmail.trim().toLowerCase(),
        requesterPhone: requesterPhone?.trim() || null,
        slaResponseDue,
        slaResolveDue,
      },
    });

    // Create initial system update
    await prisma.ticketUpdate.create({
      data: {
        ticketId: ticket.id,
        authorName: 'System',
        content: `Ticket #${ticketNumber} created`,
        isSystemGenerated: true,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
