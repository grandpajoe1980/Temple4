import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type Params = Promise<{ tenantId: string; noteId: string }>;

// GET /api/tenants/[tenantId]/member-notes/[noteId]/follow-ups - List follow-ups
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, noteId } = await params;

    // Verify membership
    const membership = await prisma.userTenantMembership.findFirst({
      where: {
        userId: session.user.id,
        tenantId,
        status: 'APPROVED',
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const note = await prisma.memberNote.findFirst({
      where: { id: noteId, tenantId, deletedAt: null },
    });
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const followUps = await prisma.noteFollowUp.findMany({
      where: { noteId },
      include: {
        assignedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        completedBy: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(followUps);
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
  }
}

// POST /api/tenants/[tenantId]/member-notes/[noteId]/follow-ups - Create follow-up
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, noteId } = await params;

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

    const note = await prisma.memberNote.findFirst({
      where: { id: noteId, tenantId, deletedAt: null },
    });
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      dueDate,
      assignedToId,
      priority,
    } = body;

    if (!title || !dueDate) {
      return NextResponse.json({ error: 'Title and due date are required' }, { status: 400 });
    }

    const followUp = await prisma.noteFollowUp.create({
      data: {
        noteId,
        title,
        description,
        dueDate: new Date(dueDate),
        assignedToId: assignedToId || session.user.id,
        priority: priority || 'MEDIUM',
        status: 'PENDING',
      },
      include: {
        assignedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    return NextResponse.json(followUp, { status: 201 });
  } catch (error) {
    console.error('Error creating follow-up:', error);
    return NextResponse.json({ error: 'Failed to create follow-up' }, { status: 500 });
  }
}

// PATCH /api/tenants/[tenantId]/member-notes/[noteId]/follow-ups - Update follow-up
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, noteId } = await params;

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

    const body = await request.json();
    const { followUpId, status, completedNotes } = body;

    if (!followUpId) {
      return NextResponse.json({ error: 'Follow-up ID is required' }, { status: 400 });
    }

    const followUp = await prisma.noteFollowUp.findFirst({
      where: { id: followUpId, noteId },
    });
    if (!followUp) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    const updatedFollowUp = await prisma.noteFollowUp.update({
      where: { id: followUpId },
      data: {
        ...(status !== undefined && { status }),
        ...(completedNotes !== undefined && { completedNotes }),
        ...(status === 'COMPLETED' && {
          completedAt: new Date(),
          completedById: session.user.id,
        }),
      },
      include: {
        assignedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        completedBy: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    return NextResponse.json(updatedFollowUp);
  } catch (error) {
    console.error('Error updating follow-up:', error);
    return NextResponse.json({ error: 'Failed to update follow-up' }, { status: 500 });
  }
}
