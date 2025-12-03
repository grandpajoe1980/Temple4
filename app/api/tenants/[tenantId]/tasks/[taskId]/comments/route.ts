import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

type Params = Promise<{ tenantId: string; taskId: string }>;

// GET /api/tenants/[tenantId]/tasks/[taskId]/comments - Get task comments
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, taskId } = await params;

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

    // Verify task exists
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const comments = await prisma.taskComment.findMany({
      where: {
        taskId,
        deletedAt: null,
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

    const formattedComments = comments.map((comment) => ({
      ...comment,
      mentions: comment.mentions ? JSON.parse(comment.mentions) : [],
      author: {
        id: comment.author.id,
        displayName: comment.author.profile?.displayName || 'Unknown',
        avatarUrl: comment.author.profile?.avatarUrl,
      },
    }));

    return NextResponse.json(formattedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tenants/[tenantId]/tasks/[taskId]/comments - Add a comment
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, taskId } = await params;

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

    // Verify task exists
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content, mentions } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        authorId: session.user.id,
        content: content.trim(),
        mentions: mentions ? JSON.stringify(mentions) : null,
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

    // Log activity
    await prisma.taskActivity.create({
      data: {
        taskId,
        userId: session.user.id,
        action: 'commented',
        newValue: content.substring(0, 100),
      },
    });

    // TODO: Send notifications to mentioned users and assignee

    const formattedComment = {
      ...comment,
      mentions: comment.mentions ? JSON.parse(comment.mentions) : [],
      author: {
        id: comment.author.id,
        displayName: comment.author.profile?.displayName || 'Unknown',
        avatarUrl: comment.author.profile?.avatarUrl,
      },
    };

    return NextResponse.json(formattedComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
