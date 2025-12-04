import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NoteCategory, NoteVisibility, FollowUpStatus } from '@prisma/client';

type Params = Promise<{ tenantId: string }>;

// GET /api/tenants/[tenantId]/member-notes - List notes
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
        include: {
          roles: true,
        },
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
    const category = searchParams.get('category') as NoteCategory | null;
    const visibility = searchParams.get('visibility') as NoteVisibility | null;
    const followUpStatus = searchParams.get('followUpStatus') as FollowUpStatus | null;
    const authorId = searchParams.get('authorId');
    const assignedToId = searchParams.get('assignedToId');
    const hasFollowUp = searchParams.get('hasFollowUp');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };

    if (memberId) where.memberId = memberId;
    if (category) where.category = category;
    if (visibility) where.visibility = visibility;
    if (followUpStatus) where.followUpStatus = followUpStatus;
    if (authorId) where.authorId = authorId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (hasFollowUp === 'true') {
      where.followUpDate = { not: null };
    }

    const [notes, total] = await Promise.all([
      prisma.memberNote.findMany({
        where,
        include: {
          member: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
          author: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
          assignedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
          escalatedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.memberNote.count({ where }),
    ]);

    // Transform notes to flatten profile data
    const transformedNotes = notes.map((note) => ({
      ...note,
      member: {
        id: note.member.id,
        displayName: note.member.profile?.displayName || 'Unknown',
        avatarUrl: note.member.profile?.avatarUrl,
      },
      author: {
        id: note.author.id,
        displayName: note.author.profile?.displayName || 'Unknown',
        avatarUrl: note.author.profile?.avatarUrl,
      },
      assignedTo: note.assignedTo ? {
        id: note.assignedTo.id,
        displayName: note.assignedTo.profile?.displayName || 'Unknown',
        avatarUrl: note.assignedTo.profile?.avatarUrl,
      } : null,
      escalatedTo: note.escalatedTo ? {
        id: note.escalatedTo.id,
        displayName: note.escalatedTo.profile?.displayName || 'Unknown',
        avatarUrl: note.escalatedTo.profile?.avatarUrl,
      } : null,
    }));

    return NextResponse.json({
      notes: transformedNotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching member notes:', error);
    return NextResponse.json({ error: 'Failed to fetch member notes' }, { status: 500 });
  }
}

// POST /api/tenants/[tenantId]/member-notes - Create note
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
        include: {
          roles: true,
        },
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
      category,
      visibility,
      title,
      content,
      followUpDate,
      assignedToId,
      isRecurring,
      recurrenceRule,
      recurrenceEnd,
      attachments,
      tags,
      linkedTaskId,
      linkedTicketId,
    } = body;

    if (!memberId || !content) {
      return NextResponse.json({ error: 'Member ID and content are required' }, { status: 400 });
    }

    // Verify member exists in tenant
    const member = await prisma.userTenantMembership.findFirst({
      where: { tenantId, userId: memberId },
    });
    if (!member) {
      return NextResponse.json({ error: 'Member not found in tenant' }, { status: 404 });
    }

    const note = await prisma.memberNote.create({
      data: {
        tenantId,
        memberId,
        authorId: session.user.id,
        category: category || 'GENERAL',
        visibility: visibility || 'STAFF',
        title,
        content,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        followUpStatus: followUpDate ? 'PENDING' : null,
        assignedToId,
        isRecurring: isRecurring || false,
        recurrenceRule,
        recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
        attachments,
        tags,
        linkedTaskId,
        linkedTicketId,
      },
      include: {
        member: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        author: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        assignedTo: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    // Transform note to flatten profile data
    const transformedNote = {
      ...note,
      member: {
        id: note.member.id,
        displayName: note.member.profile?.displayName || 'Unknown',
        avatarUrl: note.member.profile?.avatarUrl,
      },
      author: {
        id: note.author.id,
        displayName: note.author.profile?.displayName || 'Unknown',
        avatarUrl: note.author.profile?.avatarUrl,
      },
      assignedTo: note.assignedTo ? {
        id: note.assignedTo.id,
        displayName: note.assignedTo.profile?.displayName || 'Unknown',
        avatarUrl: note.assignedTo.profile?.avatarUrl,
      } : null,
    };

    return NextResponse.json(transformedNote, { status: 201 });
  } catch (error) {
    console.error('Error creating member note:', error);
    return NextResponse.json({ error: 'Failed to create member note' }, { status: 500 });
  }
}
