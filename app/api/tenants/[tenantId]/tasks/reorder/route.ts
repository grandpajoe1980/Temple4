import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { TaskStatus } from '@prisma/client';

type Params = Promise<{ tenantId: string }>;

// POST /api/tenants/[tenantId]/tasks/reorder - Reorder tasks (drag-and-drop)
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

    const body = await request.json();
    const { taskId, newStatus, newOrderIndex, affectedTasks } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    // Verify task exists and belongs to tenant
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

    const updates: Promise<unknown>[] = [];
    const previousStatus = task.status;

    // Update the main task
    updates.push(
      prisma.task.update({
        where: { id: taskId },
        data: {
          status: newStatus ? (newStatus as TaskStatus) : undefined,
          orderIndex: newOrderIndex !== undefined ? newOrderIndex : undefined,
          completedAt: newStatus === 'DONE' && previousStatus !== 'DONE' 
            ? new Date() 
            : newStatus !== 'DONE' && previousStatus === 'DONE'
              ? null
              : undefined,
        },
      })
    );

    // Update affected tasks (for reordering within same column)
    if (affectedTasks && Array.isArray(affectedTasks)) {
      for (const affected of affectedTasks) {
        updates.push(
          prisma.task.update({
            where: { id: affected.id },
            data: { orderIndex: affected.orderIndex },
          })
        );
      }
    }

    await Promise.all(updates);

    // Log status change if applicable
    if (newStatus && newStatus !== previousStatus) {
      await prisma.taskActivity.create({
        data: {
          taskId,
          userId: session.user.id,
          action: 'status_changed',
          previousValue: previousStatus,
          newValue: newStatus,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
