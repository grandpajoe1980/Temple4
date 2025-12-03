import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { TaskStatus, TaskPriority, TaskRecurrence } from '@prisma/client';

type Params = Promise<{ tenantId: string }>;

// GET /api/tenants/[tenantId]/tasks - List all tasks with filters
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;

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

    // Check if workboard is enabled
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings?.enableWorkboard) {
      return NextResponse.json({ error: 'Workboard is not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const search = searchParams.get('search');
    const view = searchParams.get('view') || 'board'; // board, list, calendar
    const myTasks = searchParams.get('myTasks') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const whereClause: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };

    if (status) {
      whereClause.status = status as TaskStatus;
    }

    if (priority) {
      whereClause.priority = priority as TaskPriority;
    }

    if (assigneeId) {
      whereClause.assigneeId = assigneeId;
    }

    if (myTasks) {
      whereClause.assigneeId = session.user.id;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
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
          _count: {
            select: { comments: true },
          },
        },
        orderBy: view === 'board' 
          ? [{ status: 'asc' }, { orderIndex: 'asc' }]
          : view === 'calendar'
            ? [{ dueDate: 'asc' }]
            : [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where: whereClause }),
    ]);

    const formattedTasks = tasks.map((task) => ({
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
      commentCount: task._count.comments,
    }));

    return NextResponse.json({
      tasks: formattedTasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tenants/[tenantId]/tasks - Create a new task
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;

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

    // Check if workboard is enabled
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings?.enableWorkboard) {
      return NextResponse.json({ error: 'Workboard is not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status = 'TODO',
      priority = 'NORMAL',
      assigneeId,
      dueDate,
      startDate,
      recurrence = 'NONE',
      recurrenceEndDate,
      labels,
      boardColumn,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get max order index for the status column
    const maxOrder = await prisma.task.aggregate({
      where: { tenantId, status: status as TaskStatus },
      _max: { orderIndex: true },
    });

    const task = await prisma.task.create({
      data: {
        tenantId,
        title: title.trim(),
        description: description?.trim() || null,
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        assigneeId: assigneeId || null,
        createdById: session.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        recurrence: recurrence as TaskRecurrence,
        recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
        labels: labels ? JSON.stringify(labels) : null,
        boardColumn: boardColumn || null,
        orderIndex: (maxOrder._max.orderIndex || 0) + 1,
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
      },
    });

    // Create activity log
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        userId: session.user.id,
        action: 'created',
        newValue: title,
      },
    });

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

    return NextResponse.json(formattedTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
