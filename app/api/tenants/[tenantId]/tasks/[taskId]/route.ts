import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { TaskStatus, TaskPriority, TaskRecurrence } from '@prisma/client';

type Params = Promise<{ tenantId: string; taskId: string }>;

// GET /api/tenants/[tenantId]/tasks/[taskId] - Get task details
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

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId,
        deletedAt: null,
      },
      include: {
        assignee: {
          include: {
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
        createdBy: {
          include: {
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
        comments: {
          where: { deletedAt: null },
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
        activities: {
          include: {
            user: {
              include: {
                profile: {
                  select: { displayName: true, avatarUrl: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const formattedTask = {
      ...task,
      labels: task.labels ? JSON.parse(task.labels) : [],
      attachments: task.attachments ? JSON.parse(task.attachments) : [],
      assignee: task.assignee?.profile ? {
        id: task.assignee.id,
        displayName: task.assignee.profile.displayName,
        avatarUrl: task.assignee.profile.avatarUrl,
      } : null,
      createdBy: {
        id: task.createdBy.id,
        displayName: task.createdBy.profile?.displayName || 'Unknown',
        avatarUrl: task.createdBy.profile?.avatarUrl,
      },
      comments: task.comments.map((comment) => ({
        ...comment,
        mentions: comment.mentions ? JSON.parse(comment.mentions) : [],
        author: {
          id: comment.author.id,
          displayName: comment.author.profile?.displayName || 'Unknown',
          avatarUrl: comment.author.profile?.avatarUrl,
        },
      })),
      activities: task.activities.map((activity) => ({
        ...activity,
        user: {
          id: activity.user.id,
          displayName: activity.user.profile?.displayName || 'Unknown',
          avatarUrl: activity.user.profile?.avatarUrl,
        },
      })),
    };

    return NextResponse.json(formattedTask);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/tenants/[tenantId]/tasks/[taskId] - Update a task
export async function PUT(request: NextRequest, { params }: { params: Params }) {
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

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      dueDate,
      startDate,
      recurrence,
      recurrenceEndDate,
      labels,
      boardColumn,
      orderIndex,
    } = body;

    const updateData: Record<string, unknown> = {};
    const activities: Array<{ action: string; previousValue?: string; newValue?: string }> = [];

    if (title !== undefined) {
      updateData.title = title.trim();
      if (title !== existingTask.title) {
        activities.push({ action: 'title_changed', previousValue: existingTask.title, newValue: title });
      }
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (status !== undefined && status !== existingTask.status) {
      updateData.status = status as TaskStatus;
      activities.push({ action: 'status_changed', previousValue: existingTask.status, newValue: status });
      
      // Set completedAt if moving to DONE
      if (status === 'DONE' && existingTask.status !== 'DONE') {
        updateData.completedAt = new Date();
      } else if (status !== 'DONE' && existingTask.status === 'DONE') {
        updateData.completedAt = null;
      }
    }

    if (priority !== undefined && priority !== existingTask.priority) {
      updateData.priority = priority as TaskPriority;
      activities.push({ action: 'priority_changed', previousValue: existingTask.priority, newValue: priority });
    }

    if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId) {
      updateData.assigneeId = assigneeId || null;
      activities.push({ action: 'assignee_changed', previousValue: existingTask.assigneeId || 'none', newValue: assigneeId || 'none' });
    }

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
      const oldDate = existingTask.dueDate?.toISOString().split('T')[0] || 'none';
      const newDate = dueDate ? new Date(dueDate).toISOString().split('T')[0] : 'none';
      if (oldDate !== newDate) {
        activities.push({ action: 'due_date_changed', previousValue: oldDate, newValue: newDate });
      }
    }

    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
    }

    if (recurrence !== undefined) {
      updateData.recurrence = recurrence as TaskRecurrence;
    }

    if (recurrenceEndDate !== undefined) {
      updateData.recurrenceEndDate = recurrenceEndDate ? new Date(recurrenceEndDate) : null;
    }

    if (labels !== undefined) {
      updateData.labels = labels ? JSON.stringify(labels) : null;
    }

    if (boardColumn !== undefined) {
      updateData.boardColumn = boardColumn || null;
    }

    if (orderIndex !== undefined) {
      updateData.orderIndex = orderIndex;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          include: {
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
        createdBy: {
          include: {
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Create activity logs
    for (const activity of activities) {
      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          userId: session.user.id,
          action: activity.action,
          previousValue: activity.previousValue,
          newValue: activity.newValue,
        },
      });
    }

    const formattedTask = {
      ...task,
      labels: task.labels ? JSON.parse(task.labels) : [],
      attachments: task.attachments ? JSON.parse(task.attachments) : [],
      assignee: task.assignee?.profile ? {
        id: task.assignee.id,
        displayName: task.assignee.profile.displayName,
        avatarUrl: task.assignee.profile.avatarUrl,
      } : null,
      createdBy: {
        id: task.createdBy.id,
        displayName: task.createdBy.profile?.displayName || 'Unknown',
        avatarUrl: task.createdBy.profile?.avatarUrl,
      },
    };

    return NextResponse.json(formattedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tenants/[tenantId]/tasks/[taskId] - Soft delete a task
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
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
      include: {
        roles: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Check permissions - only creator or admin can delete
    const isAdmin = membership.roles.some((r) => r.role === 'ADMIN');
    if (task.createdById !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });

    // Log activity
    await prisma.taskActivity.create({
      data: {
        taskId,
        userId: session.user.id,
        action: 'deleted',
        previousValue: task.title,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
