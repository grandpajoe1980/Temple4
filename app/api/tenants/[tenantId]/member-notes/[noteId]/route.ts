import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type Params = Promise<{ tenantId: string; noteId: string }>;

// GET /api/tenants/[tenantId]/member-notes/[noteId] - Get note
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
      include: { roles: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const note = await prisma.memberNote.findFirst({
      where: { id: noteId, tenantId, deletedAt: null },
      include: {
        member: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        author: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        assignedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        escalatedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        followUps: {
          include: {
            assignedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
            completedBy: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching member note:', error);
    return NextResponse.json({ error: 'Failed to fetch member note' }, { status: 500 });
  }
}

// PATCH /api/tenants/[tenantId]/member-notes/[noteId] - Update note
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

    const note = await prisma.memberNote.findFirst({
      where: { id: noteId, tenantId, deletedAt: null },
    });
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      category,
      visibility,
      title,
      content,
      followUpDate,
      followUpStatus,
      assignedToId,
      escalatedToId,
      isRecurring,
      recurrenceRule,
      recurrenceEnd,
      attachments,
      tags,
      linkedTaskId,
      linkedTicketId,
      completedAt,
    } = body;

    const updatedNote = await prisma.memberNote.update({
      where: { id: noteId },
      data: {
        ...(category !== undefined && { category }),
        ...(visibility !== undefined && { visibility }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
        ...(followUpStatus !== undefined && { followUpStatus }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(escalatedToId !== undefined && { escalatedToId }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurrenceRule !== undefined && { recurrenceRule }),
        ...(recurrenceEnd !== undefined && { recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null }),
        ...(attachments !== undefined && { attachments }),
        ...(tags !== undefined && { tags }),
        ...(linkedTaskId !== undefined && { linkedTaskId }),
        ...(linkedTicketId !== undefined && { linkedTicketId }),
        ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
      },
      include: {
        member: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        author: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        assignedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        escalatedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating member note:', error);
    return NextResponse.json({ error: 'Failed to update member note' }, { status: 500 });
  }
}

// DELETE /api/tenants/[tenantId]/member-notes/[noteId] - Soft delete note
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
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

    await prisma.memberNote.update({
      where: { id: noteId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting member note:', error);
    return NextResponse.json({ error: 'Failed to delete member note' }, { status: 500 });
  }
}
