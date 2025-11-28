import { withErrorHandling } from '@/lib/api-response';
import { enqueueNotification } from '@/lib/services/notification-service';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const POST = withErrorHandling(async (req) => {
  const body = await req.json();

  if (!body?.to || !body?.subject || !body?.html) {
    return NextResponse.json({ message: 'Missing required fields: to, subject, html' }, { status: 400 });
  }

  // If tenantId provided, require authenticated actor to validate membership
  const session = await getServerSession(authOptions);
  const actorUserId = session?.user?.id as string | undefined;
  if (body.tenantId && !actorUserId) {
    return NextResponse.json({ message: 'Not authenticated for tenant-scoped notification' }, { status: 401 });
  }

  const record = await enqueueNotification({
    to: body.to,
    subject: body.subject,
    html: body.html,
    text: body.text,
    tenantId: body.tenantId,
    type: body.type,
    runAt: body.runAt ? new Date(body.runAt) : undefined,
    actorUserId,
  });

  return NextResponse.json({ id: record.id });
});

import { prisma } from '@/lib/db';

// GET /api/notifications - List notifications for current user
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const offset = (page - 1) * limit;

    const whereClause: any = {
      userId,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        include: {
          actor: {
            include: {
              profile: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({ where: { userId, isRead: false } })
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalResults: totalCount,
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ message: 'Failed to fetch notifications' }, { status: 500 });
  }
}
